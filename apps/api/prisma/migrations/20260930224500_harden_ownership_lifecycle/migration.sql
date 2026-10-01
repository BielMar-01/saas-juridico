DROP POLICY ownership_transfers_tenant_insert ON public.ownership_transfers;
DROP POLICY ownership_transfers_tenant_update ON public.ownership_transfers;
CREATE POLICY ownership_transfers_tenant_insert ON public.ownership_transfers FOR INSERT TO jurisvia_app
 WITH CHECK (organization_id=private.current_organization_id() AND requested_by_id=private.current_user_id() AND private.has_active_tenant_access(organization_id));
CREATE POLICY ownership_transfers_tenant_update ON public.ownership_transfers FOR UPDATE TO jurisvia_app
 USING (organization_id=private.current_organization_id() AND private.has_active_tenant_access(organization_id))
 WITH CHECK (organization_id=private.current_organization_id() AND private.has_active_tenant_access(organization_id));

CREATE OR REPLACE FUNCTION private.accept_ownership_transfer(p_transfer_id uuid,p_token_hash text)
RETURNS TABLE(organization_id uuid,old_owner_id uuid,new_owner_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE transfer public.ownership_transfers%ROWTYPE; old_owner uuid; org_status public."OrganizationStatus";
BEGIN
 SELECT * INTO transfer FROM public.ownership_transfers WHERE id=p_transfer_id FOR UPDATE;
 IF NOT FOUND OR transfer.status<>'PENDING' OR transfer.expires_at<=statement_timestamp() OR transfer.token_hash<>p_token_hash THEN RAISE EXCEPTION 'transfer unavailable' USING ERRCODE='P0002'; END IF;
 SELECT status INTO org_status FROM public.organizations WHERE id=transfer.organization_id FOR UPDATE;
 IF org_status IS DISTINCT FROM 'ACTIVE' THEN RAISE EXCEPTION 'organization is read-only' USING ERRCODE='42501'; END IF;
 IF transfer.target_user_id<>private.current_user_id() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 SELECT user_id INTO old_owner FROM public.organization_memberships WHERE organization_id=transfer.organization_id AND role='OWNER' AND status='ACTIVE' FOR UPDATE;
 IF old_owner<>transfer.requested_by_id THEN RAISE EXCEPTION 'owner changed' USING ERRCODE='40001'; END IF;
 PERFORM 1 FROM public.organization_memberships WHERE organization_id=transfer.organization_id AND user_id=transfer.target_user_id AND status='ACTIVE' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'target unavailable' USING ERRCODE='42501'; END IF;
 UPDATE public.organization_memberships SET role='ADMIN',updated_at=statement_timestamp() WHERE organization_id=transfer.organization_id AND user_id=old_owner;
 UPDATE public.organization_memberships SET role='OWNER',updated_at=statement_timestamp() WHERE organization_id=transfer.organization_id AND user_id=transfer.target_user_id;
 UPDATE public.ownership_transfers SET status='ACCEPTED',accepted_at=statement_timestamp(),updated_at=statement_timestamp() WHERE id=transfer.id;
 RETURN QUERY SELECT transfer.organization_id,old_owner,transfer.target_user_id;
END $$;
REVOKE ALL ON FUNCTION private.accept_ownership_transfer(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.accept_ownership_transfer(uuid,text) TO jurisvia_app;