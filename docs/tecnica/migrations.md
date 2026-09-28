# Migrations do banco

## init_foundation

Estado: aplicada no banco de desenvolvimento em 28/09/2026.

A migration cria dez tabelas de aplicação, treze enums, relações multi-tenant compostas, índices e constraints de unicidade. Todas as vinte chaves estrangeiras usam `ON DELETE RESTRICT`; não há cascatas destrutivas. O banco permaneceu sem dados de aplicação e nenhum seed foi executado.

O schema Prisma e o banco foram comparados após a aplicação, sem drift. O histórico do Prisma registra uma migration concluída.

A migration não implementa Auth, Storage, RLS, policies, usuários, login ou CRUD. Antes de dados reais, uma migration revisada deve tratar limites do readiness score, proprietário ativo mínimo, responsável ativo mínimo, coerência entre cliente do documento e do caso, imutabilidade forte de auditoria e versionamento de publicações.
