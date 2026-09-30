# Migrations do banco

## Estado

O banco PostgreSQL de desenvolvimento possui doze migrations aplicadas, sem seed ou dados de aplicação:

1. `init_foundation`: estrutura inicial multi-tenant.
2. `add_multi_tenant_rls`: papel runtime, RLS forçada, policies e grants mínimos.
3. `harden_active_ownership_and_runtime_grants`: invariantes de proprietário e memberships.
4. `harden_soft_delete_and_actor_provenance`: soft delete e autoria confiável.
5. `add_auth_context_and_client_identity`: contexto Auth e identidade de clientes.
6. `add_team_invitations` (`20260929170000`): tabela e enum de convites.
7. `add_team_invitations` (`20260929194316`): migration vazia aplicada durante a preparação; mantida imutável para preservar checksum e histórico.
8. `harden_team_invitations`: lifecycle, índice parcial, RLS, policies e aceite transacional.
9. `add_team_member_mutation_functions`: funções protegidas de papel e status.
10. `revoke_invitation_data_api_grants`: revoga acesso de `anon`, `authenticated` e `PUBLIC` aos convites.
11. `harden_team_identity_and_resend`: restringe alvos ADMIN, impede reativação global no aceite e serializa reenvios.
12. `harden_admin_role_targets`: exige que o papel atual e o novo papel administrados por ADMIN sejam LAWYER ou ASSISTANT.
O schema Prisma permanece responsável pela estrutura modelada. SQL nativo versionado implementa RLS, triggers, funções privadas, CHECKs e grants que o Prisma não representa. Não editar migrations aplicadas; toda evolução deve entrar em uma nova migration revisável.

## Operação segura

- migrations usam exclusivamente `DIRECT_URL` em um processo administrativo controlado;
- a aplicação usa `DATABASE_URL` com o papel `jurisvia_app` e nunca executa migrations;
- nunca usar `prisma db push`, reset ou seed contra ambiente compartilhado;
- antes de aplicar, revisar SQL, procurar operações destrutivas e executar preflight transacional quando compatível;
- depois de aplicar, validar `_prisma_migrations`, catálogo RLS/policies/grants, drift estrutural e testes de isolamento;
- rollback de DDL exige migration compensatória revisada e backup; não apagar registros do histórico.

A migration `add_multi_tenant_rls`, isoladamente, não configura Auth, Storage, login, RBAC ou CRUD. O estado atual já integra Auth/JWT, login web, uma matriz RBAC inicial, bootstrap administrativo e CRUD de clientes; Gestão comum de membros e convites foi adicionada por migrations posteriores. Storage, handoff de OWNER, lifecycle organizacional completo, ACL por caso/equipe e portal do cliente permanecem fora desta etapa.

## Preflight automatizado

`pnpm --filter @saas-juridico/api admin:preflight-migration` verifica padrões destrutivos e segredos, checksum do SQL aplicado, estado do catálogo, RLS, policies, grants e drift estrutural, sem imprimir conexões ou credenciais. Quando a migration ainda não existe no histórico, o script executa o SQL dentro de uma transação e faz rollback. Quando já está aplicada, ele não tenta reaplicar DDL: valida checksum, histórico e efeitos no catálogo.

A migration depende de objetos no schema `public` e de um papel global. Reproduzi-la em um schema alternativo não representa fielmente os nomes qualificados nem os grants. Um banco descartável completo é a opção válida para ensaio isolado; ele não foi provisionado nesta etapa para evitar criar ou resetar infraestrutura. O preflight transacional anterior à aplicação e os testes reais no banco vazio permanecem registrados.

## Operações administrativas protegidas

A criação da primeira organização e do primeiro OWNER, assim como handoff de proprietário, não usa a credencial runtime. O fluxo implementado usa conexão administrativa separada, transação única e auditoria. Para handoff, criar ou promover o novo OWNER ativo antes de remover, suspender ou desativar o anterior. Os advisory locks da migration serializam alterações concorrentes. Os triggers continuam ativos para a conexão administrativa; não devem ser desabilitados.

Rollback das compensações exige nova migration que restaure grants, policies e funções anteriores após avaliação de impacto. Não editar nem remover migrations aplicadas. Reabrir `DELETE` físico ou permitir autoria informada pelo cliente exige revisão de segurança e uma migration compensatória; nunca alterar `harden_soft_delete_and_actor_provenance` no lugar.
