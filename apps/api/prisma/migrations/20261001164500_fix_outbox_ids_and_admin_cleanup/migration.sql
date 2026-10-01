CREATE OR REPLACE FUNCTION private.protect_last_platform_administrator() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE remaining bigint; owner_name text;
BEGIN
  SELECT tableowner INTO owner_name FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename='platform_administrators';
  IF current_user=owner_name AND current_setting('app.allow_admin_cleanup',true)='on' THEN
    RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
  END IF;
  IF OLD.active AND (TG_OP='DELETE' OR NOT NEW.active) THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('jurisvia:last-platform-administrator'));
    SELECT count(*) INTO remaining FROM public.platform_administrators WHERE active AND id<>OLD.id;
    IF remaining=0 THEN RAISE EXCEPTION 'last active platform administrator cannot be removed' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION private.protect_last_platform_administrator() FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.claim_email_delivery(
  p_organization_id uuid,p_idempotency_key text,p_provider text,p_category text,p_template text,p_recipient_masked text,
  p_lease_seconds integer DEFAULT 300,p_max_attempts integer DEFAULT 3
) RETURNS TABLE(id uuid,status public."EmailDeliveryStatus",provider_message_id text,attempt_count integer,claimed boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v public.email_deliveries%ROWTYPE;
BEGIN
  INSERT INTO public.email_deliveries(id,organization_id,idempotency_key,provider,category,template,recipient_masked,status,attempt_count,created_at,updated_at)
  VALUES(gen_random_uuid(),p_organization_id,p_idempotency_key,p_provider,p_category,p_template,p_recipient_masked,'QUEUED',0,now(),now())
  ON CONFLICT (idempotency_key) DO NOTHING;
  SELECT * INTO v FROM public.email_deliveries e WHERE e.idempotency_key=p_idempotency_key FOR UPDATE;
  IF v.status IN ('SENT','DELIVERED','BOUNCED','COMPLAINED','SUPPRESSED') THEN RETURN QUERY SELECT v.id,v.status,v.provider_message_id,v.attempt_count,false; RETURN; END IF;
  IF v.status='SENDING' AND v.claimed_at>now()-pg_catalog.make_interval(secs=>p_lease_seconds) THEN RETURN QUERY SELECT v.id,v.status,v.provider_message_id,v.attempt_count,false; RETURN; END IF;
  IF v.status='FAILED' AND v.attempt_count>=p_max_attempts THEN RETURN QUERY SELECT v.id,v.status,v.provider_message_id,v.attempt_count,false; RETURN; END IF;
  UPDATE public.email_deliveries e SET status='SENDING',attempt_count=e.attempt_count+1,claimed_at=now(),failure_code=NULL,updated_at=now() WHERE e.id=v.id
  RETURNING e.id,e.status,e.provider_message_id,e.attempt_count INTO v.id,v.status,v.provider_message_id,v.attempt_count;
  RETURN QUERY SELECT v.id,v.status,v.provider_message_id,v.attempt_count,true;
END $$;
REVOKE ALL ON FUNCTION private.claim_email_delivery(uuid,text,text,text,text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.claim_email_delivery(uuid,text,text,text,text,text,integer,integer) TO jurisvia_app;