-- Un sitio de trabajo (obra) puede ser también el proyecto que se le
-- factura a un cliente final — caso real: empresas de obra civil que
-- necesitan mostrarle a su cliente las horas invertidas y el avance.
alter table public.work_sites add column if not exists cliente_final text null;
alter table public.work_sites add column if not exists avance_porcentaje smallint not null default 0
  check (avance_porcentaje between 0 and 100);

-- Para poder sumar horas POR proyecto, cada marcación de entrada guarda a
-- qué sitio/proyecto perteneció (el sitio activo más cercano dentro del
-- radio de la geocerca en el momento de marcar). Puede quedar null: sin
-- sitios configurados, o si marcó fuera de rango de todos.
alter table public.time_entries add column if not exists work_site_id uuid null
  references public.work_sites(id) on delete set null;
