# Frontend do Bloco 4

## Configurações autenticadas

As rotas `/app/configuracoes/perfil`, `/seguranca`, `/notificacoes` e `/organizacao` permanecem sob o layout autenticado. Perfil e preferências usam endpoints de conta sem tenant; organização usa o escritório ativo validado pela API. Alteração de e-mail e senha usa diretamente o Supabase Auth oficial, sem armazenar senha ou token na aplicação.

Avisos essenciais de sistema e segurança são apresentados como obrigatórios e o frontend sempre envia `systemEnabled: true`. Organizações `SUSPENDED` ou `ARCHIVED` exibem estado somente leitura; ações já existentes de clientes e equipe também deixam de ser oferecidas. A API e o banco continuam sendo a autoridade desse bloqueio.

## MFA e sessões

O fluxo TOTP usa `listFactors`, `enroll`, `challengeAndVerify`, `getAuthenticatorAssuranceLevel` e `unenroll` do Supabase. QR e chave manual aparecem somente durante enrollment e são removidos do estado após a verificação. A chave não usa Web Storage, logs ou analytics. Remoção exige sessão em AAL2. Código inválido ou expirado recebe mensagem segura. Perda do autenticador exige recuperação de conta ou suporte autorizado; nenhum código de recuperação foi inventado.

A tela de segurança permite alterar senha conforme a política existente e encerrar outras sessões via `signOut({ scope: "others" })`. A sessão atual continua gerenciada pelos cookies SSR do Supabase.

## Organização e ownership

A organização ativa pode ter seu nome alterado por papéis autorizados. Arquivamento exige OWNER, MFA AAL2, autenticação recente, motivo e confirmação; é terminal e preserva os dados. A transferência usa solicitação, aceite ou cancelamento. O backend valida elegibilidade, MFA recente, token, expiração e atomicidade. O código de transferência retornado pelo contrato atual é exibido uma única vez em memória, nunca persistido ou registrado.

## Administração global

`/admin/*` possui layout próprio e uma verificação real de `GET /api/v1/admin/overview` antes de renderizar o console. A API exige usuário ativo em `platform_administrators`, `SUPER_ADMIN`, AAL2 e autenticação recente. Membership tenant não concede acesso. O frontend pode encaminhar para novo challenge MFA, mas jamais considera essa confirmação como autorização administrativa.

As páginas cobrem visão geral, organizações, detalhes e lifecycle, usuários, detalhes com e-mail mascarado, auditoria, metadados de e-mail e saúde. Apenas projeções operacionais dos endpoints administrativos são renderizadas. Não existem chamadas administrativas para clientes, casos, processos, documentos, arquivos ou impersonação.

## Acessibilidade e responsividade

Formulários possuem labels, loading e mensagens com regiões acessíveis. Ações destrutivas ou sensíveis usam o diálogo compartilhado com foco inicial, trap de foco, Escape quando permitido, restauração do foco e bloqueio do fundo. Tabelas usam wrappers próprios para telas estreitas; configurações e métricas passam para uma coluna em mobile.

## Pendências externas

MFA TOTP, confirmação de e-mail, política de senha, SMTP e redirects precisam estar habilitados e validados no Dashboard do Supabase. O console depende da API publicada e de um SUPER_ADMIN provisionado pelo comando administrativo documentado; nenhuma dessas configurações é criada pelo frontend.
## Validação frontend

A suíte web possui 52 verificações: 16 testes Node para contratos, rotas, autenticação recente, callback de e-mail, segurança e CSS estrutural, mais 36 testes de componentes em 11 arquivos Vitest/JSDOM. A cobertura inclui autenticação recente por `auth_time`, reautenticação por nonce, sincronização de e-mail, perfil, segurança, notificações, lifecycle, ownership, guards administrativos, estados vazios/erro/loading, status global, MFA, foco dos diálogos, temas e ausência de persistência ou logs sensíveis. Os breakpoints estruturais usados na validação são desktop de 1440 px e mobile de 390 px; tabelas permanecem em wrappers com rolagem interna para evitar overflow da página.