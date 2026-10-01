CREATE OR REPLACE FUNCTION private.has_tenant_read_access(target_organization_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT target_organization_id IS NOT NULL AND target_organization_id=private.current_organization_id()
 AND EXISTS(SELECT 1 FROM public.organization_memberships m JOIN public.users u ON u.id=m.user_id
 WHERE m.organization_id=target_organization_id AND m.user_id=private.current_user_id() AND m.status='ACTIVE' AND u.status='ACTIVE')
$$;
REVOKE ALL ON FUNCTION private.has_tenant_read_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_tenant_read_access(uuid) TO jurisvia_app;

DROP POLICY organizations_select ON public.organizations;
CREATE POLICY organizations_select ON public.organizations FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(id));
DROP POLICY organization_memberships_select ON public.organization_memberships;
CREATE POLICY organization_memberships_select ON public.organization_memberships FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY clients_select ON public.clients;
CREATE POLICY clients_select ON public.clients FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY cases_select ON public.cases;
CREATE POLICY cases_select ON public.cases FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY lawsuits_select ON public.lawsuits;
CREATE POLICY lawsuits_select ON public.lawsuits FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY documents_select ON public.documents;
CREATE POLICY documents_select ON public.documents FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY client_portal_publications_select ON public.client_portal_publications;
CREATE POLICY client_portal_publications_select ON public.client_portal_publications FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));
DROP POLICY ownership_transfers_tenant_select ON public.ownership_transfers;
CREATE POLICY ownership_transfers_tenant_select ON public.ownership_transfers FOR SELECT TO jurisvia_app USING(private.has_tenant_read_access(organization_id));