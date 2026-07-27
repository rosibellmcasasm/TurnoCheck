-- Bucket privado para las fotos de marcación. Cada owner solo puede subir/ver
-- las suyas (carpeta = su propio auth.uid()), igual que las tablas.
insert into storage.buckets (id, name, public)
values ('marcaciones', 'marcaciones', false)
on conflict (id) do nothing;

create policy "marcaciones_insert_own"
on storage.objects for insert
with check (bucket_id = 'marcaciones' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy "marcaciones_select_own"
on storage.objects for select
using (bucket_id = 'marcaciones' and (select auth.uid())::text = (storage.foldername(name))[1]);
