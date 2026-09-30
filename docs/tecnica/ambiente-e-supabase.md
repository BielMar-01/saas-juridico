# Ambiente, Supabase e evolução da API

O ambiente local de desenvolvimento possui doze migrations, incluindo convites e endurecimento dos grants, RLS, papel runtime, grants mínimos, validação JWT e login web com sessão SSR configurados. Storage não foi configurado. Ajustes externos do Dashboard — como políticas de provedores, redirect URLs, MFA e signing keys — e a configuração do ambiente de produção permanecem pendentes de decisão e provisionamento próprios.

## Variáveis

A API usa `NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL`, `WEB_ORIGIN`, `DATABASE_URL` e, para Prisma CLI, `DIRECT_URL`. As variáveis `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_JWKS_URL` atendem ao runtime HTTP. `SUPABASE_SECRET_KEY` pertence somente ao script administrativo de bootstrap, nunca ao runtime HTTP ou frontend. A integração web usa somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; segredos permanecem exclusivos do backend administrativo.

No Supabase, a aplicação deverá preferir o pooler compatível com conexões curtas em `DATABASE_URL`; migrations usam `DIRECT_URL`, que pode ser conexão direta ou Session Pooler compatível em `5432`. Ambas exigem SSL conforme o painel. Nunca registrar URLs completas, pois contêm credenciais.

## Estado do ambiente de desenvolvimento

O projeto PostgreSQL de desenvolvimento e o arquivo local `apps/api/.env` já foram configurados. As conexões administrativa e runtime foram validadas sem expor valores. As doze migrations foram aplicadas pelo Prisma, e o banco permanece sem dados de aplicação ou seed. Não criar tabelas manualmente, resetar o banco ou aplicar migrations em ambiente desconhecido.

Auth, sessão e validação de claims foram integrados e validados com fixture efêmera removida ao final. Buckets e Storage ainda não foram configurados. Policies de banco e testes entre tenants protegem as tabelas de negócio.

## Bind de rede local

`HOST=0.0.0.0` faz a API escutar em todas as interfaces e pode expô-la a outros dispositivos da rede local, conforme firewall e roteador. Para restringir o processo à própria máquina durante o desenvolvimento, use `HOST=127.0.0.1`. Essa escolha não substitui autenticação, autorização ou controles de rede.

## Deploy futuro

A API deve ser publicada como serviço separado da web que já está na Vercel. O projeto, as variáveis e o ciclo de publicação da API não podem alterar o projeto web atual.

A execução local usa `src/server.ts`, abre uma porta e trata `SIGINT` e `SIGTERM`. Na Vercel, `api/[...path].ts` exporta o handler catch-all, preserva a URL original, não chama `listen()`, não executa migrations e reutiliza Fastify e Prisma por instância aquecida. O build valida separadamente o servidor local e a entrada serverless.

Antes da publicação, devem estar definidos e validados:

- `DATABASE_URL` autenticada exclusivamente como o papel runtime `jurisvia_app`, usando o pooler do Supabase apropriado ao runtime, SSL, limite pequeno de conexões por instância e timeouts;
- `DIRECT_URL` com credencial administrativa restrita a um job separado de migrations, sem disponibilizá-la ao processo da API e sem executar migrations durante build, inicialização ou deploy concorrente;
- `NODE_ENV`, `LOG_LEVEL`, `WEB_ORIGIN`, `HOST` e `PORT` de acordo com o serviço, sem compartilhar segredos com a web;
- liveness em `/api/v1/health` e readiness do banco em `/api/v1/health/database`, com frequência que não sobrecarregue o PostgreSQL;
- migrations revisadas e aplicadas por uma etapa única, com backup e rollback operacional definidos;
- integração de Auth e claims com o contexto RLS já implementado, preservando os testes positivos e negativos entre escritórios;
- rate limit com armazenamento compartilhado quando houver mais de uma instância, pois o armazenamento em memória não é global;
- proxy confiável e origem real do cliente validados antes de usar IP em auditoria ou limitação de requisições;
- documentação Swagger desabilitada ou protegida em produção.

No Dashboard do Supabase, a publicação também exige configurar o Site URL e a allowlist exata de redirect URLs da web, decidir confirmação de e-mail e SMTP, revisar a política de senhas, habilitar e testar TOTP para o gate `aal2` e manter signing keys JWT assimétricas compatíveis com o JWKS consumido pela API. CORS deve aceitar somente a origem pública esperada da web. Essas configurações externas não fazem parte deste repositório.

Enquanto a API separada e suas variáveis de backend não forem publicadas, a área autenticada da web não está disponível em produção. As rotas públicas continuam independentes. A web de produção também precisa apenas das variáveis públicas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_API_URL`; nenhuma credencial administrativa pode ser exposta ao bundle do navegador.

A publicação depende de health local aprovado, conexão pelo pooler testada, migration de produção controlada e autorização explícita. Nenhum serviço ou variável deve ser provisionado apenas para validar esta estratégia documental.
