-- En vez de registrar actividades formales por proyecto (con horas exactas
-- por actividad, que resultó ser más complejo de lo que hace falta por
-- ahora), el empleado simplemente describe en texto libre qué hizo ese día
-- al marcar su salida.
alter table public.time_entries add column if not exists notas_actividades text null;
