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

A web está publicada. O PostgreSQL de desenvolvimento recebeu quatro migrations até `harden_soft_delete_and_actor_provenance`; o papel runtime, RLS e grants mínimos estão configurados. Supabase Auth, Storage e o deploy da API ainda não foram configurados.

## API

A API Fastify fica em `apps/api`. Use `pnpm dev:web` ou `pnpm dev:api` para desenvolvimento isolado. Após `pnpm build`, use `pnpm start:web` ou `pnpm start:api` para iniciar apenas um app; `pnpm start` inicia os dois pacotes via Turborepo e exige as variáveis da API. Sem definir `PORT`, a web usa `3000` e a API usa `3333`; um `PORT` compartilhado deve ser evitado no comando conjunto. `pnpm test` executa os testes disponíveis. Consulte `apps/api/README.md`, `docs/tecnica/modelo-de-dados.md` e `docs/tecnica/ambiente-e-supabase.md`.
