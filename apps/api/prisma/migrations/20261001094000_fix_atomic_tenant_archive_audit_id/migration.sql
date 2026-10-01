CREATE OR REPLACE FUNCTION private.archive_current_organization(p_reason text)
RETURNS TABLE(id uuid, status public."OrganizationStatus", archived_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE target_id uuid := private.current_organization_id(); actor_id uuid := private.current_user_id();
BEGIN
 IF target_id IS NULL OR actor_id IS NULL THEN RAISE EXCEPTION 'tenant context required' USING ERRCODE='42501'; END IF;
 IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'archive reason required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.organization_memberships m JOIN public.users u ON u.id=m.user_id
 WHERE m.organization_id=target_id AND m.user_id=actor_id AND m.role='OWNER' AND m.status='ACTIVE' AND u.status='ACTIVE';
 IF NOT FOUND THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 RETURN QUERY UPDATE public.organizations o SET status='ARCHIVED',archived_at=statement_timestamp(),suspended_at=NULL,
 status_reason=trim(p_reason),updated_at=statement_timestamp() WHERE o.id=target_id AND o.status='ACTIVE' RETURNING o.id,o.status,o.archived_at;
 IF NOT FOUND THEN RAISE EXCEPTION 'organization unavailable' USING ERRCODE='P0002'; END IF;
 INSERT INTO public.audit_logs(id,organization_id,user_id,action,entity_type,entity_id,metadata)
 VALUES(gen_random_uuid(),target_id,actor_id,'organization.archived','organization',target_id,jsonb_build_object('reason',trim(p_reason)));
END $$;
REVOKE ALL ON FUNCTION private.archive_current_organization(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.archive_current_organization(text) TO jurisvia_app;