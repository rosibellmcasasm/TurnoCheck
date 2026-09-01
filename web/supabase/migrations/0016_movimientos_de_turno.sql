-- Un turno (time_entry) puede pasar por varios sitios de trabajo el mismo
-- día sin cerrarse — pensado para obra civil, donde un empleado se mueve
-- de un proyecto a otro en la misma jornada. Cada "parada" queda registrada
-- con su hora, foto y GPS, igual de respaldada que la entrada/salida.
create table if not exists public.time_entry_checkpoints (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  work_site_id uuid null references public.work_sites(id) on delete set null,
  hora text not null, -- "HH:MM:SS", mismo formato que hora_entrada/hora_salida
  foto_url text null,
  lat double precision null,
  lng double precision null,
  fuera_de_rango boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists time_entry_checkpoints_owner_id_idx on public.time_entry_checkpoints (owner_id);
create index if not exists time_entry_checkpoints_time_entry_id_idx on public.time_entry_checkpoints (time_entry_id);

alter table public.time_entry_checkpoints enable row level security;

create policy "time_entry_checkpoints_select_own" on public.time_entry_checkpoints
  for select using (owner_id = (select auth.uid()));
create policy "time_entry_checkpoints_insert_own" on public.time_entry_checkpoints
  for insert with check (owner_id = (select auth.uid()));
create policy "time_entry_checkpoints_delete_own" on public.time_entry_checkpoints
  for delete using (owner_id = (select auth.uid()));

-- El turno en sí también necesita saber en qué sitio EMPEZÓ (el primer
-- tramo, antes del primer movimiento) — igual que ya se guardaba antes.
alter table public.time_entries add column if not exists work_site_id uuid null
  references public.work_sites(id) on delete set null;
