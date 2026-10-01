CREATE OR REPLACE FUNCTION private.protect_last_platform_administrator() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE remaining bigint;
BEGIN
 IF OLD.active AND (TG_OP='DELETE' OR NOT NEW.active) THEN
  SELECT count(*) INTO remaining FROM public.platform_administrators WHERE active AND id<>OLD.id;
  IF remaining=0 THEN RAISE EXCEPTION 'last active platform administrator cannot be removed' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION private.protect_last_platform_administrator() FROM PUBLIC;
CREATE TRIGGER protect_last_platform_administrator BEFORE UPDATE OR DELETE ON public.platform_administrators FOR EACH ROW EXECUTE FUNCTION private.protect_last_platform_administrator();