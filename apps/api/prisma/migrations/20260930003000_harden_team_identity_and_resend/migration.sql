-- Tighten team target roles, invitation identity state, and resend concurrency.
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
  IF target.role='OWNER' THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF actor_role='ADMIN' AND target.role NOT IN ('LAWYER','ASSISTANT') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF target.user_id=private.current_user_id() AND p_status<>'ACTIVE' THEN RAISE EXCEPTION 'self deactivation forbidden' USING ERRCODE='42501'; END IF;
  RETURN QUERY UPDATE public.organization_memberships m SET status=p_status,updated_at=statement_timestamp()
    WHERE m.id=p_membership_id RETURNING m.id,m.user_id,m.role,m.status;
END $$;
REVOKE ALL ON FUNCTION private.update_member_status(uuid,public."MembershipStatus") FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.update_member_status(uuid,public."MembershipStatus") TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.accept_invitation(p_token_hash text,p_auth_user_id uuid,p_email text,p_name text)
RETURNS TABLE(organization_id uuid,membership_id uuid,role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE inv public.invitations%ROWTYPE; app_user public.users%ROWTYPE; membership_uuid uuid; normalized_email text;
BEGIN
  normalized_email:=lower(btrim(p_email));
  SELECT * INTO inv FROM public.invitations i WHERE i.token_hash=p_token_hash FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid invitation' USING ERRCODE='P0002'; END IF;
  IF inv.status<>'PENDING' THEN RAISE EXCEPTION 'invitation unavailable' USING ERRCODE='55000'; END IF;
  IF inv.expires_at<=statement_timestamp() THEN RAISE EXCEPTION 'invitation expired' USING ERRCODE='22023'; END IF;
  IF inv.email<>normalized_email THEN RAISE EXCEPTION 'invitation identity mismatch' USING ERRCODE='28000'; END IF;
  SELECT * INTO app_user FROM public.users u WHERE u.auth_user_id=p_auth_user_id FOR UPDATE;
  IF FOUND THEN
    IF lower(app_user.email)<>normalized_email THEN RAISE EXCEPTION 'auth identity conflict' USING ERRCODE='23505'; END IF;
    IF app_user.status NOT IN ('ACTIVE','INVITED') THEN RAISE EXCEPTION 'user unavailable' USING ERRCODE='42501'; END IF;
    UPDATE public.users SET name=p_name,status=CASE WHEN status='INVITED' THEN 'ACTIVE'::public."UserStatus" ELSE status END,updated_at=statement_timestamp() WHERE id=app_user.id RETURNING * INTO app_user;
  ELSE
    SELECT * INTO app_user FROM public.users u WHERE lower(u.email)=normalized_email FOR UPDATE;
    IF FOUND THEN
      IF app_user.auth_user_id IS NOT NULL AND app_user.auth_user_id<>p_auth_user_id THEN RAISE EXCEPTION 'email identity conflict' USING ERRCODE='23505'; END IF;
      IF app_user.status NOT IN ('ACTIVE','INVITED') THEN RAISE EXCEPTION 'user unavailable' USING ERRCODE='42501'; END IF;
      UPDATE public.users SET auth_user_id=p_auth_user_id,name=p_name,status=CASE WHEN status='INVITED' THEN 'ACTIVE'::public."UserStatus" ELSE status END,updated_at=statement_timestamp() WHERE id=app_user.id RETURNING * INTO app_user;
    ELSE
      INSERT INTO public.users(id,auth_user_id,name,email,status,updated_at) VALUES(gen_random_uuid(),p_auth_user_id,p_name,normalized_email,'ACTIVE',statement_timestamp()) RETURNING * INTO app_user;
    END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM public.organization_memberships m WHERE m.organization_id=inv.organization_id AND m.user_id=app_user.id) THEN RAISE EXCEPTION 'membership already exists' USING ERRCODE='23505'; END IF;
  membership_uuid:=gen_random_uuid();
  INSERT INTO public.organization_memberships(id,organization_id,user_id,role,status,invited_at,accepted_at,updated_at)
    VALUES(membership_uuid,inv.organization_id,app_user.id,inv.role,'ACTIVE',inv.sent_at,statement_timestamp(),statement_timestamp());
  PERFORM set_config('app.accepting_invitation','on',true);
  UPDATE public.invitations SET status='ACCEPTED',accepted_at=statement_timestamp(),accepted_by_user_id=app_user.id,updated_at=statement_timestamp() WHERE id=inv.id;
  INSERT INTO public.audit_logs(id,organization_id,user_id,action,entity_type,entity_id,metadata)
    VALUES(gen_random_uuid(),inv.organization_id,app_user.id,'invitation.accepted','invitation',inv.id,jsonb_build_object('role',inv.role::text));
  RETURN QUERY SELECT inv.organization_id,membership_uuid,inv.role::text;
END $$;
REVOKE ALL ON FUNCTION private.accept_invitation(text,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.accept_invitation(text,uuid,text,text) TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.rotate_invitation_token(p_invitation_id uuid,p_token_hash text,p_expires_at timestamptz,p_cooldown_seconds integer)
RETURNS TABLE(id uuid,email text,role public."OrganizationRole",status public."InvitationStatus",expires_at timestamptz,sent_at timestamptz,last_sent_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE inv public.invitations%ROWTYPE; actor_role public."OrganizationRole"; now_at timestamptz:=statement_timestamp();
BEGIN
  SELECT m.role INTO actor_role FROM public.organization_memberships m WHERE m.organization_id=private.current_organization_id() AND m.user_id=private.current_user_id() AND m.status='ACTIVE';
  IF actor_role NOT IN ('OWNER','ADMIN') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO inv FROM public.invitations i WHERE i.id=p_invitation_id AND i.organization_id=private.current_organization_id() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found' USING ERRCODE='P0002'; END IF;
  IF actor_role='ADMIN' AND inv.role NOT IN ('LAWYER','ASSISTANT') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF inv.status<>'PENDING' OR inv.expires_at<=now_at THEN RAISE EXCEPTION 'invitation unavailable' USING ERRCODE='55000'; END IF;
  IF inv.last_sent_at + make_interval(secs=>p_cooldown_seconds)>now_at THEN RAISE EXCEPTION 'resend cooldown' USING ERRCODE='P0001'; END IF;
  RETURN QUERY UPDATE public.invitations i SET token_hash=p_token_hash,expires_at=p_expires_at,sent_at=now_at,last_sent_at=now_at,updated_at=now_at WHERE i.id=inv.id
    RETURNING i.id,i.email,i.role,i.status,i.expires_at,i.sent_at,i.last_sent_at;
END $$;
REVOKE ALL ON FUNCTION private.rotate_invitation_token(uuid,text,timestamptz,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.rotate_invitation_token(uuid,text,timestamptz,integer) TO jurisvia_app;