# Contrato proposto para contato público

**Status: PROPOSTA NÃO IMPLEMENTADA**

Este documento registra o contrato esperado para um futuro canal público de contato. Não existe endpoint, serviço de e-mail, CRM, fila, banco, destinatário ou rotina de atendimento definidos. A página `/contato` apenas valida campos localmente e não transmite nem persiste dados.

## Escopo esperado

O futuro fluxo deverá receber uma solicitação informativa de uma pessoa vinculada a um escritório. Não será canal para documentos jurídicos, dados de clientes, casos, processos, urgências ou aconselhamento jurídico.

## Schema proposto

| Campo | Tipo | Obrigatório | Limite e regra proposta |
| --- | --- | --- | --- |
| `name` | string | sim | 2 a 120 caracteres após normalização |
| `email` | string | sim | formato de e-mail; até 254 caracteres |
| `office` | string | sim | 2 a 160 caracteres |
| `team_size` | enum | sim | `1`, `2-5`, `6-15`, `16-50`, `50+` |
| `subject` | string ou enum a decidir | sim | 2 a 160 caracteres |
| `message` | string | sim | 20 a 1000 caracteres; sem HTML ativo |
| `privacy_acknowledgement` | boolean | sim | aceite do aviso aplicável no momento do envio |
| `idempotency_key` | string | a decidir | chave opaca com formato e validade ainda não definidos |

Campos técnicos como data, IP truncado, user agent ou identificador de correlação só poderão existir após definição de necessidade, minimização e retenção.

## Validação esperada

A interface poderá orientar o preenchimento, mas o futuro servidor deverá repetir todas as validações, normalizar texto, rejeitar campos desconhecidos e limitar tamanho do corpo. Dados jurídicos sensíveis deverão ser desencorajados na interface e tratados conforme política ainda pendente se forem enviados indevidamente.

## Privacidade e consentimento

Antes da implementação deverão ser definidos aviso de privacidade, papéis de controlador e operador, base legal adequada, finalidade, canal do titular e evidência do aceite quando aplicável. O checkbox da prévia apenas apresenta esse requisito; ele não cria consentimento real.

## Retenção e eliminação

Prazo de retenção, critérios de exclusão, acesso interno e exportação ainda estão pendentes. A implementação não poderá reter mensagens indefinidamente nem reutilizá-las para finalidade incompatível.

## Antiabuso

A solução futura deverá avaliar rate limiting, proteção contra automação, limites por origem, validação de conteúdo e bloqueio seguro. CAPTCHA, fornecedor e limiares não estão escolhidos. Respostas não devem revelar se um endereço ou organização já existe.

## Logs e observabilidade

Logs deverão evitar o corpo integral da mensagem e dados desnecessários. Eventos mínimos, correlação, alertas, acesso aos logs e prazo de retenção ainda serão definidos. Segredos e conteúdo enviado não poderão aparecer em logs comuns.

## Idempotência

A estratégia deverá impedir duplicidade causada por repetição de envio ou retentativa. Formato da chave, janela de deduplicação e resposta repetida permanecem pendentes.

## Respostas propostas, ainda pendentes

A semântica futura deverá distinguir: aceito para processamento, erro de validação, limite de abuso, indisponibilidade temporária e falha interna. Códigos HTTP, schema de erro, mensagens públicas, prazo de resposta humana e canal de acompanhamento ainda não foram aprovados.

## Decisões obrigatórias antes da implementação

1. Finalidade, base legal, aviso e retenção.
2. Endpoint e contrato versionado.
3. Destino operacional e responsáveis pelo atendimento.
4. Proteções antiabuso e monitoramento.
5. Idempotência e respostas públicas.
6. Política para conteúdo sensível enviado indevidamente.
7. Testes de segurança, privacidade e acessibilidade.
