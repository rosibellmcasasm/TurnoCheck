-- Ficha de empleado extendida: contacto, disponibilidad, horario por día de
-- la semana (reemplaza la comparación de puntualidad contra un solo horario
-- fijo) y descanso diario (se resta de las horas pagadas en nómina).
alter table public.employees add column if not exists email text null;
alter table public.employees add column if not exists telefono text null;
alter table public.employees add column if not exists disponibilidad text not null default 'fijo'
  check (disponibilidad in ('fijo', 'flexible'));

-- { "lunes": { "activo": true, "entrada": "08:00", "salida": "17:00" }, "martes": {...}, ... }
alter table public.employees add column if not exists horario_semanal jsonb null;

alter table public.employees add column if not exists descanso_inicio time null;
alter table public.employees add column if not exists descanso_fin time null;
