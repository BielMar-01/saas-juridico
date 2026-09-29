-- Compensating hardening migration. No applied migration is modified.
CREATE OR REPLACE FUNCTION private.enforce_active_case_responsible()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.organization_id::text, 0));
  IF NEW.status = 'ACTIVE' AND NEW.responsible_user_id IS NULL THEN
    RAISE EXCEPTION 'active case requires a responsible user' USING ERRCODE='23514';
  END IF;
  IF NEW.responsible_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.organization_memberships m
    JOIN public.users u ON u.id=m.user_id
    WHERE m.organization_id=NEW.organization_id AND m.user_id=NEW.responsible_user_id
      AND m.status='ACTIVE' AND u.status='ACTIVE'
  ) THEN RAISE EXCEPTION 'responsible user must be an active member' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.guard_membership_case_responsibility()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE org_id uuid; actor_id uuid;
BEGIN
  IF TG_OP='DELETE' THEN org_id:=OLD.organization_id; actor_id:=OLD.user_id;
  ELSE org_id:=NEW.organization_id; actor_id:=NEW.user_id; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(org_id::text,0));
  IF TG_OP='DELETE' OR OLD.status='ACTIVE' AND (NEW.status<>'ACTIVE' OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.organization_id IS DISTINCT FROM OLD.organization_id) THEN
    IF EXISTS (SELECT 1 FROM public.cases c WHERE c.organization_id=OLD.organization_id AND c.responsible_user_id=OLD.user_id AND c.status='ACTIVE') THEN
      RAISE EXCEPTION 'active case responsibility blocks membership change' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE OR REPLACE FUNCTION private.protect_last_active_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE org_id uuid; remaining integer;
BEGIN
  IF TG_OP='DELETE' THEN org_id:=OLD.organization_id; ELSE org_id:=NEW.organization_id; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(org_id::text,0));
  IF TG_OP<>'DELETE' AND NEW.status='ACTIVE' AND NEW.role='OWNER' AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id=NEW.user_id AND u.status='ACTIVE') THEN
    RAISE EXCEPTION 'active owner requires an active user' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' THEN
    IF NEW.status='ACTIVE' AND NEW.role='OWNER' THEN RETURN NEW; END IF;
    SELECT count(*) INTO remaining FROM public.organization_memberships m JOIN public.users u ON u.id=m.user_id AND u.status='ACTIVE'
      WHERE m.organization_id=org_id AND m.status='ACTIVE' AND m.role='OWNER';
    IF remaining=0 THEN RAISE EXCEPTION 'organization requires an active owner' USING ERRCODE='23514'; END IF;
    RETURN NEW;
  END IF;
  IF OLD.status='ACTIVE' AND OLD.role='OWNER' AND (TG_OP='DELETE' OR NEW.status<>'ACTIVE' OR NEW.role<>'OWNER' OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    IF EXISTS (SELECT 1 FROM public.organizations o WHERE o.id=org_id AND o.status<>'ACTIVE') THEN
      IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;
    SELECT count(*) INTO remaining FROM public.organization_memberships m JOIN public.users u ON u.id=m.user_id AND u.status='ACTIVE'
      WHERE m.organization_id=org_id AND m.status='ACTIVE' AND m.role='OWNER' AND m.id<>OLD.id;
    IF remaining=0 THEN RAISE EXCEPTION 'last effective owner cannot be removed' USING ERRCODE='23514'; END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;

CREATE OR REPLACE FUNCTION private.guard_user_active_dependencies()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE org record;
BEGIN
  IF OLD.status='ACTIVE' AND NEW.status<>'ACTIVE' THEN
    FOR org IN SELECT DISTINCT m.organization_id FROM public.organization_memberships m WHERE m.user_id=OLD.id ORDER BY m.organization_id LOOP
      PERFORM pg_advisory_xact_lock(hashtextextended(org.organization_id::text,0));
    END LOOP;
    IF EXISTS (SELECT 1 FROM public.cases c WHERE c.responsible_user_id=OLD.id AND c.status='ACTIVE') THEN
      RAISE EXCEPTION 'active case responsibility blocks user deactivation' USING ERRCODE='23514';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.organization_memberships own
      WHERE own.user_id=OLD.id AND own.role='OWNER' AND own.status='ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM public.organization_memberships other JOIN public.users u ON u.id=other.user_id AND u.status='ACTIVE'
          WHERE other.organization_id=own.organization_id AND other.role='OWNER' AND other.status='ACTIVE' AND other.user_id<>OLD.id
        )
    ) THEN RAISE EXCEPTION 'last effective owner user cannot be deactivated' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS cases_active_responsible ON public.cases;
CREATE TRIGGER cases_active_responsible BEFORE INSERT OR UPDATE OF status,responsible_user_id,organization_id ON public.cases FOR EACH ROW EXECUTE FUNCTION private.enforce_active_case_responsible();
CREATE TRIGGER memberships_active_case_guard BEFORE UPDATE OR DELETE ON public.organization_memberships FOR EACH ROW EXECUTE FUNCTION private.guard_membership_case_responsibility();
CREATE TRIGGER users_active_dependencies BEFORE UPDATE OF status ON public.users FOR EACH ROW EXECUTE FUNCTION private.guard_user_active_dependencies();

DROP POLICY organization_memberships_insert ON public.organization_memberships;
DROP POLICY organization_memberships_update ON public.organization_memberships;
DROP POLICY organization_memberships_delete ON public.organization_memberships;
CREATE POLICY organization_memberships_insert ON public.organization_memberships FOR INSERT TO jurisvia_app WITH CHECK (false);
CREATE POLICY organization_memberships_update ON public.organization_memberships FOR UPDATE TO jurisvia_app USING (false) WITH CHECK (false);
CREATE POLICY organization_memberships_delete ON public.organization_memberships FOR DELETE TO jurisvia_app USING (false);
DROP POLICY organizations_update ON public.organizations;
DROP POLICY organizations_delete ON public.organizations;
CREATE POLICY organizations_update ON public.organizations FOR UPDATE TO jurisvia_app USING (false) WITH CHECK (false);
CREATE POLICY organizations_delete ON public.organizations FOR DELETE TO jurisvia_app USING (false);
REVOKE INSERT,UPDATE,DELETE ON public.organizations,public.organization_memberships FROM jurisvia_app;

REVOKE ALL ON FUNCTION private.current_organization_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_active_tenant_access(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.prevent_organization_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.require_active_member() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_document_case_client() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.protect_last_active_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.prevent_audit_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.protect_publication_history() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.enforce_active_case_responsible() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_membership_case_responsibility() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_user_active_dependencies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_organization_id(),private.current_user_id(),private.has_active_tenant_access(uuid) TO jurisvia_app;
