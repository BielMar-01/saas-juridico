CREATE OR REPLACE FUNCTION private.sync_verified_user_email(p_auth_user_id uuid,p_email text)
RETURNS TABLE(id uuid,name text,email text,status public."UserStatus",updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_user public.users%ROWTYPE; v_normalized text; v_old_hash text;
BEGIN
  v_normalized:=lower(trim(p_email));
  IF v_normalized='' THEN RAISE EXCEPTION 'verified email is required' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_user FROM public.users u WHERE u.auth_user_id=p_auth_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'user not found' USING ERRCODE='P0002'; END IF;
  IF v_user.id IS DISTINCT FROM private.current_user_id() THEN RAISE EXCEPTION 'identity context mismatch' USING ERRCODE='42501'; END IF;
  IF lower(v_user.email)=v_normalized THEN RETURN QUERY SELECT v_user.id,v_user.name,v_user.email,v_user.status,v_user.updated_at; RETURN; END IF;
  v_old_hash:=encode(public.digest(lower(v_user.email),'sha256'),'hex');
  BEGIN
    UPDATE public.users u SET email=v_normalized,updated_at=now() WHERE u.id=v_user.id RETURNING u.* INTO v_user;
  EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'email already linked' USING ERRCODE='23505'; END;
  INSERT INTO public.account_identity_audits(id,user_id,previous_email_hash,new_email_hash)
  VALUES(gen_random_uuid(),v_user.id,v_old_hash,encode(public.digest(v_normalized,'sha256'),'hex'));
  RETURN QUERY SELECT v_user.id,v_user.name,v_user.email,v_user.status,v_user.updated_at;
END $$;
REVOKE ALL ON FUNCTION private.sync_verified_user_email(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.sync_verified_user_email(uuid,text) TO jurisvia_app;