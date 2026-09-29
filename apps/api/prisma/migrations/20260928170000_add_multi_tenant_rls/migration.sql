-- Multi-tenant RLS foundation. Runtime role is provisioned separately; no password belongs here.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.current_organization_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = pg_catalog
AS $$ SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION private.current_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = pg_catalog
AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION private.has_active_tenant_access(target_organization_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT target_organization_id IS NOT NULL
    AND target_organization_id = private.current_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      JOIN public.organization_memberships m ON m.organization_id = o.id
      JOIN public.users u ON u.id = m.user_id
      WHERE o.id = target_organization_id
        AND o.status = 'ACTIVE'
        AND m.user_id = private.current_user_id()
        AND m.status = 'ACTIVE'
        AND u.status = 'ACTIVE'
    )
$$;

REVOKE ALL ON FUNCTION private.current_organization_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_active_tenant_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_organization_id(), private.current_user_id(), private.has_active_tenant_access(uuid) TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.prevent_organization_change()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'organization_id is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.require_active_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE actor_id uuid;
BEGIN
  actor_id := NULLIF(to_jsonb(NEW) ->> TG_ARGV[0], '')::uuid;
  IF actor_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_memberships m JOIN public.users u ON u.id=m.user_id
    WHERE m.organization_id=NEW.organization_id AND m.user_id=actor_id
      AND m.status='ACTIVE' AND u.status='ACTIVE'
  ) THEN RAISE EXCEPTION 'actor must be an active member' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.enforce_document_case_client()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  IF NEW.case_id IS NOT NULL AND NEW.client_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.organization_id=NEW.organization_id AND c.id=NEW.case_id AND c.client_id=NEW.client_id
  ) THEN RAISE EXCEPTION 'document client must match case client' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.protect_last_active_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE org_id uuid; remaining integer;
BEGIN
  IF TG_OP='DELETE' THEN org_id := OLD.organization_id; ELSE org_id := NEW.organization_id; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(org_id::text, 0));
  IF TG_OP='INSERT' THEN
    IF NEW.status='ACTIVE' AND NEW.role='OWNER' THEN RETURN NEW; END IF;
    SELECT count(*) INTO remaining FROM public.organization_memberships
      WHERE organization_id=org_id AND status='ACTIVE' AND role='OWNER';
    IF remaining=0 THEN RAISE EXCEPTION 'organization requires an active owner' USING ERRCODE='23514'; END IF;
    RETURN NEW;
  END IF;
  IF OLD.status='ACTIVE' AND OLD.role='OWNER'
    AND (TG_OP='DELETE' OR NEW.status<>'ACTIVE' OR NEW.role<>'OWNER') THEN
    IF EXISTS (SELECT 1 FROM public.organizations o WHERE o.id=org_id AND o.status<>'ACTIVE') THEN
      IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;
    SELECT count(*) INTO remaining FROM public.organization_memberships
      WHERE organization_id=org_id AND status='ACTIVE' AND role='OWNER' AND id<>OLD.id;
    IF remaining=0 THEN RAISE EXCEPTION 'last active owner cannot be removed' USING ERRCODE='23514'; END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;

CREATE OR REPLACE FUNCTION private.prevent_audit_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE table_owner name;
BEGIN
  SELECT r.rolname INTO table_owner FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_roles r ON r.oid=c.relowner WHERE c.oid=TG_RELID;
  IF current_user=table_owner AND current_setting('app.allow_admin_cleanup', true)='on' THEN
    IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  RAISE EXCEPTION 'audit logs are immutable' USING ERRCODE='55000';
END $$;

CREATE OR REPLACE FUNCTION private.protect_publication_history()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.case_id IS DISTINCT FROM OLD.case_id OR NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id
    OR NEW.type IS DISTINCT FROM OLD.type OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.content IS DISTINCT FROM OLD.content OR NEW.published_at IS DISTINCT FROM OLD.published_at
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR (OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at)
  THEN RAISE EXCEPTION 'publication history is immutable' USING ERRCODE='55000'; END IF;
  RETURN NEW;
END $$;

ALTER TABLE public.cases ADD CONSTRAINT cases_readiness_score_check CHECK (readiness_score IS NULL OR readiness_score BETWEEN 0 AND 100);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lawsuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawsuits FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_publications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON public.organizations FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(id));
CREATE POLICY organizations_insert ON public.organizations FOR INSERT TO jurisvia_app WITH CHECK (false);
CREATE POLICY organizations_update ON public.organizations FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(id)) WITH CHECK (private.has_active_tenant_access(id));
CREATE POLICY organizations_delete ON public.organizations FOR DELETE TO jurisvia_app USING (private.has_active_tenant_access(id));
CREATE POLICY organization_memberships_select ON public.organization_memberships FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY organization_memberships_insert ON public.organization_memberships FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY organization_memberships_update ON public.organization_memberships FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(organization_id)) WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY organization_memberships_delete ON public.organization_memberships FOR DELETE TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY clients_select ON public.clients FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY clients_insert ON public.clients FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY clients_update ON public.clients FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(organization_id)) WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY clients_delete ON public.clients FOR DELETE TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY cases_select ON public.cases FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY cases_insert ON public.cases FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY cases_update ON public.cases FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(organization_id)) WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY cases_delete ON public.cases FOR DELETE TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY lawsuits_select ON public.lawsuits FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY lawsuits_insert ON public.lawsuits FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY lawsuits_update ON public.lawsuits FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(organization_id)) WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY lawsuits_delete ON public.lawsuits FOR DELETE TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY tasks_select ON public.tasks FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY tasks_insert ON public.tasks FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(organization_id)) WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY documents_select ON public.documents FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY documents_insert ON public.documents FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY documents_update ON public.documents FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(organization_id)) WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY documents_delete ON public.documents FOR DELETE TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY client_portal_publications_select ON public.client_portal_publications FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY client_portal_publications_insert ON public.client_portal_publications FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY client_portal_publications_update ON public.client_portal_publications FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(organization_id)) WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY client_portal_publications_delete ON public.client_portal_publications FOR DELETE TO jurisvia_app USING (false);
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY audit_logs_update ON public.audit_logs FOR UPDATE TO jurisvia_app USING (false) WITH CHECK (false);
CREATE POLICY audit_logs_delete ON public.audit_logs FOR DELETE TO jurisvia_app USING (false);
CREATE POLICY users_select ON public.users FOR SELECT TO jurisvia_app
USING (id=private.current_user_id() AND EXISTS (
 SELECT 1 FROM public.organization_memberships m
 WHERE m.organization_id=private.current_organization_id() AND m.user_id=id AND m.status='ACTIVE'
));
CREATE POLICY users_insert ON public.users FOR INSERT TO jurisvia_app WITH CHECK (false);
CREATE POLICY users_update ON public.users FOR UPDATE TO jurisvia_app USING (false) WITH CHECK (false);
CREATE POLICY users_delete ON public.users FOR DELETE TO jurisvia_app USING (false);

CREATE TRIGGER organization_memberships_organization_immutable BEFORE UPDATE ON public.organization_memberships FOR EACH ROW EXECUTE FUNCTION private.prevent_organization_change();
CREATE TRIGGER clients_organization_immutable BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION private.prevent_organization_change();
CREATE TRIGGER cases_organization_immutable BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION private.prevent_organization_change();
CREATE TRIGGER lawsuits_organization_immutable BEFORE UPDATE ON public.lawsuits FOR EACH ROW EXECUTE FUNCTION private.prevent_organization_change();
CREATE TRIGGER tasks_organization_immutable BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION private.prevent_organization_change();
CREATE TRIGGER documents_organization_immutable BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION private.prevent_organization_change();
CREATE TRIGGER client_portal_publications_organization_immutable BEFORE UPDATE ON public.client_portal_publications FOR EACH ROW EXECUTE FUNCTION private.prevent_organization_change();
CREATE TRIGGER audit_logs_organization_immutable BEFORE UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION private.prevent_organization_change();
CREATE TRIGGER cases_active_responsible BEFORE INSERT OR UPDATE OF responsible_user_id, organization_id ON public.cases FOR EACH ROW EXECUTE FUNCTION private.require_active_member('responsible_user_id');
CREATE TRIGGER tasks_active_assignee BEFORE INSERT OR UPDATE OF assigned_to_user_id, organization_id ON public.tasks FOR EACH ROW EXECUTE FUNCTION private.require_active_member('assigned_to_user_id');
CREATE TRIGGER documents_active_uploader BEFORE INSERT OR UPDATE OF uploaded_by_user_id, organization_id ON public.documents FOR EACH ROW EXECUTE FUNCTION private.require_active_member('uploaded_by_user_id');
CREATE TRIGGER publications_active_creator BEFORE INSERT OR UPDATE OF created_by_user_id, organization_id ON public.client_portal_publications FOR EACH ROW EXECUTE FUNCTION private.require_active_member('created_by_user_id');
CREATE TRIGGER audit_active_actor BEFORE INSERT OR UPDATE OF user_id, organization_id ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION private.require_active_member('user_id');
CREATE TRIGGER documents_case_client_coherence BEFORE INSERT OR UPDATE OF organization_id, case_id, client_id ON public.documents FOR EACH ROW EXECUTE FUNCTION private.enforce_document_case_client();
CREATE TRIGGER memberships_last_owner BEFORE INSERT OR UPDATE OR DELETE ON public.organization_memberships FOR EACH ROW EXECUTE FUNCTION private.protect_last_active_owner();
CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION private.prevent_audit_mutation();
CREATE TRIGGER publications_history_guard BEFORE UPDATE ON public.client_portal_publications FOR EACH ROW EXECUTE FUNCTION private.protect_publication_history();

REVOKE ALL ON TABLE public.users, public.organizations, public.organization_memberships, public.clients, public.cases, public.lawsuits, public.tasks, public.documents, public.client_portal_publications, public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO jurisvia_app;
GRANT SELECT ON TABLE public.users TO jurisvia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organizations, public.organization_memberships, public.clients, public.cases, public.lawsuits, public.tasks, public.documents TO jurisvia_app;
GRANT SELECT, INSERT, UPDATE ON TABLE public.client_portal_publications TO jurisvia_app;
GRANT SELECT, INSERT ON TABLE public.audit_logs TO jurisvia_app;
