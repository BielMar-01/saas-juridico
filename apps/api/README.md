# API JurisVia

A API de domínio usa Fastify, Prisma e PostgreSQL com 29 migrations aplicadas até `bind_email_sync_to_current_user`. O runtime possui isolamento multi-tenant, Auth/JWT, CRUD de clientes, gestão de equipe e convites, lifecycle organizacional, transferência de ownership, administração global e infraestrutura de e-mail. O banco de desenvolvimento permanece sem dados de aplicação. A API serverless está publicada separadamente da web em `https://saas-juridico-api.vercel.app`. Storage e ACL por caso/portal do cliente continuam pendentes; Resend e o primeiro SUPER_ADMIN dependem de configuração externa controlada.

## Requisitos e configuração

Use Node.js 24 e pnpm 11. Copie `.env.example` para `.env` local e preencha os valores sem versioná-los. O servidor usa `DATABASE_URL`; testes de integração e scripts administrativos controlados também usam `DIRECT_URL`. O build não exige banco.

- `DATABASE_URL`: pooler PostgreSQL da aplicação.
- `DIRECT_URL`: conexão administrativa exclusiva de migrations, testes de integração e scripts controlados.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_JWKS_URL`: runtime HTTP de Auth.
- `SUPABASE_SECRET_KEY`: somente scripts administrativos; nunca servidor HTTP ou frontend.
- `INVITATION_TOKEN_SECRET`, `INVITATION_TTL_HOURS` e `INVITATION_RESEND_COOLDOWN_SECONDS`: proteção e ciclo de vida dos convites.

## Comandos

```bash
pnpm --filter @saas-juridico/api dev
pnpm --filter @saas-juridico/api build
pnpm start:api
pnpm --filter @saas-juridico/api lint
pnpm --filter @saas-juridico/api typecheck
pnpm --filter @saas-juridico/api test # 119 testes em 26 arquivos
pnpm --filter @saas-juridico/api prisma:format
pnpm --filter @saas-juridico/api prisma:validate
pnpm --filter @saas-juridico/api prisma:generate
pnpm --filter @saas-juridico/api admin:preflight-migration
pnpm --filter @saas-juridico/api admin:audit-database-security
```

Migrations devem usar `prisma:migrate:dev -- --name <nome>` somente com a conexão de desenvolvimento confirmada. As 29 migrations foram revisadas e aplicadas no banco de desenvolvimento. Consulte `docs/tecnica/migrations.md`.

## Endpoints

- `GET /api/v1/health` e `GET /api/v1/health/database`.
- `GET /api/docs`: Swagger UI somente fora de produção.
- `GET /api/v1/auth/me` e `GET /api/v1/auth/organizations`.
- CRUD de clientes em `/api/v1/clients`.
- membros e convites em `/api/v1/team/*`.
- aceite autenticado em `POST /api/v1/invitations/accept`.

Sucessos usam `{ data, meta, requestId }`; erros usam `{ error: { code, message, details? }, requestId }`.

## Segurança e isolamento

CORS aceita somente `WEB_ORIGIN`; Helmet, rate limit, cookies, request ID, logs com redaction e erros seguros estão configurados. A API valida JWT por JWKS, resolve o escritório ativo e aplica RBAC e AAL2 antes de operações administrativas. Consultas tenant usam `withTenant`; RLS forçada protege 19 tabelas; as 11 tabelas de negócio possuem 44 policies explícitas. `anon` e `authenticated` não possuem grants nas tabelas de negócio.

`OWNER` administra não proprietários; `ADMIN` administra somente `LAWYER` e `ASSISTANT`; `LAWYER` possui leitura da equipe. `CLIENT` não é membership administrativa. Convites têm token aleatório armazenado como HMAC, expiração, uso único, rotação atômica e aceite vinculado ao e-mail verificado. A entrega de e-mail ainda exige um provedor transacional.

O bootstrap inicial usa script administrativo. A gestão de membros e convites, o handoff de `OWNER` e o lifecycle organizacional estão implementados por funções privadas mínimas e auditáveis. ACL por caso/equipe e permissões do portal do cliente permanecem futuras.

## Serverless e Turborepo

`src/server.ts` abre porta somente no modo local. `api/[...path].ts` é o handler catch-all serverless e reutiliza Fastify e Prisma por instância. Nenhuma migration roda no build, boot ou request. `DIRECT_URL` e `SUPABASE_SECRET_KEY` não são encaminhadas às tarefas HTTP `dev` e `start` no Turbo.