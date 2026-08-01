-- Cada negocio paga con una frecuencia distinta (semanal, quincenal, mensual).
-- El cálculo de horas extra sigue siendo por semana (así lo exige la ley), pero
-- Reportes ahora agrupa esas semanas según este período para mostrar un solo
-- total por período de pago.
alter table public.companies
  add column if not exists periodo_pago text not null default 'semanal'
  check (periodo_pago in ('semanal', 'quincenal', 'mensual'));
