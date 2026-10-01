-- Bloco 4: lifecycle, global administration, notifications, delivery metadata and ownership transfer.
ALTER TYPE public."OrganizationStatus" RENAME VALUE 'INACTIVE' TO 'ARCHIVED';
CREATE TYPE public."EmailDeliveryStatus" AS ENUM ('QUEUED','SENT','DELIVERED','DELAYED','BOUNCED','COMPLAINED','FAILED','SUPPRESSED');
CREATE TYPE public."OwnershipTransferStatus" AS ENUM ('PENDING','ACCEPTED','CANCELLED','EXPIRED');

ALTER TABLE public.organizations
  ADD COLUMN suspended_at timestamptz(3),
  ADD COLUMN archived_at timestamptz(3),
  ADD COLUMN status_reason text,
  ADD CONSTRAINT organizations_lifecycle_dates_check CHECK (
    (status='ACTIVE' AND suspended_at IS NULL AND archived_at IS NULL) OR
    (status='SUSPENDED' AND suspended_at IS NOT NULL AND archived_at IS NULL) OR
    (status='ARCHIVED' AND archived_at IS NOT NULL)
  );

CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE RESTRICT,
  team_enabled boolean NOT NULL DEFAULT true,
  office_enabled boolean NOT NULL DEFAULT true,
  system_enabled boolean NOT NULL DEFAULT true,
  case_updates_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now()
);
CREATE TABLE public.platform_administrators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE RESTRICT,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now()
);
CREATE INDEX platform_administrators_active_idx ON public.platform_administrators(active);

CREATE TABLE public.ownership_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  requested_by_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  status public."OwnershipTransferStatus" NOT NULL DEFAULT 'PENDING',
  expires_at timestamptz(3) NOT NULL,
  accepted_at timestamptz(3),
  cancelled_at timestamptz(3),
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now(),
  CONSTRAINT ownership_transfer_distinct_users CHECK (requested_by_id <> target_user_id),
  CONSTRAINT ownership_transfer_terminal_dates CHECK (
    (status='PENDING' AND accepted_at IS NULL AND cancelled_at IS NULL) OR
    (status='ACCEPTED' AND accepted_at IS NOT NULL AND cancelled_at IS NULL) OR
    (status IN ('CANCELLED','EXPIRED') AND accepted_at IS NULL)
  )
);
CREATE UNIQUE INDEX ownership_transfers_one_pending_org_idx ON public.ownership_transfers(organization_id) WHERE status='PENDING';
CREATE INDEX ownership_transfers_organization_status_created_idx ON public.ownership_transfers(organization_id,status,created_at);
CREATE INDEX ownership_transfers_target_status_idx ON public.ownership_transfers(target_user_id,status);

CREATE TABLE public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL UNIQUE,
  provider text NOT NULL,
  provider_message_id text UNIQUE,
  category text NOT NULL,
  template text NOT NULL,
  recipient_masked text NOT NULL,
  status public."EmailDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
  last_event_at timestamptz(3),
  failure_code text,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now()
);
CREATE INDEX email_deliveries_organization_created_idx ON public.email_deliveries(organization_id,created_at);
CREATE INDEX email_deliveries_status_created_idx ON public.email_deliveries(status,created_at);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_transfers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.platform_administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_administrators FORCE ROW LEVEL SECURITY;
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_deliveries FORCE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_self_select ON public.notification_preferences FOR SELECT TO jurisvia_app
  USING (user_id=private.current_user_id());
CREATE POLICY notification_preferences_self_insert ON public.notification_preferences FOR INSERT TO jurisvia_app
  WITH CHECK (user_id=private.current_user_id());
CREATE POLICY notification_preferences_self_update ON public.notification_preferences FOR UPDATE TO jurisvia_app
  USING (user_id=private.current_user_id()) WITH CHECK (user_id=private.current_user_id());

CREATE POLICY ownership_transfers_tenant_select ON public.ownership_transfers FOR SELECT TO jurisvia_app
  USING (organization_id=private.current_organization_id());
CREATE POLICY ownership_transfers_tenant_insert ON public.ownership_transfers FOR INSERT TO jurisvia_app
  WITH CHECK (organization_id=private.current_organization_id() AND requested_by_id=private.current_user_id());
CREATE POLICY ownership_transfers_tenant_update ON public.ownership_transfers FOR UPDATE TO jurisvia_app
  USING (organization_id=private.current_organization_id()) WITH CHECK (organization_id=private.current_organization_id());

REVOKE ALL ON public.notification_preferences,public.platform_administrators,public.ownership_transfers,public.email_deliveries FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.notification_preferences,public.ownership_transfers TO jurisvia_app;
GRANT SELECT,INSERT,UPDATE ON public.email_deliveries TO jurisvia_app;

-- Every normal tenant write requires an active organization. Lifecycle/admin functions run as tightly scoped definer functions.
CREATE OR REPLACE FUNCTION private.enforce_active_organization_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE oid uuid; current_status public."OrganizationStatus";
BEGIN
  oid := CASE WHEN TG_OP='DELETE' THEN OLD.organization_id ELSE NEW.organization_id END;
  SELECT status INTO current_status FROM public.organizations WHERE id=oid;
  IF current_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'organization is read-only' USING ERRCODE='42501';
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION private.enforce_active_organization_write() FROM PUBLIC;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['clients','cases','lawsuits','tasks','documents','client_portal_publications','invitations']
  LOOP
    EXECUTE format('CREATE TRIGGER enforce_active_organization_write BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.enforce_active_organization_write()',table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION private.accept_ownership_transfer(p_transfer_id uuid,p_token_hash text)
RETURNS TABLE(organization_id uuid,old_owner_id uuid,new_owner_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE transfer public.ownership_transfers%ROWTYPE; old_owner uuid;
BEGIN
  SELECT * INTO transfer FROM public.ownership_transfers WHERE id=p_transfer_id FOR UPDATE;
  IF NOT FOUND OR transfer.status<>'PENDING' OR transfer.expires_at<=statement_timestamp() OR transfer.token_hash<>p_token_hash THEN
    RAISE EXCEPTION 'transfer unavailable' USING ERRCODE='P0002';
  END IF;
  IF transfer.target_user_id<>private.current_user_id() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT user_id INTO old_owner FROM public.organization_memberships
    WHERE organization_id=transfer.organization_id AND role='OWNER' AND status='ACTIVE' FOR UPDATE;
  IF old_owner<>transfer.requested_by_id THEN RAISE EXCEPTION 'owner changed' USING ERRCODE='40001'; END IF;
  PERFORM 1 FROM public.organization_memberships WHERE organization_id=transfer.organization_id
    AND user_id=transfer.target_user_id AND status='ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'target unavailable' USING ERRCODE='42501'; END IF;
  UPDATE public.organization_memberships SET role='ADMIN',updated_at=statement_timestamp()
    WHERE organization_id=transfer.organization_id AND user_id=old_owner;
  UPDATE public.organization_memberships SET role='OWNER',updated_at=statement_timestamp()
    WHERE organization_id=transfer.organization_id AND user_id=transfer.target_user_id;
  UPDATE public.ownership_transfers SET status='ACCEPTED',accepted_at=statement_timestamp(),updated_at=statement_timestamp() WHERE id=transfer.id;
  RETURN QUERY SELECT transfer.organization_id,old_owner,transfer.target_user_id;
END $$;
REVOKE ALL ON FUNCTION private.accept_ownership_transfer(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.accept_ownership_transfer(uuid,text) TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.is_platform_administrator(p_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT EXISTS(SELECT 1 FROM public.platform_administrators WHERE user_id=p_user_id AND active)
$$;
REVOKE ALL ON FUNCTION private.is_platform_administrator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_platform_administrator(uuid) TO jurisvia_app;

-- Platform administrators deliberately receive only operational projections through functions.
CREATE OR REPLACE FUNCTION private.admin_set_organization_status(p_id uuid,p_status public."OrganizationStatus",p_reason text)
RETURNS TABLE(id uuid,status public."OrganizationStatus",updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF NOT private.is_platform_administrator(private.current_user_id()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF p_status='ARCHIVED' THEN RAISE EXCEPTION 'archive requires tenant owner workflow' USING ERRCODE='42501'; END IF;
  RETURN QUERY UPDATE public.organizations o SET status=p_status,status_reason=nullif(trim(p_reason),''),
    suspended_at=CASE WHEN p_status='SUSPENDED' THEN statement_timestamp() ELSE NULL END,
    archived_at=NULL,updated_at=statement_timestamp()
    WHERE o.id=p_id AND o.status<>'ARCHIVED' RETURNING o.id,o.status,o.updated_at;
END $$;
REVOKE ALL ON FUNCTION private.admin_set_organization_status(uuid,public."OrganizationStatus",text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_set_organization_status(uuid,public."OrganizationStatus",text) TO jurisvia_app;

CREATE TABLE public.platform_audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 action text NOT NULL, entity_type text NOT NULL, entity_id uuid,
 organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
 result text NOT NULL, metadata jsonb,
 created_at timestamptz(3) NOT NULL DEFAULT now()
);
CREATE INDEX platform_audit_logs_created_idx ON public.platform_audit_logs(created_at);
CREATE INDEX platform_audit_logs_user_created_idx ON public.platform_audit_logs(user_id,created_at);
CREATE INDEX platform_audit_logs_organization_created_idx ON public.platform_audit_logs(organization_id,created_at);
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_audit_logs FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.platform_audit_logs TO jurisvia_app;

CREATE POLICY platform_admin_self_select ON public.platform_administrators FOR SELECT TO jurisvia_app
 USING (user_id=private.current_user_id());
CREATE POLICY platform_audit_admin_select ON public.platform_audit_logs FOR SELECT TO jurisvia_app
 USING (private.is_platform_administrator(private.current_user_id()));
CREATE POLICY platform_audit_admin_insert ON public.platform_audit_logs FOR INSERT TO jurisvia_app
 WITH CHECK (user_id=private.current_user_id() AND private.is_platform_administrator(private.current_user_id()));
CREATE POLICY email_delivery_admin_select ON public.email_deliveries FOR SELECT TO jurisvia_app
 USING (private.is_platform_administrator(private.current_user_id()));
CREATE POLICY email_delivery_admin_update ON public.email_deliveries FOR UPDATE TO jurisvia_app
 USING (private.is_platform_administrator(private.current_user_id()))
 WITH CHECK (private.is_platform_administrator(private.current_user_id()));

CREATE OR REPLACE FUNCTION private.admin_overview()
RETURNS TABLE(organizations bigint,active_organizations bigint,suspended_organizations bigint,archived_organizations bigint,users bigint,active_memberships bigint,pending_invitations bigint,recent_email_failures bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT
 (SELECT count(*) FROM public.organizations),
 (SELECT count(*) FROM public.organizations WHERE status='ACTIVE'),
 (SELECT count(*) FROM public.organizations WHERE status='SUSPENDED'),
 (SELECT count(*) FROM public.organizations WHERE status='ARCHIVED'),
 (SELECT count(*) FROM public.users),
 (SELECT count(*) FROM public.organization_memberships WHERE status='ACTIVE'),
 (SELECT count(*) FROM public.invitations WHERE status='PENDING'),
 (SELECT count(*) FROM public.email_deliveries WHERE status IN ('FAILED','BOUNCED','COMPLAINED') AND created_at>now()-interval '7 days')
 WHERE private.is_platform_administrator(private.current_user_id())
$$;
REVOKE ALL ON FUNCTION private.admin_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_overview() TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.admin_list_organizations(p_search text,p_status public."OrganizationStatus",p_limit integer,p_offset integer)
RETURNS TABLE(id uuid,name text,slug text,status public."OrganizationStatus",created_at timestamptz,updated_at timestamptz,total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT o.id,o.name,o.slug,o.status,o.created_at,o.updated_at,count(*) over()
 FROM public.organizations o
 WHERE private.is_platform_administrator(private.current_user_id())
 AND (p_search IS NULL OR o.name ILIKE '%'||p_search||'%' OR o.slug ILIKE '%'||p_search||'%')
 AND (p_status IS NULL OR o.status=p_status) ORDER BY o.created_at DESC LIMIT LEAST(p_limit,100) OFFSET p_offset
$$;
REVOKE ALL ON FUNCTION private.admin_list_organizations(text,public."OrganizationStatus",integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_list_organizations(text,public."OrganizationStatus",integer,integer) TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.admin_list_users(p_search text,p_limit integer,p_offset integer)
RETURNS TABLE(id uuid,name text,email text,status public."UserStatus",membership_count bigint,total_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT u.id,u.name,u.email,u.status,count(m.id),count(*) over()
 FROM public.users u LEFT JOIN public.organization_memberships m ON m.user_id=u.id
 WHERE private.is_platform_administrator(private.current_user_id())
 AND (p_search IS NULL OR u.name ILIKE '%'||p_search||'%' OR u.email ILIKE '%'||p_search||'%')
 GROUP BY u.id ORDER BY u.created_at DESC LIMIT LEAST(p_limit,100) OFFSET p_offset
$$;
REVOKE ALL ON FUNCTION private.admin_list_users(text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_list_users(text,integer,integer) TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.resolve_platform_administrator(p_auth_user_id uuid)
RETURNS TABLE(user_id uuid,name text,email text,active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT u.id,u.name,u.email,pa.active FROM public.users u
 JOIN public.platform_administrators pa ON pa.user_id=u.id
 WHERE u.auth_user_id=p_auth_user_id AND u.status='ACTIVE' AND pa.active
$$;
REVOKE ALL ON FUNCTION private.resolve_platform_administrator(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.resolve_platform_administrator(uuid) TO jurisvia_app;
