-- Compensating hardening: soft-delete enforcement and runtime actor provenance.
CREATE OR REPLACE FUNCTION private.prevent_document_authorship_change()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.uploaded_by_user_id IS DISTINCT FROM OLD.uploaded_by_user_id THEN
    RAISE EXCEPTION 'document authorship is immutable' USING ERRCODE='55000';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.prevent_document_authorship_change() FROM PUBLIC;
CREATE TRIGGER documents_authorship_immutable BEFORE UPDATE OF uploaded_by_user_id ON public.documents FOR EACH ROW EXECUTE FUNCTION private.prevent_document_authorship_change();

DROP POLICY clients_delete ON public.clients;
DROP POLICY cases_delete ON public.cases;
DROP POLICY lawsuits_delete ON public.lawsuits;
DROP POLICY tasks_delete ON public.tasks;
DROP POLICY documents_delete ON public.documents;
CREATE POLICY clients_delete ON public.clients FOR DELETE TO jurisvia_app USING(false);
CREATE POLICY cases_delete ON public.cases FOR DELETE TO jurisvia_app USING(false);
CREATE POLICY lawsuits_delete ON public.lawsuits FOR DELETE TO jurisvia_app USING(false);
CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO jurisvia_app USING(false);
CREATE POLICY documents_delete ON public.documents FOR DELETE TO jurisvia_app USING(false);
REVOKE DELETE ON public.clients,public.cases,public.lawsuits,public.tasks,public.documents FROM jurisvia_app;

DROP POLICY documents_insert ON public.documents;
CREATE POLICY documents_insert ON public.documents FOR INSERT TO jurisvia_app
WITH CHECK(private.has_active_tenant_access(organization_id) AND uploaded_by_user_id=private.current_user_id());
DROP POLICY client_portal_publications_insert ON public.client_portal_publications;
CREATE POLICY client_portal_publications_insert ON public.client_portal_publications FOR INSERT TO jurisvia_app
WITH CHECK(private.has_active_tenant_access(organization_id) AND created_by_user_id=private.current_user_id());
DROP POLICY audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO jurisvia_app
WITH CHECK(private.has_active_tenant_access(organization_id) AND user_id IS NOT NULL AND user_id=private.current_user_id());
