CREATE OR REPLACE FUNCTION private.accept_ownership_transfer(p_transfer_id uuid,p_token_hash text)
RETURNS TABLE(organization_id uuid,old_owner_id uuid,new_owner_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE transfer public.ownership_transfers%ROWTYPE; prior_owner uuid; org_status public."OrganizationStatus";
BEGIN
 SELECT ot.* INTO transfer FROM public.ownership_transfers ot WHERE ot.id=p_transfer_id FOR UPDATE;
 IF NOT FOUND OR transfer.status<>'PENDING' OR transfer.expires_at<=statement_timestamp() OR transfer.token_hash<>p_token_hash THEN RAISE EXCEPTION 'transfer unavailable' USING ERRCODE='P0002'; END IF;
 SELECT o.status INTO org_status FROM public.organizations o WHERE o.id=transfer.organization_id FOR UPDATE;
 IF org_status IS DISTINCT FROM 'ACTIVE' THEN RAISE EXCEPTION 'organization is read-only' USING ERRCODE='42501'; END IF;
 IF transfer.target_user_id<>private.current_user_id() THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 SELECT m.user_id INTO prior_owner FROM public.organization_memberships m WHERE m.organization_id=transfer.organization_id AND m.role='OWNER' AND m.status='ACTIVE' FOR UPDATE;
 IF prior_owner<>transfer.requested_by_id THEN RAISE EXCEPTION 'owner changed' USING ERRCODE='40001'; END IF;
 PERFORM 1 FROM public.organization_memberships m WHERE m.organization_id=transfer.organization_id AND m.user_id=transfer.target_user_id AND m.status='ACTIVE' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'target unavailable' USING ERRCODE='42501'; END IF;
 UPDATE public.organization_memberships m SET role='ADMIN',updated_at=statement_timestamp() WHERE m.organization_id=transfer.organization_id AND m.user_id=prior_owner;
 UPDATE public.organization_memberships m SET role='OWNER',updated_at=statement_timestamp() WHERE m.organization_id=transfer.organization_id AND m.user_id=transfer.target_user_id;
 UPDATE public.ownership_transfers ot SET status='ACCEPTED',accepted_at=statement_timestamp(),updated_at=statement_timestamp() WHERE ot.id=transfer.id;
 RETURN QUERY SELECT transfer.organization_id,prior_owner,transfer.target_user_id;
END $$;
REVOKE ALL ON FUNCTION private.accept_ownership_transfer(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.accept_ownership_transfer(uuid,text) TO jurisvia_app;