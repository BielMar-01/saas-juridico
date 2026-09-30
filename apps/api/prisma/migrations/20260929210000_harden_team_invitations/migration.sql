-- Tenant safety, invitation lifecycle and runtime grants.
ALTER TABLE public.invitations ADD CONSTRAINT invitations_email_normalized CHECK (email=lower(btrim(email)) AND length(email)>3);
ALTER TABLE public.invitations ADD CONSTRAINT invitations_role_allowed CHECK (role<>'OWNER');
ALTER TABLE public.invitations ADD CONSTRAINT invitations_state_consistent CHECK (
  (status='PENDING' AND accepted_at IS NULL AND accepted_by_user_id IS NULL AND cancelled_at IS NULL)
  OR (status='ACCEPTED' AND accepted_at IS NOT NULL AND accepted_by_user_id IS NOT NULL AND cancelled_at IS NULL)
  OR (status='CANCELLED' AND accepted_at IS NULL AND accepted_by_user_id IS NULL AND cancelled_at IS NOT NULL)
  OR (status='EXPIRED' AND accepted_at IS NULL AND accepted_by_user_id IS NULL AND cancelled_at IS NULL)
);
CREATE UNIQUE INDEX invitations_organization_email_pending_key ON public.invitations(organization_id,lower(email)) WHERE status='PENDING';

CREATE OR REPLACE FUNCTION private.guard_invitation_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.role IS DISTINCT FROM OLD.role OR NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'invitation identity is immutable' USING ERRCODE='55000';
  END IF;
  IF OLD.status<>'PENDING' THEN RAISE EXCEPTION 'invitation is terminal' USING ERRCODE='55000'; END IF;
  IF NEW.status='ACCEPTED' AND current_setting('app.accepting_invitation',true)<>'on' THEN
    RAISE EXCEPTION 'invitation acceptance requires controlled function' USING ERRCODE='55000';
  END IF;
  IF NEW.status='PENDING' AND (NEW.accepted_at IS NOT NULL OR NEW.accepted_by_user_id IS NOT NULL OR NEW.cancelled_at IS NOT NULL) THEN
    RAISE EXCEPTION 'invalid pending invitation' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_invitation_mutation() FROM PUBLIC;
CREATE TRIGGER invitations_mutation_guard BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION private.guard_invitation_mutation();

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations FORCE ROW LEVEL SECURITY;
CREATE POLICY invitations_select ON public.invitations FOR SELECT TO jurisvia_app USING (private.has_active_tenant_access(organization_id));
CREATE POLICY invitations_insert ON public.invitations FOR INSERT TO jurisvia_app WITH CHECK (private.has_active_tenant_access(organization_id) AND created_by_user_id=private.current_user_id() AND role<>'OWNER');
CREATE POLICY invitations_update ON public.invitations FOR UPDATE TO jurisvia_app USING (private.has_active_tenant_access(organization_id)) WITH CHECK (private.has_active_tenant_access(organization_id));
CREATE POLICY invitations_delete ON public.invitations FOR DELETE TO jurisvia_app USING (false);
GRANT SELECT,INSERT,UPDATE ON public.invitations TO jurisvia_app;

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
  IF FOUND AND lower(app_user.email)<>normalized_email THEN RAISE EXCEPTION 'auth identity conflict' USING ERRCODE='23505'; END IF;
  IF NOT FOUND THEN
    SELECT * INTO app_user FROM public.users u WHERE lower(u.email)=normalized_email FOR UPDATE;
    IF FOUND THEN
      IF app_user.auth_user_id IS NOT NULL AND app_user.auth_user_id<>p_auth_user_id THEN RAISE EXCEPTION 'email identity conflict' USING ERRCODE='23505'; END IF;
      UPDATE public.users SET auth_user_id=p_auth_user_id,name=p_name,status='ACTIVE',updated_at=statement_timestamp() WHERE id=app_user.id RETURNING * INTO app_user;
    ELSE
      INSERT INTO public.users(id,auth_user_id,name,email,status,updated_at) VALUES(gen_random_uuid(),p_auth_user_id,p_name,normalized_email,'ACTIVE',statement_timestamp()) RETURNING * INTO app_user;
    END IF;
  ELSE
    UPDATE public.users SET name=p_name,status='ACTIVE',updated_at=statement_timestamp() WHERE id=app_user.id RETURNING * INTO app_user;
  END IF;
  IF EXISTS(SELECT 1 FROM public.organization_memberships m WHERE m.organization_id=inv.organization_id AND m.user_id=app_user.id) THEN
    RAISE EXCEPTION 'membership already exists' USING ERRCODE='23505';
  END IF;
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
