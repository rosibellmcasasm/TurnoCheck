-- Soporte multi-jurisdicción: cada negocio elige su país/estado, que decide
-- qué motor de nómina y qué moneda usar. Por ahora: Colombia (Ley 2101) y
-- Colorado, EE.UU. (COMPS Order — horas extra semanales Y diarias).
alter table public.companies add column if not exists pais text not null default 'colombia'
  check (pais in ('colombia', 'us_colorado'));

-- Los empleados de negocios en EE.UU. se pagan por hora (no salario mensual
-- fijo) — columna separada para no reusar salario_mensual con otra unidad.
alter table public.employees add column if not exists tarifa_hora numeric null;
