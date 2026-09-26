# SaaS jurídico

Monorepo do SaaS para escritórios de advocacia brasileiros. Nesta etapa, o repositório contém a fundação técnica, a primeira versão da home pública e uma reserva documental para a futura API.

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

Para iniciar a aplicação web:

```bash
pnpm dev
```

Depois, acesse `http://localhost:3000`.

## Verificações

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Estrutura

- `apps/web`: aplicação Next.js com React, TypeScript e Tailwind CSS.
- `apps/api`: espaço reservado para a API futura; não contém backend nesta etapa.
- `docs`: fontes de produto, design e arquitetura.
- `.codex`: configuração dos agentes do projeto.

## Fontes do projeto

- [`docs/produto/plano-de-negocio.md`](docs/produto/plano-de-negocio.md): visão completa do negócio.
- [`docs/produto/regras-de-negocio.md`](docs/produto/regras-de-negocio.md): regras numeradas para implementação e testes.
- [`docs/design/briefing-marca-ux.md`](docs/design/briefing-marca-ux.md): identidade, responsividade e comportamento visual.
- [`docs/design/decisoes.md`](docs/design/decisoes.md): decisões visuais aprovadas e pendências.
- [`docs/tecnica/arquitetura.md`](docs/tecnica/arquitetura.md): arquitetura proposta e marcos técnicos.
- [`docs/fluxo-de-trabalho.md`](docs/fluxo-de-trabalho.md): ordem dos agentes e critérios de passagem.

Banco, autenticação, API, GitHub e Vercel ainda não estão configurados.
