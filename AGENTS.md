# Instruções do projeto

## Objetivo atual

Organizar e validar as fontes do SaaS jurídico antes de criar a aplicação. Não inicialize Next.js, Fastify, Supabase, Git, GitHub ou Vercel sem uma solicitação explícita do usuário.

## Fontes obrigatórias

Leia apenas o necessário para a tarefa:

- Produto e escopo: `docs/produto/plano-de-negocio.md`.
- Regras funcionais: `docs/produto/regras-de-negocio.md`.
- Design e responsividade: `docs/design/briefing-marca-ux.md`.
- Decisões visuais válidas: `docs/design/decisoes.md`.
- Artes exploratórias: `docs/design/catalogo-artes.md`.
- Arquitetura: `docs/tecnica/arquitetura.md`.
- Decisões técnicas futuras: `docs/tecnica/decisoes/`.
- Fluxo dos agentes: `docs/fluxo-de-trabalho.md`.

## Prioridade em caso de conflito

1. Instrução atual do usuário.
2. Decisões registradas em `docs/tecnica/decisoes/` e `docs/design/decisoes.md`.
3. Regras de negócio numeradas.
4. Plano de negócio, briefing e arquitetura.
5. Código existente, quando for criado.

Se duas fontes conflitarem, não escolha silenciosamente. Informe a divergência e peça uma decisão.

## Regras permanentes

- O nome do produto é provisório até decisão registrada.
- Artes são referências exploratórias, não especificação final, salvo quando marcadas como aprovadas em `docs/design/decisoes.md`.
- Nunca expor dados reais de clientes ou processos em telas públicas, testes ou exemplos.
- Preservar isolamento entre escritórios, privilégio mínimo e separação entre conteúdo interno e conteúdo publicado ao cliente.
- Documentos jurídicos são privados por padrão.
- Não inventar scripts, comandos ou serviços ainda inexistentes.
- Antes de implementar, declarar escopo e critérios de aceite.
- Depois de implementar, executar apenas verificações realmente disponíveis no repositório e relatar resultados exatos.
- Não fazer commit, push, provisionamento ou deploy sem autorização explícita.

## Fluxo padrão

Área pública:

`planejador -> designer_publico -> frontend -> qa -> revisor -> commit -> deploy`

Se QA ou revisão encontrar problema, retornar ao responsável pela implementação e repetir a validação. O backend entra apenas quando a entrega exigir API, autenticação, persistência ou regra de domínio.

## Estado de comandos

O bootstrap do monorepo foi concluído. Os comandos disponíveis na raiz são:

- `pnpm install` — instala as dependências do workspace.
- `pnpm dev` — inicia web e API em desenvolvimento; exige as variáveis obrigatórias da API.
- `pnpm dev:web` — inicia somente a aplicação web.
- `pnpm dev:api` — inicia somente a API.
- `pnpm lint` — executa o lint de todos os pacotes.
- `pnpm typecheck` — gera os tipos do Next.js e valida o TypeScript de web e API.
- `pnpm test` — executa os testes automatizados disponíveis; atualmente são 15 testes em 4 arquivos da API.
- `pnpm build` — gera os builds de produção de web e API.
- `pnpm start` — gera os builds necessários e inicia web e API via Turborepo; exige as variáveis obrigatórias da API.
- `pnpm start:web` — inicia somente o build da web.
- `pnpm start:api` — inicia somente o build da API.
