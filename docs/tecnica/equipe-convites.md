# Equipe, papéis e convites

A API trata clientes externos como entidades de negócio. `CLIENT` não é um papel de `OrganizationMembership` e não acessa a administração do escritório.

## Matriz administrativa

- `OWNER`: lê a equipe e administra membros e convites. Pode convidar `ADMIN`, `LAWYER`, `ASSISTANT`, `FINANCIAL` e `VIEWER`. Este fluxo não promove nem rebaixa `OWNER`.
- `ADMIN`: lê a equipe, convida e administra somente `LAWYER` e `ASSISTANT`. Não altera `OWNER` ou outro `ADMIN`.
- `LAWYER`: pode ler a lista de membros, sem administrar membros ou convites.
- `ASSISTANT`, `FINANCIAL` e `VIEWER`: não acessam a administração da equipe.

Operações administrativas de `OWNER` e `ADMIN` exigem AAL2. A API resolve a organização por uma membership ativa; o identificador recebido no header nunca concede acesso por si só.

## Convites

O convite dura 72 horas por padrão. O token contém 32 bytes aleatórios e o banco armazena somente HMAC-SHA-256 com `INVITATION_TOKEN_SECRET`. Apenas um convite `PENDING` pode existir por organização e e-mail normalizado. Antes de listar ou criar, convites vencidos transitam de forma transacional para `EXPIRED`, permitindo um novo convite para o mesmo e-mail; corridas continuam protegidas pelo índice único parcial. `OWNER` não é convidável.

O aceite exige JWT válido e e-mail confirmado no Supabase Auth. O e-mail verificado deve coincidir com o convite. A função transacional no banco bloqueia replay, cancelamento, expiração, concorrência e membership duplicada. O token e o e-mail não são gravados na auditoria.

Não existe entrega real de e-mail neste bloco. A abstração de entrega é inerte em desenvolvimento e indisponível em produção, sem registrar ou retornar tokens. Um provedor transacional deverá ser conectado antes de usar convites em produção.

## Endpoints

- `GET /api/v1/team/members`
- `GET /api/v1/team/members/:id`
- `PATCH /api/v1/team/members/:id/role`
- `PATCH /api/v1/team/members/:id/status`
- `GET /api/v1/team/invitations`
- `POST /api/v1/team/invitations`
- `POST /api/v1/team/invitations/:id/resend`
- `DELETE /api/v1/team/invitations/:id`
- `POST /api/v1/invitations/accept`

Listagens não expõem hashes. Ações críticas geram auditoria com papel anterior/novo ou status anterior/novo, sem credenciais.
## Estados globais e reenvio

O aceite nunca reativa um `User` globalmente `SUSPENDED` ou `INACTIVE` e não modifica memberships anteriores. Identidades `ACTIVE` são preservadas; `INVITED` pode transitar explicitamente para `ACTIVE` no aceite válido. Falhas retornam mensagem genérica ao cliente.

O reenvio bloqueia a linha no PostgreSQL, valida o cooldown persistente e troca o hash dentro da mesma transação. Em chamadas concorrentes, somente uma rotação e uma entrega prosseguem; o token anterior deixa de ser válido imediatamente. Sem provedor transacional em produção, a API responde de forma segura que a entrega está indisponível. Testes locais usam uma entrega injetada que não registra o token.