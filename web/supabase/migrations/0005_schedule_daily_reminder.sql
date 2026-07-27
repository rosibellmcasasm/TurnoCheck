-- Programa el gatillo diario del loop de retención (recordatorio-diario).
-- El header solo lleva la publishable key (segura de commitear, es pública
-- por diseño) — la función ya tiene acceso de servicio inyectado
-- automáticamente por Supabase (SUPABASE_SERVICE_ROLE_KEY interno).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'recordatorio-diario-9am-cot',
  '0 14 * * *', -- 9:00 AM Colombia (UTC-5) = 14:00 UTC
  $$
  select net.http_post(
    url := 'https://dqnznvkyurlsjctnpizb.supabase.co/functions/v1/recordatorio-diario',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_trVfYI7hEQxsjymuHfmH2Q_Pe58Ucwc'
    ),
    body := '{}'::jsonb
  );
  $$
);
