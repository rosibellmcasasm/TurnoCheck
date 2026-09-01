-- Cada sitio de trabajo ahora puede tener su propio radio de geovalla (antes
-- era un único radio fijo de 150m para todos los sitios de todas las
-- empresas). Rango razonable: 30m (una oficina pequeña) a 1000m (una obra
-- grande de construcción).
alter table public.work_sites add column if not exists radio_metros integer not null default 150
  check (radio_metros between 30 and 1000);
