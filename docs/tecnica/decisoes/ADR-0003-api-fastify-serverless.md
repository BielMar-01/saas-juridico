# ADR-0003 — Execução serverless da API Fastify

## Decisão

A API mantém `buildApp` sem abrir porta, `server.ts` exclusivo para execução local e `api/[...path].ts` como handler serverless catch-all. O runtime e o Prisma Client são reutilizados por instância aquecida; o pool PostgreSQL possui limite pequeno. Migrations são executadas separadamente com `prisma migrate deploy`, nunca no build, boot ou request.

Na Vercel, `apps/api` é um projeto separado da web. a função catch-all `api/[...path].ts` preserva os caminhos `/api/*`; não há `vercel.json` porque a convenção oficial é suficiente. `trustProxy` é habilitado somente em produção, Swagger fica desabilitado em produção, CORS aceita somente `WEB_ORIGIN`, e logs ocultam autorização, cookies, organização e token de convite.

## Variáveis de runtime

`NODE_ENV`, `LOG_LEVEL`, `WEB_ORIGIN`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWKS_URL`, `INVITATION_TOKEN_SECRET`, `INVITATION_TTL_HOURS` e `INVITATION_RESEND_COOLDOWN_SECONDS`.

`DIRECT_URL` pertence exclusivamente ao processo de migrations. `SUPABASE_SECRET_KEY` não é necessária no runtime HTTP atual. Nenhum valor deve ser versionado ou exposto ao frontend.

## Limitações

O rate limit em memória atua por instância serverless. As proteções persistentes de convite — unique parcial, cooldown gravado, token de alta entropia e aceite atômico — continuam no PostgreSQL. Antes de maior tráfego, o rate limit geral deverá usar armazenamento compartilhado. A entrega de convites também depende de um provedor futuro.