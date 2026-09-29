# API JurisVia

Fundação da API de domínio com PostgreSQL de desenvolvimento, quatro migrations aplicadas até `harden_soft_delete_and_actor_provenance`, papel runtime restrito e isolamento multi-tenant testado. Supabase Auth, Storage, CRUD e o deploy da API ainda não foram configurados.

## Requisitos e configuração

Use Node.js 24 e pnpm 11. Copie `.env.example` para `.env` local e preencha os valores sem versioná-los. O servidor e os testes de integração exigem `DATABASE_URL`; estes testes também usam `DIRECT_URL` para fixtures administrativas controladas. O build não exige banco. Para Prisma CLI, `DIRECT_URL` é obrigatória.

- `DATABASE_URL`: pooler PostgreSQL para execução da aplicação.
- `DIRECT_URL`: conexão direta PostgreSQL para migrations.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `SUPABASE_JWKS_URL`: reservadas para fases futuras. A secret key é exclusiva da API.

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

Migrations devem usar `prisma:migrate:dev -- --name <nome>` somente com conexão de desenvolvimento confirmada. As quatro migrations foram revisadas e aplicadas somente no banco de desenvolvimento. Consulte `docs/tecnica/migrations.md`.

## Endpoints

- `GET /api/v1/health`: liveness independente do banco.
- `GET /api/v1/health/database`: consulta segura `SELECT 1`; retorna 503 se PostgreSQL estiver indisponível.
- `GET /api/docs`: Swagger UI.

Sucessos usam `{ data, meta, requestId }`; erros usam `{ error: { code, message, details? }, requestId }`.

## Segurança e próximos passos

CORS aceita apenas `WEB_ORIGIN`; Helmet, limite de requisições, cookies, request ID, logs estruturados com redaction e erros seguros estão configurados. Cookies apenas preparam autenticação futura. RLS e privilégios mínimos estão configurados. Auth, RBAC e Storage privado continuam fora do escopo.

## Isolamento de ambiente no Turborepo

Variáveis de banco e Supabase são encaminhadas somente às tarefas `dev` e `start` de `apps/api/turbo.json`. A configuração raiz compartilha apenas `NODE_ENV`; a web não recebe credenciais da API pelo Turborepo.

## Acesso multi-tenant

Operações de domínio devem usar `withTenant` e o `TransactionClient` do callback. Consulte `docs/tecnica/seguranca-multitenant.md` e `docs/tecnica/migrations.md`. O servidor usa somente `DATABASE_URL`; `DIRECT_URL` é administrativa.

O runtime possui leitura tenant de organizações e memberships, mas não pode inserir, alterar ou excluir essas linhas. Bootstrap e handoff de proprietário são operações administrativas futuras, transacionais e auditadas. A credencial runtime nunca deve aceitar SQL fornecido pelo usuário.
