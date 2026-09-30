# Migrations

O banco PostgreSQL de desenvolvimento possui doze migrations aplicadas:

1. `20260928150120_init_foundation` — estrutura inicial, enums, índices, relações e constraints.
2. `20260928170000_add_multi_tenant_rls` — role runtime, RLS forçada, policies e invariantes.
3. `20260928210000_harden_active_ownership_and_runtime_grants` — proprietário/responsável ativo e grants mínimos.
4. `20260928223000_harden_soft_delete_and_actor_provenance` — soft delete, autoria e auditoria.
5. `20260929090000_add_auth_context_and_client_identity` — contexto Auth e identidade de clientes.
6. `20260929170000_add_team_invitations` — tabela e enum de convites.
7. `20260929194316_add_team_invitations` — migration vazia já aplicada; preservada para manter histórico e checksum.
8. `20260929210000_harden_team_invitations` — ciclo de vida, índice parcial, RLS e aceite transacional.
9. `20260929223000_add_team_member_mutation_functions` — funções protegidas de papel e status.
10. `20260929234500_revoke_invitation_data_api_grants` — revogação de grants de `anon`, `authenticated` e `PUBLIC`.
11. `20260930003000_harden_team_identity_and_resend` — identidade global bloqueada e reenvio atômico.
12. `20260930010000_harden_admin_role_targets` — ADMIN limitado a alvos `LAWYER` e `ASSISTANT`.

Use `prisma:migrate:deploy` somente em ambientes controlados. Nunca use reset ou `prisma db push` neste projeto. Não edite migrations aplicadas; mudanças exigem nova migration e revisão do SQL antes da aplicação.

Consulte [`docs/tecnica/migrations.md`](../../../../../docs/tecnica/migrations.md) para preflight, aplicação, validação e rollback.