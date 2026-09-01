-- Cada marcación queda ligada al sitio de trabajo (proyecto) donde ocurrió
-- y, si el sitio tiene actividades definidas, a la actividad elegida al
-- marcar la entrada — para poder filtrar Reportes por proyecto/cliente/
-- actividad y ver el diagrama de torta de horas invertidas.
alter table public.time_entries add column if not exists work_site_id uuid null
  references public.work_sites(id) on delete set null;
alter table public.time_entries add column if not exists activity_id uuid null
  references public.work_site_activities(id) on delete set null;
