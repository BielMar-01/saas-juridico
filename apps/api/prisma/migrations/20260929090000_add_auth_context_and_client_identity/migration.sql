-- Authentication context resolution and tenant-scoped active document uniqueness.
CREATE OR REPLACE FUNCTION private.resolve_auth_context(requested_auth_user_id uuid)
RETURNS TABLE(user_id uuid,name text,email text,organization_id uuid,organization_name text,organization_slug text,role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT u.id,u.name,u.email,o.id,o.name,o.slug,m.role::text
 FROM public.users u
 JOIN public.organization_memberships m ON m.user_id=u.id AND m.status='ACTIVE'
 JOIN public.organizations o ON o.id=m.organization_id AND o.status='ACTIVE'
 WHERE u.auth_user_id=requested_auth_user_id AND u.status='ACTIVE'
 ORDER BY o.name,o.id
$$;
REVOKE ALL ON FUNCTION private.resolve_auth_context(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.resolve_auth_context(uuid) TO jurisvia_app;
CREATE UNIQUE INDEX clients_organization_document_active_key ON public.clients(organization_id,document) WHERE document IS NOT NULL AND deleted_at IS NULL;
