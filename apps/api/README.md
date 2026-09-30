# API JurisVia

A API de domínio usa Fastify, Prisma e PostgreSQL com doze migrations aplicadas até `harden_admin_role_targets`. O runtime possui isolamento multi-tenant, Auth/JWT, CRUD de clientes e gestão de equipe e convites. O banco de desenvolvimento permanece sem dados de aplicação. Storage, handoff de propriedade, ACL por caso/portal do cliente e publicação da API continuam pendentes.

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
pnpm --filter @saas-juridico/api test
pnpm --filter @saas-juridico/api prisma:format
pnpm --filter @saas-juridico/api prisma:validate
pnpm --filter @saas-juridico/api prisma:generate
pnpm --filter @saas-juridico/api admin:preflight-migration
pnpm --filter @saas-juridico/api admin:audit-database-security
```

Migrations devem usar `prisma:migrate:dev -- --name <nome>` somente com a conexão de desenvolvimento confirmada. As doze migrations foram revisadas e aplicadas somente no banco de desenvolvimento. Consulte `docs/tecnica/migrations.md`.

## Endpoints

- `GET /api/v1/health` e `GET /api/v1/health/database`.
- `GET /api/docs`: Swagger UI somente fora de produção.
- `GET /api/v1/auth/me` e `GET /api/v1/auth/organizations`.
- CRUD de clientes em `/api/v1/clients`.
- membros e convites em `/api/v1/team/*`.
- aceite autenticado em `POST /api/v1/invitations/accept`.

Sucessos usam `{ data, meta, requestId }`; erros usam `{ error: { code, message, details? }, requestId }`.

## Segurança e isolamento

CORS aceita somente `WEB_ORIGIN`; Helmet, rate limit, cookies, request ID, logs com redaction e erros seguros estão configurados. A API valida JWT por JWKS, resolve o escritório ativo e aplica RBAC e AAL2 antes de operações administrativas. Consultas tenant usam `withTenant`; RLS forçada protege 11 tabelas com 44 policies. `anon` e `authenticated` não possuem grants nas tabelas de negócio.

`OWNER` administra não proprietários; `ADMIN` administra somente `LAWYER` e `ASSISTANT`; `LAWYER` possui leitura da equipe. `CLIENT` não é membership administrativa. Convites têm token aleatório armazenado como HMAC, expiração, uso único, rotação atômica e aceite vinculado ao e-mail verificado. A entrega de e-mail ainda exige um provedor transacional.

O bootstrap inicial usa script administrativo. A gestão comum de membros e convites está implementada por funções privadas mínimas; handoff de `OWNER`, lifecycle organizacional completo, ACL por caso/equipe e permissões do portal do cliente permanecem futuras.

## Serverless e Turborepo

`src/server.ts` abre porta somente no modo local. `api/[...path].ts` é o handler catch-all serverless e reutiliza Fastify e Prisma por instância. Nenhuma migration roda no build, boot ou request. `DIRECT_URL` e `SUPABASE_SECRET_KEY` não são encaminhadas às tarefas HTTP `dev` e `start` no Turbo.