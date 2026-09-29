# Migrations

O banco PostgreSQL de desenvolvimento possui quatro migrations aplicadas:

1. `init_foundation`: estrutura inicial com tabelas, enums, índices, relações e constraints.
2. `add_multi_tenant_rls`: papel runtime restrito, RLS forçada, policies, grants mínimos e invariantes de integridade.
3. `harden_active_ownership_and_runtime_grants`: proprietários e responsáveis ativos, guards concorrentes e restrição de escrita runtime.
4. `harden_soft_delete_and_actor_provenance`: bloqueio de exclusão física, autoria runtime vinculada ao usuário corrente e autoria documental imutável.

Use `prisma:migrate:deploy` somente em ambientes controlados. Nunca use reset ou `prisma db push` neste projeto. Não edite migrations aplicadas; mudanças exigem nova migration e revisão do SQL antes da aplicação.

Consulte [`docs/tecnica/migrations.md`](../../../../../docs/tecnica/migrations.md) para preflight, aplicação, validação e rollback.
