# ADR 0001 — URL canônica e indexação pública

- **Status:** aceita
- **Data:** 27/09/2026

## Contexto

A área pública precisa de uma origem canônica única, metadata coerente e regras explícitas para páginas comerciais e documentos legais ainda preliminares.

## Opções consideradas

1. Não publicar artefatos de SEO até o domínio definitivo.
2. Usar a URL confirmada para esta fase e registrar como atualizá-la.
3. Indexar também os documentos legais preliminares.

## Decisão

A origem canônica pública é `https://saas-juridico-theta.vercel.app`. O sitemap inclui somente `/`, `/recursos`, `/seguranca`, `/planos`, `/contato` e `/faq`. As páginas preliminares `/privacidade` e `/termos` usam `noindex, nofollow` até revisão jurídica.

A aplicação publica metadata canônica, Open Graph, Twitter, manifest, robots, sitemap e dados estruturados compatíveis com conteúdo visível. Não são declarados `Offer`, `Product` ou `Organization`.

## Consequências

Mudança de domínio exige atualização coordenada da origem canônica, sitemap e metadata. Documentos legais permanecem preliminares e não representam revisão jurídica concluída.
