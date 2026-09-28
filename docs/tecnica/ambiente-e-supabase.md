# Ambiente, Supabase e evolução da API

O banco PostgreSQL de desenvolvimento foi conectado e recebeu apenas a migration `init_foundation`. Auth, Storage e RLS continuam não configurados.

## Variáveis

A API usa `NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL`, `WEB_ORIGIN`, `DATABASE_URL` e, para Prisma CLI, `DIRECT_URL`. As variáveis `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `SUPABASE_JWKS_URL` estão reservadas. `SUPABASE_SECRET_KEY` é exclusiva da API e nunca pode chegar ao frontend. Uma futura integração web poderá usar somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; nenhum cliente Supabase foi configurado nesta etapa.

No Supabase, a aplicação deverá preferir o pooler compatível com conexões curtas em `DATABASE_URL`; migrations usam `DIRECT_URL`, que pode ser conexão direta ou Session Pooler compatível em `5432`. Ambas exigem SSL conforme o painel. Nunca registrar URLs completas, pois contêm credenciais.

## Estado do ambiente de desenvolvimento

O projeto PostgreSQL de desenvolvimento e o arquivo local `apps/api/.env` já foram configurados. As conexões de runtime e migration foram validadas sem expor valores, e `init_foundation` foi aplicada pelo Prisma. O banco permanece sem dados de aplicação e sem seed. Não criar tabelas manualmente, resetar o banco ou aplicar migrations em ambiente desconhecido.

Auth, usuários, buckets e policies não foram criados. A próxima fase deve projetar claims/sessão, RLS alinhada ao `organization_id`, Storage privado com URLs temporárias e testes positivos e negativos entre tenants.

## Bind de rede local

`HOST=0.0.0.0` faz a API escutar em todas as interfaces e pode expô-la a outros dispositivos da rede local, conforme firewall e roteador. Para restringir o processo à própria máquina durante o desenvolvimento, use `HOST=127.0.0.1`. Essa escolha não substitui autenticação, autorização ou controles de rede.

## Deploy futuro

A API deve ser publicada como serviço separado da web que já está na Vercel. O projeto, as variáveis e o ciclo de publicação da API não podem alterar o projeto web atual.

A implementação corrente abre uma porta com Fastify, mantém um processo Node.js e trata `SIGINT` e `SIGTERM`. Portanto, a opção recomendada para a primeira publicação é um runtime persistente compatível com Node.js 24, com diretório de trabalho `apps/api`, build TypeScript e comando de inicialização `pnpm start:api`. Railway, Render e Fly.io são alternativas a avaliar por região, custo e operação antes do provisionamento. A Vercel somente deve ser considerada depois de uma prova de conceito com um entrypoint serverless que exporte um handler, não chame `listen()` e reutilize Fastify e Prisma por instância.

Antes da publicação, devem estar definidos e validados:

- `DATABASE_URL` com o pooler do Supabase apropriado ao runtime, SSL, limite pequeno de conexões por instância e timeouts;
- `DIRECT_URL` restrita ao processo separado de migrations, sem executar migrations durante build, inicialização ou deploy concorrente;
- `NODE_ENV`, `LOG_LEVEL`, `WEB_ORIGIN`, `HOST` e `PORT` de acordo com o serviço, sem compartilhar segredos com a web;
- liveness em `/api/v1/health` e readiness do banco em `/api/v1/health/database`, com frequência que não sobrecarregue o PostgreSQL;
- migrations revisadas e aplicadas por uma etapa única, com backup e rollback operacional definidos;
- RLS, claims, autorização por `organization_id` e testes positivos e negativos entre escritórios antes de receber dados reais;
- rate limit com armazenamento compartilhado quando houver mais de uma instância, pois o armazenamento em memória não é global;
- proxy confiável e origem real do cliente validados antes de usar IP em auditoria ou limitação de requisições;
- documentação Swagger desabilitada ou protegida em produção.

A publicação depende de health local aprovado, conexão pelo pooler testada, migration de produção controlada e autorização explícita. Nenhum serviço ou variável deve ser provisionado apenas para validar esta estratégia documental.
