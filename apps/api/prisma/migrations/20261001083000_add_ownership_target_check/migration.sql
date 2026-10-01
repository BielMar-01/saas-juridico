CREATE OR REPLACE FUNCTION private.is_eligible_ownership_target(p_organization_id uuid,p_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT private.has_active_tenant_access(p_organization_id)
 AND EXISTS(SELECT 1 FROM public.organization_memberships m JOIN public.users u ON u.id=m.user_id
 WHERE m.organization_id=p_organization_id AND m.user_id=p_user_id AND m.status='ACTIVE' AND m.role<>'OWNER' AND u.status='ACTIVE')
$$;
REVOKE ALL ON FUNCTION private.is_eligible_ownership_target(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_eligible_ownership_target(uuid,uuid) TO jurisvia_app;