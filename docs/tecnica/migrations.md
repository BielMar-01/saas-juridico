# Migrations do banco

## Estado

O banco PostgreSQL de desenvolvimento possui quatro migrations aplicadas, sem seed ou dados de aplicação:

1. `init_foundation`: dez tabelas, treze enums, relações multi-tenant compostas, índices e chaves estrangeiras com `ON DELETE RESTRICT`.
2. `add_multi_tenant_rls`: papel runtime restrito, RLS forçada, policies explícitas, grants mínimos e invariantes críticos de integridade.
3. `harden_active_ownership_and_runtime_grants`: responsável obrigatório para casos ativos, guards concorrentes sobre membership/usuário, proprietário efetivamente ativo, ACL de funções privadas e revogação de escrita runtime em organizações e memberships.
4. `harden_soft_delete_and_actor_provenance`: revoga exclusão física nas entidades com soft delete, vincula autoria runtime ao usuário corrente e torna a autoria documental imutável.

O schema Prisma permanece responsável pela estrutura modelada. SQL nativo versionado implementa RLS, triggers, funções privadas, CHECKs e grants que o Prisma não representa. Não editar migrations aplicadas; toda evolução deve entrar em uma nova migration revisável.

## Operação segura

- migrations usam exclusivamente `DIRECT_URL` em um processo administrativo controlado;
- a aplicação usa `DATABASE_URL` com o papel `jurisvia_app` e nunca executa migrations;
- nunca usar `prisma db push`, reset ou seed contra ambiente compartilhado;
- antes de aplicar, revisar SQL, procurar operações destrutivas e executar preflight transacional quando compatível;
- depois de aplicar, validar `_prisma_migrations`, catálogo RLS/policies/grants, drift estrutural e testes de isolamento;
- rollback de DDL exige migration compensatória revisada e backup; não apagar registros do histórico.

A migration RLS não configura Supabase Auth, Storage, login, RBAC ou CRUD. O onboarding inicial de organização e primeiro proprietário continua reservado a um fluxo administrativo futuro e auditado.

## Preflight automatizado

`pnpm --filter @saas-juridico/api admin:preflight-migration` verifica padrões destrutivos e segredos, checksum do SQL aplicado, estado do catálogo, RLS, policies, grants e drift estrutural, sem imprimir conexões ou credenciais. Quando a migration ainda não existe no histórico, o script executa o SQL dentro de uma transação e faz rollback. Quando já está aplicada, ele não tenta reaplicar DDL: valida checksum, histórico e efeitos no catálogo.

A migration depende de objetos no schema `public` e de um papel global. Reproduzi-la em um schema alternativo não representa fielmente os nomes qualificados nem os grants. Um banco descartável completo é a opção válida para ensaio isolado; ele não foi provisionado nesta etapa para evitar criar ou resetar infraestrutura. O preflight transacional anterior à aplicação e os testes reais no banco vazio permanecem registrados.

## Operações administrativas protegidas

A criação da primeira organização e do primeiro OWNER, assim como handoff de proprietário, não usa a credencial runtime. O fluxo futuro deverá usar conexão administrativa separada, transação única e auditoria. Para handoff, criar ou promover o novo OWNER ativo antes de remover, suspender ou desativar o anterior. Os advisory locks da migration serializam alterações concorrentes. Os triggers continuam ativos para a conexão administrativa; não devem ser desabilitados.

Rollback das compensações exige nova migration que restaure grants, policies e funções anteriores após avaliação de impacto. Não editar nem remover migrations aplicadas. Reabrir `DELETE` físico ou permitir autoria informada pelo cliente exige revisão de segurança e uma migration compensatória; nunca alterar `harden_soft_delete_and_actor_provenance` no lugar.
