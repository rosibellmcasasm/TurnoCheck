-- Webhook de Hotmart: tablas de seguridad (idempotencia + log) y la función
-- que aplica el cambio de plan de forma atómica. Ver docs/sistema/18-VENTA-HOTMART.md
-- ("SEGURIDAD DEL WEBHOOK DE HOTMART") — esta migración adapta ese diseño al
-- modelo real de TurnoCheck (companies + subscriptions, no "profiles").

-- ── idempotencia: Hotmart REENVÍA eventos — sin esto, doble activación/email ──
create table if not exists public.processed_events (
  event_id     text primary key,
  event_type   text not null,
  payload_hash text,
  processed_at timestamptz not null default now()
);

-- ── log de TODO intento (éxito y fallo) — lo lee el backoffice (21) para avisar
--    "sin webhooks hace N horas" o picos de intentos no autorizados ──
create table if not exists public.webhook_log (
  id          bigserial primary key,
  event_id    text,
  type        text,
  result      text not null check (result in ('applied', 'duplicate', 'illegal', 'unauthorized', 'error')),
  received_at timestamptz not null default now()
);
create index if not exists webhook_log_received_idx on public.webhook_log (received_at desc);
create index if not exists webhook_log_result_idx on public.webhook_log (result, received_at desc);

-- Tablas de servidor puro: ningún cliente (anon/authenticated) las toca jamás,
-- solo el service role del webhook (que salta RLS). RLS activo sin políticas
-- = nadie del lado cliente puede leer ni escribir.
alter table public.processed_events enable row level security;
alter table public.webhook_log enable row level security;

-- La FSM de negocio (18-VENTA-HOTMART) distingue 'refunded'/'chargeback' de
-- 'canceled' para poder BLOQUEAR que un evento viejo reentregado reactive una
-- cuenta ya reembolsada — el constraint original solo tenía 4 estados.
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('trialing', 'active', 'past_due', 'canceled', 'refunded', 'chargeback'));

-- ── la función atómica: idempotencia + transición legal + upsert, todo o nada ──
create or replace function public.apply_hotmart_event(
  p_event_id         text,
  p_event_type       text,
  p_payload_hash     text,
  p_company_id       uuid,
  p_plan             text,
  p_new_status       text,
  p_subscriber_code  text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_current text;
  v_owner_id uuid;
begin
  -- (a) idempotencia: si ya se procesó este event_id, salir sin tocar nada.
  begin
    insert into processed_events (event_id, event_type, payload_hash)
    values (p_event_id, p_event_type, p_payload_hash);
  exception when unique_violation then
    return jsonb_build_object('status', 'duplicate');
  end;

  select owner_id into v_owner_id from companies where id = p_company_id;
  if v_owner_id is null then
    return jsonb_build_object('status', 'error', 'reason', 'company_not_found');
  end if;

  select status into v_current from subscriptions where company_id = p_company_id;

  -- (b) transición ilegal: no resucitar un reembolso/chargeback con un evento
  --     de acceso reentregado (ej. un PURCHASE_APPROVED viejo reintentado).
  if v_current in ('refunded', 'chargeback') and p_new_status in ('active', 'trialing') then
    return jsonb_build_object('status', 'illegal_transition', 'from', v_current);
  end if;

  -- (c) aplicar — upsert por company_id (ya es UNIQUE en el esquema original).
  insert into subscriptions (owner_id, company_id, plan, status, hotmart_subscriber_code, updated_at)
  values (v_owner_id, p_company_id, p_plan, p_new_status, p_subscriber_code, now())
  on conflict (company_id) do update
    set status = excluded.status,
        plan = excluded.plan,
        hotmart_subscriber_code = coalesce(excluded.hotmart_subscriber_code, subscriptions.hotmart_subscriber_code),
        updated_at = now();

  -- El plan pagado también sube el límite de empleados de la empresa (si el
  -- plan cambió, ej. de micro a pyme por upgrade vía recompra).
  update companies
    set plan = p_plan,
        plan_empleados_limite = case when p_plan = 'pyme' then 15 else 5 end
    where id = p_company_id and plan is distinct from p_plan;

  return jsonb_build_object('status', 'applied', 'new_status', p_new_status);
end;
$$;

revoke execute on function public.apply_hotmart_event from anon, authenticated;
