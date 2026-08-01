-- La cámara ya captura una foto también al marcar la SALIDA, pero se
-- descartaba (solo existía una columna de foto, ligada a la entrada).
-- Se agrega una columna separada para la foto de salida.
alter table public.time_entries add column if not exists foto_salida_url text;
