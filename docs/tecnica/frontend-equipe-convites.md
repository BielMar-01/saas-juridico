# Frontend de equipe e aceite de convites

## Área protegida

A rota `/app/equipe` consome exclusivamente a API Fastify com Bearer token e o escritório ativo já validado. A lista recebida é filtrada e paginada no navegador porque o contrato atual de membros retorna a coleção autorizada do tenant. Nenhuma consulta de negócio usa a Data API do Supabase.

A navegação e as ações visuais seguem a mesma matriz da API: `OWNER` administra todos os não proprietários; `ADMIN` administra somente `LAWYER` e `ASSISTANT`; `LAWYER` possui leitura; `ASSISTANT`, `FINANCIAL` e `VIEWER` não recebem acesso visual à equipe. Essa camada não substitui a autorização da API.

Convites permitem somente os papéis autorizados para o ator e nunca apresentam `OWNER` ou `CLIENT`. A interface trata criação, reenvio e cancelamento com estados de carregamento e erros seguros. A integração Resend está implementada, mas a entrega real permanece desativada até configurar externamente chave, webhook, domínio e remetentes verificados.

## Aceite seguro

O link entra por `/convite?token=...`. A Route Handler valida o formato, grava o valor por no máximo dez minutos em cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção e restrito ao caminho `/aceitar-convite`, e redireciona imediatamente para uma URL sem token. As respostas usam `Cache-Control: no-store` e `Referrer-Policy: no-referrer`.

A página `/aceitar-convite` exige sessão Supabase e preserva apenas um destino interno validado. O POST ao BFF lê o cookie no servidor, obtém a sessão SSR e chama `POST /api/v1/invitations/accept` sem `X-Organization-Id`. O token não fica disponível ao JavaScript, não é salvo em Web Storage, não aparece no corpo enviado pelo navegador e o cookie é apagado depois da tentativa. Estados inválidos agrupam convite expirado, cancelado ou já utilizado para evitar enumeração.

## Acessibilidade e responsividade

Tabelas possuem cabeçalhos e legenda acessível, wrappers com rolagem interna e layouts adaptados para telas menores. Diálogos reutilizam foco inicial, contenção de Tab e Shift+Tab, Escape quando permitido, restauração do foco, bloqueio de rolagem e isolamento do fundo. Ações em andamento desabilitam fechamento acidental e anunciam progresso.

## Limitações

A API continua sendo a autoridade para AAL2, membership, papel e tenant. A API é publicada separadamente; o frontend não fornece entrega de e-mail. Antes de ativar e-mail transacional, é necessário conectar e validar o provedor e garantir que a plataforma de hospedagem não registre query strings dos links de entrada.
