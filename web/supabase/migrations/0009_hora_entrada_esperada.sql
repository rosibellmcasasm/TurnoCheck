-- Hora de entrada esperada por empleado (opcional) — cada negocio y cada
-- empleado puede tener un horario distinto, así que NO es una regla única
-- para toda la empresa. Sin esta hora, la app no califica llegada (no
-- inventa una tardanza para trabajos sin horario fijo, ej. obra civil).
alter table public.employees add column if not exists hora_entrada_esperada time;
