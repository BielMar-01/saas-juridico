ALTER TABLE public.account_identity_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_identity_audits FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.account_identity_audits FROM PUBLIC,anon,authenticated,jurisvia_app;