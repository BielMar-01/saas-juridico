ALTER TYPE public."EmailDeliveryStatus" ADD VALUE IF NOT EXISTS 'SENDING';

ALTER TABLE public.notification_preferences
  ADD CONSTRAINT notification_preferences_system_enabled_required CHECK (system_enabled);

CREATE OR REPLACE FUNCTION private.enforce_mandatory_system_notifications() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
  IF NOT NEW.system_enabled THEN
    RAISE EXCEPTION 'system notifications are mandatory' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.enforce_mandatory_system_notifications() FROM PUBLIC;
CREATE TRIGGER enforce_mandatory_system_notifications
BEFORE INSERT OR UPDATE OF system_enabled ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION private.enforce_mandatory_system_notifications();

CREATE OR REPLACE FUNCTION private.protect_last_platform_administrator() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE remaining bigint;
BEGIN
  IF OLD.active AND (TG_OP='DELETE' OR NOT NEW.active) THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('jurisvia:last-platform-administrator'));
    SELECT count(*) INTO remaining
      FROM public.platform_administrators
      WHERE active AND id<>OLD.id;
    IF remaining=0 THEN
      RAISE EXCEPTION 'last active platform administrator cannot be removed' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION private.protect_last_platform_administrator() FROM PUBLIC;

ALTER TABLE public.email_deliveries
  ADD COLUMN attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN claimed_at timestamptz(3),
  ADD CONSTRAINT email_deliveries_attempt_count_nonnegative CHECK (attempt_count >= 0);

CREATE OR REPLACE FUNCTION private.claim_email_delivery(
  p_organization_id uuid,
  p_idempotency_key text,
  p_provider text,
  p_category text,
  p_template text,
  p_recipient_masked text,
  p_lease_seconds integer DEFAULT 300,
  p_max_attempts integer DEFAULT 3
) RETURNS TABLE(id uuid,status public."EmailDeliveryStatus",provider_message_id text,attempt_count integer,claimed boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v public.email_deliveries%ROWTYPE;
BEGIN
  INSERT INTO public.email_deliveries(organization_id,idempotency_key,provider,category,template,recipient_masked,status,attempt_count,created_at,updated_at)
  VALUES(p_organization_id,p_idempotency_key,p_provider,p_category,p_template,p_recipient_masked,'QUEUED',0,now(),now())
  ON CONFLICT (idempotency_key) DO NOTHING;

  SELECT * INTO v FROM public.email_deliveries e WHERE e.idempotency_key=p_idempotency_key FOR UPDATE;
  IF v.status IN ('SENT','DELIVERED','BOUNCED','COMPLAINED','SUPPRESSED') THEN
    RETURN QUERY SELECT v.id,v.status,v.provider_message_id,v.attempt_count,false; RETURN;
  END IF;
  IF v.status='SENDING' AND v.claimed_at > now()-pg_catalog.make_interval(secs=>p_lease_seconds) THEN
    RETURN QUERY SELECT v.id,v.status,v.provider_message_id,v.attempt_count,false; RETURN;
  END IF;
  IF v.status='FAILED' AND v.attempt_count >= p_max_attempts THEN
    RETURN QUERY SELECT v.id,v.status,v.provider_message_id,v.attempt_count,false; RETURN;
  END IF;

  UPDATE public.email_deliveries e SET status='SENDING',attempt_count=e.attempt_count+1,claimed_at=now(),failure_code=NULL,updated_at=now()
  WHERE e.id=v.id
  RETURNING e.id,e.status,e.provider_message_id,e.attempt_count INTO v.id,v.status,v.provider_message_id,v.attempt_count;
  RETURN QUERY SELECT v.id,v.status,v.provider_message_id,v.attempt_count,true;
END $$;
REVOKE ALL ON FUNCTION private.claim_email_delivery(uuid,text,text,text,text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.claim_email_delivery(uuid,text,text,text,text,text,integer,integer) TO jurisvia_app;
CREATE TABLE public.account_identity_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  previous_email_hash text NOT NULL,
  new_email_hash text NOT NULL,
  created_at timestamptz(3) NOT NULL DEFAULT now()
);
CREATE INDEX account_identity_audits_user_created_idx ON public.account_identity_audits(user_id,created_at);
REVOKE ALL ON TABLE public.account_identity_audits FROM PUBLIC,anon,authenticated,jurisvia_app;

CREATE OR REPLACE FUNCTION private.sync_verified_user_email(p_auth_user_id uuid,p_email text)
RETURNS TABLE(id uuid,name text,email text,status public."UserStatus",updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_user public.users%ROWTYPE; v_normalized text; v_old_hash text;
BEGIN
  v_normalized:=lower(trim(p_email));
  IF v_normalized='' THEN RAISE EXCEPTION 'verified email is required' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_user FROM public.users u WHERE u.auth_user_id=p_auth_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'user not found' USING ERRCODE='P0002'; END IF;
  IF lower(v_user.email)=v_normalized THEN
    RETURN QUERY SELECT v_user.id,v_user.name,v_user.email,v_user.status,v_user.updated_at; RETURN;
  END IF;
  v_old_hash:=encode(public.digest(lower(v_user.email),'sha256'),'hex');
  BEGIN
    UPDATE public.users u SET email=v_normalized,updated_at=now() WHERE u.id=v_user.id
    RETURNING u.* INTO v_user;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'email already linked' USING ERRCODE='23505';
  END;
  INSERT INTO public.account_identity_audits(user_id,previous_email_hash,new_email_hash)
  VALUES(v_user.id,v_old_hash,encode(public.digest(v_normalized,'sha256'),'hex'));
  RETURN QUERY SELECT v_user.id,v_user.name,v_user.email,v_user.status,v_user.updated_at;
END $$;
REVOKE ALL ON FUNCTION private.sync_verified_user_email(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.sync_verified_user_email(uuid,text) TO jurisvia_app;