# Backend autenticado — Auth e clientes

## JWT e Supabase Auth

A API valida access tokens do Supabase com `jose`, JWKS remoto HTTPS, cache em memória, rotação por `kid`, timeout de 3 segundos e whitelist `ES256`/`RS256`. A validação exige `iss` derivado de `SUPABASE_URL`, audiência `authenticated`, `exp`, `sub` UUID, `role=authenticated` e `is_anonymous=false`; `nbf` é validado quando presente. Falhas de token retornam 401 genérico e indisponibilidade do JWKS retorna 503 genérico. Tokens e cabeçalhos de organização são redigidos dos logs.

A validação sanitizada do ambiente confirmou que DNS, TLS e o endpoint JWKS real estão acessíveis e que existe chave assimétrica. Um fluxo efêmero também confirmou Admin API, criação de identidade fictícia, bootstrap, sessão, JWT, organizações, `/me` e criação/leitura de cliente; a identidade e todas as linhas fictícias foram removidas em `finally`. Alterações de signing key, MFA, duração do JWT, redirect URLs e provedores pertencem ao Dashboard do Supabase e não podem ser feitas pelo repositório. Login, logout e recuperação de senha continuam diretamente entre a web e Supabase Auth; a API recebe apenas Bearer token.

## Principal e organização

`GET /api/v1/auth/organizations` lista somente vínculos ativos de usuário e organização ativos. `GET /api/v1/auth/me` aceita `X-Organization-Id`; sem header, seleciona automaticamente apenas quando existe exatamente uma organização. IDs ausentes, inválidos ou de outro tenant falham sem revelar existência. Essas duas rotas autenticadas de descoberta são isentas do gate AAL2 para que a web consiga identificar o usuário, selecionar o escritório e encaminhar enrollment ou challenge de MFA. Todas as rotas tenant de domínio, inclusive todas as operações de clientes, passam por `requirePermission`: `OWNER` e `ADMIN` exigem `aal2`; os demais papéis seguem a matriz de permissão em `aal1` ou `aal2`. A API aplica o gate mesmo quando chamada diretamente, independentemente do gate visual da web.

A matriz central é deny-default. Todos os papéis podem ler clientes; OWNER, ADMIN, LAWYER e ASSISTANT podem criar e alterar. FINANCIAL e VIEWER ficam somente leitura. Novas permissões devem ser adicionadas explicitamente e testadas.

## Clientes

Rotas autenticadas: `POST /api/v1/clients`, `GET /api/v1/clients`, `GET /api/v1/clients/:id`, `PATCH /api/v1/clients/:id` e `PATCH /api/v1/clients/:id/status`. A organização nunca vem do corpo. CPF/CNPJ são normalizados e validados; `INDIVIDUAL` aceita somente CPF e `LEGAL_ENTITY` somente CNPJ. No PATCH, a validação combina os campos enviados com o registro persistido e rejeita com 422 qualquer estado final incompatível, inclusive alterações isoladas de tipo ou documento. Documento ativo é único por organização no banco. Listas possuem paginação limitada, filtros e ordenação allowlist. Escritas e auditoria ocorrem na mesma transação `withTenant`. IDs de outro tenant retornam 404. Não existe hard delete público; status e `deleted_at` sustentam desativação e soft delete.

## Bootstrap administrativo

`pnpm --filter @saas-juridico/api admin:bootstrap-organization` requer variáveis locais `BOOTSTRAP_*`, verifica primeiro o usuário pela Admin API do Supabase e então cria de forma idempotente User ACTIVE, Organization ACTIVE, OWNER ACTIVE e auditoria em uma transação administrativa. `BOOTSTRAP_MODE=verify` valida a identidade sem escrever. O script não roda em start, build ou endpoint e não registra valores. Conflitos causam rollback e saída diferente de zero.

A credencial administrativa e `DIRECT_URL` nunca pertencem ao servidor HTTP. O bootstrap inicial e handoffs permanecem operações controladas. Nenhum usuário real foi criado nesta etapa.

## Frontend autenticado — 29/09/2026

A web usa `@supabase/ssr` com clientes separados de navegador, servidor e Proxy do Next.js 16. Somente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_API_URL` pertencem ao frontend. Login, recuperação, redefinição e MFA TOTP ocorrem diretamente no Supabase Auth; não há cadastro público.

O Proxy atualiza cookies e faz apenas a proteção otimista de `/app/*`. O layout protegido repete a validação com `getClaims()`; a API continua sendo a autoridade sobre usuário, escritório, papel e dados. A preferência de escritório ativo fica no navegador, mas só é aceita quando reaparece em `GET /api/v1/auth/organizations` e é confirmada por `GET /api/v1/auth/me`. OWNER e ADMIN passam pelo gate AAL2.

O cliente HTTP adiciona Bearer token, `X-Organization-Id` e `X-Request-Id`, tenta uma renovação em 401 e encerra a sessão local se a renovação falhar. Ele não registra token, headers ou respostas sensíveis. A tela `/app/clientes` respeita gating visual, mas todas as decisões de acesso permanecem na API.
