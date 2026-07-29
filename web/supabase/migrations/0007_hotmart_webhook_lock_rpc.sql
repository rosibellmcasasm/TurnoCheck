-- El advisor de seguridad marcó apply_hotmart_event como ejecutable por anon/authenticated:
-- Postgres otorga EXECUTE a PUBLIC por defecto en funciones nuevas, y revocar de anon/authenticated
-- directamente no alcanza si el grant real es a PUBLIC — hay que revocar de PUBLIC explícitamente.
revoke execute on function public.apply_hotmart_event(text, text, text, uuid, text, text, text) from public;
revoke execute on function public.apply_hotmart_event(text, text, text, uuid, text, text, text) from anon, authenticated;
