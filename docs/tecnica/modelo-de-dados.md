# Modelo inicial de dados

Estado: schema Prisma validado e quatro migrations de fundação e hardening aplicadas no banco de desenvolvimento, sem dados de aplicação ou seed.

## Estratégia

`Organization` é o limite de tenant. Toda entidade de domínio possui `organizationId`, inclusive vínculos que também poderiam inferi-lo. Consultas de domínio recebem o tenant validado pela API dentro de transação; filtros do navegador não constituem isolamento. RLS forçada já protege o banco e possui testes positivos e negativos de não vazamento.

```mermaid
erDiagram
  USER ||--o{ ORGANIZATION_MEMBERSHIP : participates
  ORGANIZATION ||--o{ ORGANIZATION_MEMBERSHIP : has
  ORGANIZATION ||--o{ CLIENT : owns
  CLIENT ||--o{ CASE : has
  ORGANIZATION ||--o{ CASE : owns
  CASE ||--o{ LAWSUIT : contains
  CASE ||--o{ TASK : groups
  CASE ||--o{ DOCUMENT : groups
  CASE ||--o{ CLIENT_PORTAL_PUBLICATION : publishes
  ORGANIZATION_MEMBERSHIP ||--o{ CASE : responsible
  ORGANIZATION_MEMBERSHIP ||--o{ TASK : assigned
  ORGANIZATION_MEMBERSHIP ||--o{ DOCUMENT : uploads
  ORGANIZATION_MEMBERSHIP ||--o{ CLIENT_PORTAL_PUBLICATION : publishes
  ORGANIZATION_MEMBERSHIP ||--o{ AUDIT_LOG : acts
  ORGANIZATION ||--o{ AUDIT_LOG : records
```

## Entidades e decisões

São dez entidades: User, Organization, OrganizationMembership, Client, Case, Lawsuit, Task, Document, ClientPortalPublication e AuditLog. IDs são UUID; datas de evento usam `timestamptz`. Client, Case, Lawsuit, Task e Document têm exclusão lógica. AuditLog não possui atualização ou exclusão no modelo e deve ser imutável na aplicação.

Relações essenciais usam `Restrict` e nenhuma cascata destrutiva foi definida. As referências Client→Case, Case→Lawsuit/Task/Document/Publication usam chaves estrangeiras compostas `[organizationId, id]`, impedindo associação entre tenants. Atores de caso, tarefa, documento, publicação e auditoria referenciam `OrganizationMembership[organizationId, userId]`, portanto precisam pertencer ao mesmo escritório. Arquivos não ficam no PostgreSQL: Document guarda metadados e um caminho de Storage, único por organização, sem URL pública permanente.

Unicidades: slug da organização, identidade Auth e e-mail do usuário, membership por organização/usuário, número processual por organização e caminho de Storage por organização. Índices começam por `organizationId` nas consultas de tenant e cobrem status, responsáveis, cliente/caso, vencimento, exclusão lógica e ordem de auditoria.

Os enums são deliberadamente conservadores. Estados documentais cobrem o fluxo da RN 014 e `QUARANTINED` prepara a RN 017. Papéis apenas preparam o modelo; não implementam autorização. A migration `add_multi_tenant_rls` complementa as relações Prisma com triggers e constraints para coerência documento/caso/cliente, proprietário ativo mínimo, atores ativos, limites de `readinessScore`, histórico de publicação e imutabilidade de `AuditLog`. O modelo de papéis ainda não implementa RBAC na API.

## Dados sensíveis e riscos

Documento pessoal, contato, conteúdo jurídico, metadados de arquivo, IP e user agent são sensíveis. Não existem seeds. Antes de dados reais: definir retenção, criptografia aplicável, Auth, autorização por caso, Storage privado e varredura de uploads. Policies RLS e testes entre tenants já estão ativos.
