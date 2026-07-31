-- Sitios de trabajo (geocerca) — pensado para negocios como obra civil donde
-- el lugar de trabajo cambia de proyecto en proyecto (no un solo local fijo).
-- Un negocio puede tener VARIOS sitios activos a la vez; una marcación se
-- valida contra CUALQUIERA de ellos (el empleado no elige nada, solo marca).
create table if not exists public.work_sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  nombre text not null,
  lat double precision not null,
  lng double precision not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists work_sites_owner_id_idx on public.work_sites (owner_id);
create index if not exists work_sites_company_id_idx on public.work_sites (company_id);

alter table public.work_sites enable row level security;

create policy "work_sites_select_own" on public.work_sites
  for select using (owner_id = (select auth.uid()));
create policy "work_sites_insert_own" on public.work_sites
  for insert with check (owner_id = (select auth.uid()));
create policy "work_sites_update_own" on public.work_sites
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "work_sites_delete_own" on public.work_sites
  for delete using (owner_id = (select auth.uid()));

-- La marcación guarda si quedó lejos de TODOS los sitios activos al momento
-- de marcar (se calcula en el cliente con la distancia Haversine y se manda
-- ya resuelto — igual que es_festivo, que también se resuelve en el cliente).
alter table public.time_entries add column if not exists fuera_de_rango boolean not null default false;
