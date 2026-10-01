# ADR-0004: administração global sem bypass tenant

- Status: aceito
- Data: 2026-09-30

## Decisão

SUPER_ADMIN é representado por `platform_administrators`, separado de `organization_memberships`. A API resolve essa identidade por função específica, exige JWT, usuário ativo, AAL2 e autenticação recente. Cada endpoint usa projeções SQL explícitas de dados operacionais. Não há impersonação nem acesso global a clientes, casos, documentos, processos ou arquivos.

Lifecycle de organizações usa `ACTIVE`, `SUSPENDED` e `ARCHIVED`. RLS e guards da API impedem mutações comuns fora de `ACTIVE`; `ARCHIVED` é terminal. Suspensão e reativação são ações globais auditadas. Ownership continua tenant e usa fluxo transacional em duas etapas.

E-mails são abstraídos por provider. Metadados globais têm RLS forçada; webhooks entram somente após verificação oficial da assinatura e persistem IDs, estados e hashes, nunca corpo ou destinatário completo.

## Consequências

O runtime executa apenas funções globais nomeadas e não recebe service role. Bootstrap de SUPER_ADMIN é comando administrativo local, idempotente e exige confirmação nominal em produção. Configuração SMTP, DNS e MFA inicial continuam operações manuais verificáveis.
