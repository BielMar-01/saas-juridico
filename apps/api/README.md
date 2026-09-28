# API JurisVia

Fundação da API de domínio com PostgreSQL de desenvolvimento configurado e migration `init_foundation` aplicada. Supabase Auth, Storage, RLS, CRUD e o deploy da API ainda não foram configurados.

## Requisitos e configuração

Use Node.js 24 e pnpm 11. Copie `.env.example` para `.env` local e preencha os valores sem versioná-los. O servidor exige `DATABASE_URL`; os testes e o build não exigem banco. Para Prisma CLI, `DIRECT_URL` é obrigatória.

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
```

Migrations devem usar `prisma:migrate:dev -- --name <nome>` somente com conexão de desenvolvimento confirmada. A migration `init_foundation` foi revisada e aplicada somente no banco de desenvolvimento. Consulte `docs/tecnica/migrations.md`.

## Endpoints

- `GET /api/v1/health`: liveness independente do banco.
- `GET /api/v1/health/database`: consulta segura `SELECT 1`; retorna 503 se PostgreSQL estiver indisponível.
- `GET /api/docs`: Swagger UI.

Sucessos usam `{ data, meta, requestId }`; erros usam `{ error: { code, message, details? }, requestId }`.

## Segurança e próximos passos

CORS aceita apenas `WEB_ORIGIN`; Helmet, limite de requisições, cookies, request ID, logs estruturados com redaction e erros seguros estão configurados. Cookies apenas preparam autenticação futura. Auth, RBAC, Storage privado e RLS continuam fora do escopo.

## Isolamento de ambiente no Turborepo

Variáveis de banco e Supabase são encaminhadas somente às tarefas `dev` e `start` de `apps/api/turbo.json`. A configuração raiz compartilha apenas `NODE_ENV`; a web não recebe credenciais da API pelo Turborepo.
