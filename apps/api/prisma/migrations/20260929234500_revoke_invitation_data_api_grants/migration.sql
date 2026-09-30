-- Invitations are server-only; Supabase Data API roles must not access the table.
REVOKE ALL PRIVILEGES ON TABLE public.invitations FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.invitations FROM PUBLIC;