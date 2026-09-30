# Segurança multi-tenant do banco

## Contexto e papel runtime

A API conecta ao PostgreSQL com `jurisvia_app`, um papel `LOGIN` sem superuser, criação de banco ou papel, replicação, herança ou `BYPASSRLS`. A senha é gerada localmente pelo script administrativo idempotente e existe apenas no `DATABASE_URL` ignorado pelo Git. `DIRECT_URL` permanece administrativa e não pode ser usada pelo servidor da API.

`withTenant` valida UUIDs e abre uma transação Prisma. Dentro dela, define `app.current_organization_id` e `app.current_user_id` com `set_config(..., true)`, usando parâmetros. O terceiro argumento torna o contexto local à transação. Toda consulta de domínio deve ocorrer pelo `TransactionClient` entregue ao callback; consultas globais de tenant são proibidas.

## RLS, policies e grants

RLS está habilitada e forçada em `users`, `organizations`, `organization_memberships`, `invitations`, `clients`, `cases`, `lawsuits`, `tasks`, `documents`, `client_portal_publications` e `audit_logs`. As 11 tabelas possuem exatamente quatro policies explícitas (44 no total) para SELECT, INSERT, UPDATE e DELETE. Sem contexto válido, organização ativa, usuário ativo e membership ativa, o acesso falha fechado.

As funções auxiliares ficam no schema `private`, têm `search_path` fixo e privilégios revogados de `PUBLIC`. As funções `SECURITY DEFINER` no schema `private` usam nomes qualificados e escopo mínimo: avaliação das policies, resolução Auth, aceite/rotação de convites e mutações autorizadas de membership. `anon` e `authenticated` não possuem grants nas tabelas de negócio; a Data API não é um caminho de acesso nesta etapa.

O runtime pode ler o próprio usuário e dados tenant autorizados. Não possui escrita direta irrestrita em usuários, organizações ou memberships e não pode alterar auditoria. Mutações comuns de papel e status passam somente pelas funções privadas que validam ator, tenant e matriz OWNER/ADMIN; bootstrap e handoff não usam a credencial runtime. Publicações podem ser revogadas, mas seu conteúdo histórico não pode ser reescrito ou excluído pelo runtime.

## Invariantes no banco

Triggers e constraints garantem organização imutável, readiness entre 0 e 100, referências no mesmo tenant, coerência entre documento/caso/cliente, responsável efetivamente ativo e obrigatório em casos ACTIVE, ao menos um OWNER com membership e usuário ativos sob bloqueio concorrente, audit log imutável e preservação de publicação. O primeiro OWNER é criado somente pelo script administrativo de bootstrap, após validar a identidade no Supabase Auth, em transação única e com auditoria. Manutenção de fixtures de auditoria exige simultaneamente o owner da tabela e uma flag local de transação; não é acessível ao runtime.

## Testes e operação

A suíte cria identificadores aleatórios e testa dois tenants, convites concorrentes, estados globais do usuário, estados de membership, casos ACTIVE sem responsável, responsáveis inativos e cruzados, dependências reversas de membership/usuário, handoff de OWNER, limites de readiness, coerência documental, histórico de publicação, troca e vazamento de contexto após erro, concorrência do último OWNER, DDL proibido, atributos do papel e grants da Data API. A limpeza usa somente os IDs criados pelo teste e confirma banco vazio.

Para auditoria sanitizada, `pnpm --filter @saas-juridico/api admin:audit-database-security` retorna somente booleanos e contagens. Nunca registrar URLs, senhas ou chaves. O rollback operacional deve restaurar backup ou usar migration compensatória; desabilitar RLS em produção não é procedimento de rollback.

Supabase Auth, login web e validação de claims JWT estão implementados. A API mapeia `sub` para `users.auth_user_id`, resolve memberships ativas no servidor e só então inicia a transação tenant. A matriz RBAC protege o CRUD de clientes e a gestão de membros e convites; `OWNER` e `ADMIN` exigem `aal2` em toda operação tenant. `GET /api/v1/auth/me` e `GET /api/v1/auth/organizations` permanecem acessíveis em `aal1` exclusivamente para descoberta de estado, seleção de escritório e enrollment/challenge de MFA.

A credencial runtime é interna ao servidor e nunca deve executar SQL, filtros ou identificadores de tabela fornecidos pelo usuário. A autorização Auth/RBAC deve ocorrer antes de entrar em `withTenant`. A gestão comum de membros e convites está coberta. A matriz ainda não cobre handoff de OWNER, lifecycle organizacional completo, ACL por caso/equipe ou portal do cliente; Storage privado, demais módulos e deploy da API continuam futuros.
