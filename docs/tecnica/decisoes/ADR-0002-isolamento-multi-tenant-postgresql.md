# ADR-0002 — Isolamento multi-tenant no PostgreSQL

Status: aceita em 28/09/2026.

## Decisão

Usar defesa em profundidade: relações compostas por `organization_id`, papel runtime sem privilégios administrativos, contexto tenant local à transação e RLS forçada com policies explícitas. Invariantes que atravessam linhas ficam em constraints e triggers versionados. A conexão administrativa é exclusiva de migrations e manutenção controlada.

## Consequências

A API deve executar operações de domínio apenas dentro de `withTenant`. Ausência ou inconsistência de contexto resulta em zero linhas ou rejeição. Testes reais do PostgreSQL são obrigatórios porque mocks não comprovam RLS, grants, triggers ou concorrência. O onboarding inicial e a integração com Auth usam fluxos privilegiados separados, mínimos e auditados. O custo é maior disciplina transacional e migrations SQL revisadas.

## Alternativas rejeitadas

Filtragem apenas no código não protege contra consultas esquecidas. Usar o papel administrativo no runtime neutraliza RLS. Conceder tabelas a `anon` ou `authenticated` expõe a Data API antes da definição de Auth e claims.

## Hardening posterior

A migration `harden_active_ownership_and_runtime_grants` tornou a efetividade do responsável e do OWNER dependente simultaneamente de membership e usuário ativos. Guards com advisory locks impedem que mudanças concorrentes em casos, memberships ou usuários quebrem essas garantias. Auth/JWT, CRUD de clientes e gestão de membros e convites foram implementados posteriormente. A role runtime continua sem escrita ampla nas memberships: alterações comuns passam por funções privadas com tenant, ator e matriz de papéis validados. O bootstrap administrativo, o handoff de OWNER e o lifecycle organizacional estão implementados com transações e auditoria. ACL por caso/equipe e portal do cliente permanecem futuros.

Todas as funções no schema `private`, inclusive funções de trigger, revogam execução de `PUBLIC`. O runtime recebe apenas os três helpers necessários à avaliação das policies. A credencial runtime é confiada somente ao código do servidor e não constitui uma interface SQL para usuários.
