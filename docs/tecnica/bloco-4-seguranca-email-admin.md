# Bloco 4 — segurança organizacional, e-mail e administração global

O backend implementa lifecycle `ACTIVE`, `SUSPENDED` e `ARCHIVED`. Organizações não ativas permanecem legíveis para os fluxos autorizados, mas mutações comuns são recusadas na API e no banco. Arquivamento não remove dados.

A transferência de ownership usa solicitação com token aleatório armazenado somente como HMAC, expiração, aceite pelo destinatário em AAL2, lock transacional e mudança atômica do OWNER anterior para ADMIN. Solicitações podem ser canceladas e não podem ser reutilizadas.

`platform_administrators` mantém o papel global fora de `OrganizationMembership`. Rotas `/api/v1/admin/*` exigem JWT, usuário ativo, registro administrativo ativo e AAL2. As funções SQL retornam apenas projeções operacionais; não há acesso administrativo a documentos, casos, clientes ou conteúdo jurídico.

O comando `pnpm --filter @saas-juridico/api super-admin:bootstrap` consulta exatamente o e-mail em `SUPER_ADMIN_EMAIL` pela Admin API e exige identidade Auth ativa e confirmada. `SUPER_ADMIN_BOOTSTRAP_MODE=verify` valida sem banco ou escrita. O modo `apply` exige `DIRECT_URL` e, em produção, `CONFIRM_PRODUCTION=YES`; cria de forma atômica e idempotente `users` ACTIVE, `platform_administrators` ACTIVE e uma auditoria, sem senha, organização ou membership. O e-mail é normalizado para minúsculas e segue política ASCII com domínio qualificado; espaços internos, domínio sem ponto e endereços Unicode são rejeitados. Conflitos de e-mail/Auth provocam rollback. O comando não imprime credenciais. MFA precisa ser ativado pelo usuário antes do uso das rotas globais.

A aplicação depende de uma interface de e-mail independente do provedor. Quando todas as variáveis Resend e remetentes estão presentes, convites usam a API do Resend e registram somente ID do provedor, categoria, template, destinatário mascarado e status. Sem configuração completa, produção falha fechada e desenvolvimento usa entrega nula sem registrar tokens. O webhook usa raw body e a verificação oficial do SDK Resend.

Variáveis opcionais do runtime: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `EMAIL_FROM_ACCESS`, `EMAIL_FROM_INVITATIONS`, `EMAIL_FROM_NOTIFICATIONS`, `EMAIL_REPLY_TO` e `APP_PUBLIC_URL`. `SUPER_ADMIN_EMAIL` é apenas administrativo. Nenhuma delas deve usar prefixo `NEXT_PUBLIC_`.

A configuração SMTP do Supabase Auth é manual no Dashboard. Use o host, porta, usuário e senha fornecidos pelo Resend, um remetente de acesso verificado, Site URL de produção e redirects locais/produção estritamente permitidos. Confirmação, recuperação e alteração de e-mail permanecem sob templates do Supabase. Configure SPF, DKIM e DMARC no DNS do domínio real; nenhum domínio foi inventado pelo código.

Retenção recomendada: auditoria de plataforma imutável conforme política legal; metadados de entrega pelo prazo operacional definido pela organização; nunca armazenar corpo, token ou segredo em logs. Recuperação de SUPER_ADMIN usa o fluxo oficial de senha do Supabase e requer novo AAL2, sem impersonação.

## Estado de validação

A API possui 127 testes aprovados em 26 arquivos; a web possui 56 verificações, sendo 16 testes Node e 40 testes Vitest. O catálogo validado contém 29 migrations, 19 tabelas com RLS e 44 policies, sem dados ou fixtures. A API serverless está publicada separadamente da web. O código de Resend, webhook e bootstrap de SUPER_ADMIN está implementado, mas a ativação real continua bloqueada até configurar externamente domínio/remetentes, segredo do webhook, SMTP/DNS e um usuário interno elegível com MFA.

### Evidência de autenticação recente

A API nunca usa `iat` nem a emissão decorrente de refresh como prova de reautenticação. Operações críticas exigem `aal2` e um timestamp não futuro dentro da janela configurada. A evidência preferencial é o claim padrão `auth_time`; quando ele não existe, a API aceita apenas o maior timestamp de um item interativo do array `amr` (`password`, `otp`, `totp`, `mfa`, `webauthn` ou `recovery`). `token_refresh` e métodos desconhecidos são ignorados. Sem evidência compatível, a API responde `403` e a web deve iniciar reautenticação/MFA antes de repetir a operação. O endpoint `/api/v1/auth/me` expõe `authenticatedAt` para apoio à interface, sem substituir a validação servidor. A configuração do Supabase e a versão da biblioteca de sessão devem preservar `auth_time` ou `amr`; isso deve ser revalidado ao trocar signing keys, fluxo de MFA ou versão do SDK.
