# Migrations

O banco PostgreSQL de desenvolvimento possui 29 migrations aplicadas, sem seed ou dados de aplicação:

1. `20260928150120_init_foundation` — estrutura inicial, enums, índices, relações e constraints.
2. `20260928170000_add_multi_tenant_rls` — role runtime, RLS forçada, policies e invariantes.
3. `20260928210000_harden_active_ownership_and_runtime_grants` — proprietário/responsável ativo e grants mínimos.
4. `20260928223000_harden_soft_delete_and_actor_provenance` — soft delete, autoria e auditoria.
5. `20260929090000_add_auth_context_and_client_identity` — contexto Auth e identidade de clientes.
6. `20260929170000_add_team_invitations` — tabela e enum de convites.
7. `20260929194316_add_team_invitations` — migration vazia preservada para manter histórico e checksum.
8. `20260929210000_harden_team_invitations` — lifecycle, índice parcial, RLS e aceite transacional.
9. `20260929223000_add_team_member_mutation_functions` — funções protegidas de papel e status.
10. `20260929234500_revoke_invitation_data_api_grants` — revogação dos grants da Data API.
11. `20260930003000_harden_team_identity_and_resend` — identidade global bloqueada e reenvio atômico.
12. `20260930010000_harden_admin_role_targets` — ADMIN limitado a LAWYER e ASSISTANT.
13. `20260930120000_add_organization_security_email_admin` — lifecycle, ownership, preferências, e-mail e administração global.
14. `20260930213000_align_block4_prisma_schema` — alinhamento do catálogo com o schema Prisma.
15. `20260930223000_add_email_webhook_suppression` — eventos idempotentes e supressão por hash.
16. `20260930224500_harden_ownership_lifecycle` — ownership restrito a organização ativa.
17. `20260930225500_protect_last_platform_admin` — proteção concorrente do último administrador global.
18. `20260930231000_add_admin_detail_projections` — projeções operacionais mínimas para administração.
19. `20261001083000_add_ownership_target_check` — elegibilidade do destinatário da transferência.
20. `20261001084500_fix_ownership_transfer_ambiguity` — correção de ambiguidade no aceite.
21. `20261001085500_fix_atomic_owner_handoff_order` — handoff atômico com ordem segura.
22. `20261001091000_allow_read_only_tenant_lifecycle` — leitura tenant preservada em suspensão e arquivamento.
23. `20261001093000_add_atomic_tenant_archive` — arquivamento tenant atômico e auditado.
24. `20261001094000_fix_atomic_tenant_archive_audit_id` — UUID explícito da auditoria de arquivamento.
25. `20261001160000_harden_admin_preferences_email_outbox` — concorrência administrativa, preferências obrigatórias, outbox e sincronização auditada de e-mail.
26. `20261001163000_protect_account_identity_audit` — RLS forçada na auditoria de identidade.
27. `20261001164500_fix_outbox_ids_and_admin_cleanup` — UUID da outbox e limpeza de testes restrita ao proprietário.
28. `20261001170000_align_account_identity_audit` — alinhamento de default, FK e índice da auditoria de identidade.
29. `20261001171500_bind_email_sync_to_current_user` — vínculo da sincronização de e-mail ao contexto transacional autenticado.
Use `prisma:migrate:deploy` somente em ambientes controlados. Nunca use reset ou `prisma db push`. Não edite migrations aplicadas; mudanças exigem nova migration e revisão do SQL.

Consulte [`docs/tecnica/migrations.md`](../../../../../docs/tecnica/migrations.md) para preflight, aplicação, validação e rollback.
