-- Ficha de sitio de trabajo extendida: código de proyecto, cliente,
-- descripción, empleados asignados y una etiqueta de color para
-- distinguir obras/proyectos de un vistazo.
alter table public.work_sites add column if not exists codigo_proyecto text null;
alter table public.work_sites add column if not exists cliente text null;
alter table public.work_sites add column if not exists descripcion text null;
alter table public.work_sites add column if not exists color text null;
alter table public.work_sites add column if not exists empleados_asignados uuid[] not null default '{}';
