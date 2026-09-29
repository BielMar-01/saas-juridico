# Segurança multi-tenant do banco

## Contexto e papel runtime

A API conecta ao PostgreSQL com `jurisvia_app`, um papel `LOGIN` sem superuser, criação de banco ou papel, replicação, herança ou `BYPASSRLS`. A senha é gerada localmente pelo script administrativo idempotente e existe apenas no `DATABASE_URL` ignorado pelo Git. `DIRECT_URL` permanece administrativa e não pode ser usada pelo servidor da API.

`withTenant` valida UUIDs e abre uma transação Prisma. Dentro dela, define `app.current_organization_id` e `app.current_user_id` com `set_config(..., true)`, usando parâmetros. O terceiro argumento torna o contexto local à transação. Toda consulta de domínio deve ocorrer pelo `TransactionClient` entregue ao callback; consultas globais de tenant são proibidas.

## RLS, policies e grants

RLS está habilitada e forçada em `users`, `organizations`, `organization_memberships`, `clients`, `cases`, `lawsuits`, `tasks`, `documents`, `client_portal_publications` e `audit_logs`. Existem policies explícitas para SELECT, INSERT, UPDATE e DELETE. Sem contexto válido, organização ativa, usuário ativo e membership ativa, o acesso falha fechado.

As funções auxiliares ficam no schema `private`, têm `search_path` fixo e privilégios revogados de `PUBLIC`. A única função `SECURITY DEFINER` usada pelas policies consulta nomes totalmente qualificados e existe para evitar recursão de RLS na validação de membership. `anon` e `authenticated` não possuem grants nas tabelas de negócio; a Data API não é um caminho de acesso nesta etapa.

O runtime pode ler o próprio usuário e dados tenant autorizados. Não pode criar usuários nem inserir, alterar ou excluir organizações ou memberships, e não pode alterar auditoria. Publicações podem ser revogadas, mas seu conteúdo histórico não pode ser reescrito ou excluído pelo runtime.

## Invariantes no banco

Triggers e constraints garantem organização imutável, readiness entre 0 e 100, referências no mesmo tenant, coerência entre documento/caso/cliente, responsável efetivamente ativo e obrigatório em casos ACTIVE, ao menos um OWNER com membership e usuário ativos sob bloqueio concorrente, audit log imutável e preservação de publicação. O primeiro OWNER é criado apenas por um fluxo administrativo futuro. Manutenção de fixtures de auditoria exige simultaneamente o owner da tabela e uma flag local de transação; não é acessível ao runtime.

## Testes e operação

A suíte cria identificadores aleatórios e testa dois tenants, estados de membership, casos ACTIVE sem responsável, responsáveis inativos e cruzados, dependências reversas de membership/usuário, handoff de OWNER, limites de readiness, coerência documental, histórico de publicação, troca e vazamento de contexto após erro, concorrência do último OWNER, DDL proibido, atributos do papel e grants da Data API. A limpeza usa somente os IDs criados pelo teste e confirma banco vazio.

Para auditoria sanitizada, `pnpm --filter @saas-juridico/api admin:audit-database-security` retorna somente booleanos e contagens. Nunca registrar URLs, senhas ou chaves. O rollback operacional deve restaurar backup ou usar migration compensatória; desabilitar RLS em produção não é procedimento de rollback.

Supabase Auth, claims JWT, RBAC, login e Storage permanecem futuros. Antes deles, deve-se mapear a identidade autenticada para `users.auth_user_id`, resolver membership no servidor e só então iniciar a transação tenant.

A credencial runtime é interna ao servidor e nunca deve executar SQL, filtros ou identificadores de tabela fornecidos pelo usuário. Auth e RBAC futuros devem autorizar a operação antes de entrar em withTenant.
