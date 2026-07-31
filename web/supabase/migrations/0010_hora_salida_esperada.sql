-- Misma idea que hora_entrada_esperada, para la salida — opcional, por
-- empleado, sin regla única de empresa.
alter table public.employees add column if not exists hora_salida_esperada time;
