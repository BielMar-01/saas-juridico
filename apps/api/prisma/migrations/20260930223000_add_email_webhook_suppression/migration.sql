-- CreateTable
CREATE TABLE "email_webhook_events" (
    "id" UUID NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "delivery_id" UUID,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_suppressions" (
    "id" UUID NOT NULL,
    "email_hash" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_webhook_events_provider_event_id_key" ON "email_webhook_events"("provider_event_id");

-- CreateIndex
CREATE INDEX "email_webhook_events_delivery_id_occurred_at_idx" ON "email_webhook_events"("delivery_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_suppressions_email_hash_key" ON "email_suppressions"("email_hash");

-- AddForeignKey
ALTER TABLE "email_webhook_events" ADD CONSTRAINT "email_webhook_events_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "email_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE public.email_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_webhook_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_webhook_events, public.email_suppressions FROM PUBLIC, anon, authenticated, jurisvia_app;

CREATE OR REPLACE FUNCTION private.is_email_suppressed(p_email_hash text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM public.email_suppressions WHERE email_hash=p_email_hash)
$$;
REVOKE ALL ON FUNCTION private.is_email_suppressed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_email_suppressed(text) TO jurisvia_app;

CREATE OR REPLACE FUNCTION private.record_email_webhook(p_event_id text,p_message_id text,p_type text,p_occurred_at timestamptz,p_recipient_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE target_id uuid; next_status public."EmailDeliveryStatus"; inserted_id uuid;
BEGIN
 IF p_event_id IS NULL OR p_event_id='' OR p_message_id IS NULL OR p_message_id='' THEN RETURN false; END IF;
 SELECT id INTO target_id FROM public.email_deliveries WHERE provider_message_id=p_message_id;
 INSERT INTO public.email_webhook_events(id,provider_event_id,delivery_id,event_type,occurred_at,created_at)
 VALUES(gen_random_uuid(),p_event_id,target_id,p_type,coalesce(p_occurred_at,statement_timestamp()),statement_timestamp())
 ON CONFLICT(provider_event_id) DO NOTHING RETURNING id INTO inserted_id;
 IF inserted_id IS NULL THEN RETURN false; END IF;
 next_status:=CASE p_type WHEN 'email.delivered' THEN 'DELIVERED' WHEN 'email.delivery_delayed' THEN 'DELAYED' WHEN 'email.bounced' THEN 'BOUNCED' WHEN 'email.complained' THEN 'COMPLAINED' WHEN 'email.failed' THEN 'FAILED' ELSE NULL END;
 IF target_id IS NOT NULL AND next_status IS NOT NULL THEN
  UPDATE public.email_deliveries SET status=next_status,last_event_at=coalesce(p_occurred_at,statement_timestamp()),failure_code=CASE WHEN next_status IN('BOUNCED','COMPLAINED','FAILED') THEN p_type ELSE failure_code END,updated_at=statement_timestamp()
  WHERE id=target_id AND status NOT IN('BOUNCED','COMPLAINED','FAILED','SUPPRESSED') AND (last_event_at IS NULL OR last_event_at<=coalesce(p_occurred_at,statement_timestamp()));
 END IF;
 IF p_recipient_hash IS NOT NULL AND p_recipient_hash<>'' AND p_type IN('email.bounced','email.complained') THEN
  INSERT INTO public.email_suppressions(id,email_hash,reason,provider_event_id,created_at) VALUES(gen_random_uuid(),p_recipient_hash,p_type,p_event_id,statement_timestamp()) ON CONFLICT(email_hash) DO NOTHING;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION private.record_email_webhook(text,text,text,timestamptz,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.record_email_webhook(text,text,text,timestamptz,text) TO jurisvia_app;