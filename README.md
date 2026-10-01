# SaaS jurídico

Monorepo do SaaS para escritórios de advocacia brasileiros. O repositório contém a área pública e a fundação local da API Fastify com modelagem Prisma multi-tenant.

O nome `JurisVia` é provisório. A marca definitiva ainda depende de validação.

## Pré-requisitos

- Node.js 24 ou superior
- pnpm 11 ou superior

As versões usadas no bootstrap foram Node.js `v24.19.0` e pnpm `11.23.0`.

## Instalação

Na raiz do repositório:

```bash
pnpm install
```

## Desenvolvimento

Para iniciar somente a aplicação web:

```bash
pnpm dev:web
```

Para iniciar somente a API, use `pnpm dev:api`. O comando `pnpm dev` inicia web e API e, por isso, exige as variáveis obrigatórias da API. A web fica em `http://localhost:3000` e a API usa `http://127.0.0.1:3333` por padrão.

## Verificações

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Estrutura

- `apps/web`: aplicação Next.js com React, TypeScript e Tailwind CSS.
- `apps/api`: fundação da API Fastify, health checks, OpenAPI, testes e schema Prisma.
- `docs`: fontes de produto, design e arquitetura.
- `.codex`: configuração dos agentes do projeto.

## Fontes do projeto

- [`docs/produto/plano-de-negocio.md`](docs/produto/plano-de-negocio.md): visão completa do negócio.
- [`docs/produto/regras-de-negocio.md`](docs/produto/regras-de-negocio.md): regras numeradas para implementação e testes.
- [`docs/design/briefing-marca-ux.md`](docs/design/briefing-marca-ux.md): identidade, responsividade e comportamento visual.
- [`docs/design/decisoes.md`](docs/design/decisoes.md): decisões visuais aprovadas e pendências.
- [`docs/tecnica/arquitetura.md`](docs/tecnica/arquitetura.md): arquitetura proposta e marcos técnicos.
- [`docs/fluxo-de-trabalho.md`](docs/fluxo-de-trabalho.md): ordem dos agentes e critérios de passagem.

A web e a API serverless estão publicadas em projetos Vercel separados: `https://saas-juridico-theta.vercel.app` e `https://saas-juridico-api.vercel.app`. O PostgreSQL de desenvolvimento recebeu 29 migrations, incluindo convites, lifecycle organizacional, transferência de ownership, administração global e metadados de e-mail; o papel runtime, RLS e grants mínimos estão configurados. A verificação JWT do Supabase Auth está configurada. Storage permanece não configurado.

## API

A API Fastify fica em `apps/api`. Use `pnpm dev:web` ou `pnpm dev:api` para desenvolvimento isolado. Após `pnpm build`, use `pnpm start:web` ou `pnpm start:api` para iniciar apenas um app; `pnpm start` inicia os dois pacotes via Turborepo e exige as variáveis da API. Sem definir `PORT`, a web usa `3000` e a API usa `3333`; um `PORT` compartilhado deve ser evitado no comando conjunto. `pnpm test` executa os testes disponíveis. Consulte `apps/api/README.md`, `docs/tecnica/modelo-de-dados.md` e `docs/tecnica/ambiente-e-supabase.md`.


## Web autenticada

Copie `apps/web/.env.example` para `apps/web/.env.local` e informe apenas a URL pública do Supabase, a chave publicável e a URL da API. Nunca coloque secret key, service role, `DATABASE_URL` ou `DIRECT_URL` na web.

- `pnpm dev:web` inicia somente a web.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` validam o monorepo.
- Não existe cadastro público; contas e vínculos são provisionados pelo fluxo administrativo controlado.

## Segurança organizacional e administração global

O Bloco 4 implementa lifecycle de organizações, transferência de ownership, preferências de notificação, metadados de e-mail, webhook Resend e SUPER_ADMIN global com AAL2 recente. Consulte `docs/tecnica/bloco-4-seguranca-email-admin.md` e `docs/tecnica/decisoes/ADR-0004-administracao-global-e-email.md`.

O bootstrap de SUPER_ADMIN exige um usuário interno já existente, `SUPER_ADMIN_EMAIL` e `DIRECT_URL` em ambiente administrativo controlado; em produção também exige confirmação explícita. Resend permanece desabilitado enquanto chave, segredo de webhook, remetentes verificados e SMTP/DNS não forem configurados externamente.
