ALTER TABLE public.account_identity_audits ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.account_identity_audits DROP CONSTRAINT account_identity_audits_user_id_fkey;
ALTER TABLE public.account_identity_audits ADD CONSTRAINT account_identity_audits_user_id_fkey FOREIGN KEY(user_id) REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER INDEX public.account_identity_audits_user_created_idx RENAME TO account_identity_audits_user_id_created_at_idx;