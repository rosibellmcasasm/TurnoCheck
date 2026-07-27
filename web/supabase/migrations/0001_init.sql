-- TurnoCheck — esquema inicial (companies, employees, time_entries, subscriptions)
-- Toda tabla lleva owner_id denormalizado + índice, para que la política RLS
-- sea una comparación directa e indexada (regla de rendimiento de 25-BASE-DE-DATOS.md),
-- no un JOIN/EXISTS costoso en cada fila.

create extension if not exists "pgcrypto";

-- ── companies ────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Mi negocio',
  tipo_negocio text,
  jornadas text[] not null default '{}',
  plan text not null default 'micro' check (plan in ('micro', 'pyme')),
  plan_empleados_limite int not null default 5,
  created_at timestamptz not null default now()
);
create index if not exists companies_owner_id_idx on public.companies (owner_id);

alter table public.companies enable row level security;

create policy "companies_select_own" on public.companies
  for select using (owner_id = (select auth.uid()));
create policy "companies_insert_own" on public.companies
  for insert with check (owner_id = (select auth.uid()));
create policy "companies_update_own" on public.companies
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "companies_delete_own" on public.companies
  for delete using (owner_id = (select auth.uid()));

-- ── employees ────────────────────────────────────────────────────────────
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  nombre text not null,
  cargo text,
  salario_mensual numeric not null default 1423500,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists employees_owner_id_idx on public.employees (owner_id);
create index if not exists employees_company_id_idx on public.employees (company_id);

alter table public.employees enable row level security;

create policy "employees_select_own" on public.employees
  for select using (owner_id = (select auth.uid()));
create policy "employees_insert_own" on public.employees
  for insert with check (owner_id = (select auth.uid()));
create policy "employees_update_own" on public.employees
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "employees_delete_own" on public.employees
  for delete using (owner_id = (select auth.uid()));

-- Límite de plan aplicado EN LA BASE DE DATOS (defensa en profundidad — el
-- cliente también valida antes de intentar el insert, para mostrar el
-- paywall en vez de un error crudo, pero esto es lo que de verdad protege).
create or replace function public.check_employee_limit()
returns trigger as $$
declare
  activos int;
  limite int;
begin
  select plan_empleados_limite into limite from public.companies where id = new.company_id;
  select count(*) into activos from public.employees
    where company_id = new.company_id and activo = true;
  if activos >= limite then
    raise exception 'plan_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger employees_check_limit
  before insert on public.employees
  for each row when (new.activo = true)
  execute function public.check_employee_limit();

-- ── time_entries (marcaciones) ───────────────────────────────────────────
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  fecha date not null,
  hora_entrada time not null,
  hora_salida time,
  es_festivo boolean not null default false,
  foto_url text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
create index if not exists time_entries_owner_id_idx on public.time_entries (owner_id);
create index if not exists time_entries_employee_fecha_idx on public.time_entries (employee_id, fecha);

alter table public.time_entries enable row level security;

create policy "time_entries_select_own" on public.time_entries
  for select using (owner_id = (select auth.uid()));
create policy "time_entries_insert_own" on public.time_entries
  for insert with check (owner_id = (select auth.uid()));
create policy "time_entries_update_own" on public.time_entries
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "time_entries_delete_own" on public.time_entries
  for delete using (owner_id = (select auth.uid()));

-- ── subscriptions ────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null unique references public.companies(id) on delete cascade,
  plan text not null default 'micro' check (plan in ('micro', 'pyme')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  hotmart_subscriber_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_owner_id_idx on public.subscriptions (owner_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (owner_id = (select auth.uid()));
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (owner_id = (select auth.uid()));
create policy "subscriptions_update_own" on public.subscriptions
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- NOTA: subscriptions.status pasa a 'active' solo vía el webhook de Hotmart
-- (servidor, con el cliente admin que salta RLS) — nunca desde el cliente.
