-- El advisor de seguridad de Supabase marcó que check_employee_limit()
-- (SECURITY DEFINER) quedó invocable directamente vía RPC por anon/authenticated.
-- Solo debe correr como trigger interno del INSERT en employees.
revoke execute on function public.check_employee_limit() from public, anon, authenticated;
