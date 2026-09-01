-- Lista de actividades/tareas dentro de cada sitio de trabajo (proyecto) —
-- ej. "Cimentación", "Estructura", "Acabados" — que el dueño marca como
-- hechas a medida que avanza la obra.
create table if not exists public.work_site_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  work_site_id uuid not null references public.work_sites(id) on delete cascade,
  nombre text not null,
  completada boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists work_site_activities_owner_id_idx on public.work_site_activities (owner_id);
create index if not exists work_site_activities_work_site_id_idx on public.work_site_activities (work_site_id);

alter table public.work_site_activities enable row level security;

create policy "work_site_activities_select_own" on public.work_site_activities
  for select using (owner_id = (select auth.uid()));
create policy "work_site_activities_insert_own" on public.work_site_activities
  for insert with check (owner_id = (select auth.uid()));
create policy "work_site_activities_update_own" on public.work_site_activities
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "work_site_activities_delete_own" on public.work_site_activities
  for delete using (owner_id = (select auth.uid()));
