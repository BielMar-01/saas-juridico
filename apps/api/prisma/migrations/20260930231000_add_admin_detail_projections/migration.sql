CREATE OR REPLACE FUNCTION private.admin_get_organization(p_id uuid)
RETURNS TABLE(id uuid,name text,slug text,status public."OrganizationStatus",status_reason text,created_at timestamptz,updated_at timestamptz,active_memberships bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT o.id,o.name,o.slug,o.status,o.status_reason,o.created_at,o.updated_at,(SELECT count(*) FROM public.organization_memberships m WHERE m.organization_id=o.id AND m.status='ACTIVE')
 FROM public.organizations o WHERE o.id=p_id AND private.is_platform_administrator(private.current_user_id())
$$;
CREATE OR REPLACE FUNCTION private.admin_get_user(p_id uuid)
RETURNS TABLE(id uuid,name text,email text,status public."UserStatus",created_at timestamptz,memberships jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT u.id,u.name,u.email,u.status,u.created_at,coalesce((SELECT jsonb_agg(jsonb_build_object('organizationId',m.organization_id,'role',m.role,'status',m.status)) FROM public.organization_memberships m WHERE m.user_id=u.id),'[]'::jsonb)
 FROM public.users u WHERE u.id=p_id AND private.is_platform_administrator(private.current_user_id())
$$;
REVOKE ALL ON FUNCTION private.admin_get_organization(uuid),private.admin_get_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_get_organization(uuid),private.admin_get_user(uuid) TO jurisvia_app;