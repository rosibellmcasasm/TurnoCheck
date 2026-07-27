-- El advisor de rendimiento marcó la FK time_entries.company_id sin índice.
create index if not exists time_entries_company_id_idx on public.time_entries (company_id);
