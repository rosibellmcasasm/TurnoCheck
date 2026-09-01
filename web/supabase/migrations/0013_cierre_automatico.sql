-- Inspirado en la "salida automática" de Jibble: si un empleado se olvida de marcar
-- su salida, el turno se queda "abierto" para siempre. Con esto, el dueño puede
-- configurar una hora de cierre y la app cierra sola los turnos que quedaron
-- abiertos de días anteriores (nunca el turno del día actual, que puede seguir en curso).
alter table public.companies add column if not exists hora_cierre_automatico time null;
alter table public.time_entries add column if not exists cierre_automatico boolean not null default false;
