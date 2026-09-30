-- Keep organization membership mutations behind validated tenant-aware functions.
CREATE OR REPLACE FUNCTION private.update_member_role(p_membership_id uuid, p_role public."OrganizationRole")
RETURNS TABLE(id uuid, user_id uuid, role public."OrganizationRole", status public."MembershipStatus")
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor_role public."OrganizationRole"; target public.organization_memberships%ROWTYPE;
BEGIN
  SELECT m.role INTO actor_role FROM public.organization_memberships m
    WHERE m.organization_id=private.current_organization_id() AND m.user_id=private.current_user_id() AND m.status='ACTIVE';
  IF actor_role NOT IN ('OWNER','ADMIN') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO target FROM public.organization_memberships m
    WHERE m.id=p_membership_id AND m.organization_id=private.current_organization_id() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF;
  IF target.role='OWNER' OR p_role='OWNER' THEN RAISE EXCEPTION 'owner role is immutable here' USING ERRCODE='42501'; END IF;
  IF actor_role='ADMIN' AND (target.role='ADMIN' OR p_role NOT IN ('LAWYER','ASSISTANT')) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  RETURN QUERY UPDATE public.organization_memberships m SET role=p_role,updated_at=statement_timestamp()
    WHERE m.id=p_membership_id RETURNING m.id,m.user_id,m.role,m.status;
END $$;
REVOKE ALL ON FUNCTION private.update_member_role(uuid,public."OrganizationRole") FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.update_member_role(uuid,public."OrganizationRole") TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.update_member_status(p_membership_id uuid, p_status public."MembershipStatus")
RETURNS TABLE(id uuid, user_id uuid, role public."OrganizationRole", status public."MembershipStatus")
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor_role public."OrganizationRole"; target public.organization_memberships%ROWTYPE;
BEGIN
  IF p_status NOT IN ('ACTIVE','SUSPENDED','REVOKED') THEN RAISE EXCEPTION 'invalid status' USING ERRCODE='22023'; END IF;
  SELECT m.role INTO actor_role FROM public.organization_memberships m
    WHERE m.organization_id=private.current_organization_id() AND m.user_id=private.current_user_id() AND m.status='ACTIVE';
  IF actor_role NOT IN ('OWNER','ADMIN') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO target FROM public.organization_memberships m
    WHERE m.id=p_membership_id AND m.organization_id=private.current_organization_id() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF;
  IF target.role='OWNER' OR (actor_role='ADMIN' AND target.role='ADMIN') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF target.user_id=private.current_user_id() AND p_status<>'ACTIVE' THEN RAISE EXCEPTION 'self deactivation forbidden' USING ERRCODE='42501'; END IF;
  RETURN QUERY UPDATE public.organization_memberships m SET status=p_status,updated_at=statement_timestamp()
    WHERE m.id=p_membership_id RETURNING m.id,m.user_id,m.role,m.status;
END $$;
REVOKE ALL ON FUNCTION private.update_member_status(uuid,public."MembershipStatus") FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.update_member_status(uuid,public."MembershipStatus") TO jurisvia_app;