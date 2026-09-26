# Fluxo de trabalho dos agentes

## Ordem principal

| Ordem | Agente | Entra quando | Entrega |
| --- | --- | --- | --- |
| 1 | `planejador` | Início de cada bloco | Escopo, dependências e critérios de aceite |
| 2 | `designer_publico` | Antes de criar página pública | Layout, conteúdo, estados e responsividade |
| 3 | `frontend` | Após o desenho do bloco | Código funcional e verificações disponíveis |
| 4 | `backend` | Quando houver API, persistência ou autenticação | Contrato e implementação do domínio |
| 5 | `qa` | Após implementação | Evidências, cenários e defeitos |
| 6 | `revisor` | Após QA e antes do commit | Riscos, regressões e parecer de revisão |
| 7 | `deploy` | Antes da primeira publicação ou diante de falha | Build e publicação verificados |

## Primeiro ciclo público

`planejador -> designer_publico -> frontend -> qa -> revisor -> commit -> deploy`

O backend não participa de uma página pública puramente estática. Ele entra se houver formulário persistido, integração, autenticação ou regra de domínio.

## Ciclo após o primeiro deploy

`planejador -> designer_publico -> frontend -> qa -> revisor -> commit e push`

A publicação automática pela Vercel será usada apenas depois de GitHub e Vercel serem configurados e validados.

## Regra de retorno

Se `qa` ou `revisor` encontrar um problema relevante, a tarefa volta para o agente responsável pela implementação. Depois da correção, QA e revisão são repetidos. Nenhum agente pode declarar aprovação com verificações pendentes ou resultados presumidos.

## Primeira ordem futura

> Use `planejador` e `designer_publico` para definir o primeiro bloco da área pública do SaaS jurídico. Em seguida, use `frontend` para implementar apenas esse bloco. Peça a `qa` e `revisor` que validem o resultado. Corrija os problemas encontrados e pare antes do commit, apresentando os arquivos alterados e os resultados de lint e build.
