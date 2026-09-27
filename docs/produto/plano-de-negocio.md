# Plano de negócio do SaaS jurídico

Versão 1.0 \| Setembro de 2026

Mercado inicial: escritórios de advocacia brasileiros de pequeno e médio porte

Nome do produto: a definir

Documento de referência para validação comercial, definição do MVP e planejamento do produto.

# Decisão recomendada

O produto deve nascer como uma plataforma multiempresa que organiza o trabalho interno do escritório e, ao mesmo tempo, melhora a experiência do cliente. O diferencial recomendado é o Painel de Clareza Jurídica: uma visão segura e simplificada do caso, com status explicado em linguagem acessível, próximos passos, documentos pendentes, responsáveis e histórico de comunicações aprovadas pelo advogado.

O MVP não deve tentar substituir os grandes sistemas jurídicos em todas as áreas. Deve resolver muito bem quatro problemas: centralização de casos, controle documental, comunicação com o cliente e responsabilização da equipe. Integrações processuais automáticas, inteligência artificial e financeiro avançado entram após a validação dessa base.

# 1 Visão geral do negócio

## 1.1 Problema

Escritórios pequenos e médios costumam dividir informações entre planilhas, e-mail, aplicativos de mensagem, pastas em nuvem e sistemas processuais. Isso aumenta o risco de prazo perdido, documento esquecido, atendimento sem histórico, acesso indevido e retrabalho. Para o cliente, a falta de atualização gera ansiedade e contatos repetitivos, mesmo quando o processo está seguindo normalmente.

## 1.2 Solução

Uma plataforma web por assinatura, com ambiente próprio para cada escritório, que reúne clientes, casos, processos, tarefas, prazos, documentos, equipe, permissões, comunicações e indicadores. O cliente acessa um portal separado para acompanhar informações liberadas pelo escritório, enviar documentos e entender o próximo passo.

## 1.3 Proposta de valor

| **Público**                  | **Valor entregue**                                                                            |
|------------------------------|-----------------------------------------------------------------------------------------------|
| Sócios e gestores            | Visão da operação, riscos, produtividade, carteira, pendências e histórico auditável.         |
| Advogados                    | Casos organizados, prazos, documentos, tarefas, comunicações e informações em um único lugar. |
| Assistentes e administrativo | Fluxos padronizados, checklists, responsáveis definidos e menos cobrança manual.              |
| Clientes                     | Acompanhamento simples e seguro, com clareza sobre status, pendências e próximos passos.      |

## 1.4 Público alvo inicial

- Escritórios com 2 a 50 usuários, atendendo pessoas físicas ou pequenas empresas.

- Áreas com alta recorrência de documentos e dúvidas de clientes, como trabalhista, previdenciário, consumidor, família, imobiliário e cível.

- Escritórios que ainda operam com planilhas, WhatsApp e pastas dispersas ou que consideram os sistemas atuais complexos para sua rotina.

## 1.5 Posicionamento

Gestão jurídica com foco em clareza, relacionamento e controle documental. A plataforma não promete resultado judicial, não presta aconselhamento jurídico ao cliente e não substitui a responsabilidade profissional do advogado.

# 2 Modelo de negócio

## 2.1 Receita

- Assinatura mensal ou anual por escritório, com franquia de usuários e armazenamento.

- Usuários adicionais, armazenamento adicional e módulos avançados cobrados separadamente.

- Implantação assistida, migração de dados e treinamento como serviços opcionais.

- Plano anual com desconto para reduzir cancelamento e melhorar previsibilidade de receita.

## 2.2 Sugestão inicial de planos

| **Plano**    | **Perfil**                   | **Inclui**                                                                                |
|--------------|------------------------------|-------------------------------------------------------------------------------------------|
| Essencial    | Autônomos e equipes pequenas | Até 3 usuários, clientes, casos, documentos, tarefas e portal do cliente.                 |
| Profissional | Escritórios em crescimento   | Até 10 usuários, automações, relatórios, modelos, integrações e permissões avançadas.     |
| Escritório   | Operações estruturadas       | Até 30 usuários, múltiplas equipes, auditoria ampliada, SLA, API e personalização visual. |
| Sob medida   | Operações maiores            | Limites negociados, implantação, migração, suporte e requisitos específicos.              |

Os preços devem ser definidos após entrevistas com pelo menos 15 escritórios e comparação da disposição a pagar. O plano não deve restringir segurança, exportação dos próprios dados ou acesso a informações essenciais.

## 2.3 Indicadores de negócio

| **Indicador**    | **Objetivo**                                                         |
|------------------|----------------------------------------------------------------------|
| MRR e ARR        | Medir receita recorrente mensal e anual.                             |
| CAC              | Medir custo total para adquirir um escritório.                       |
| LTV              | Estimar o valor gerado por cliente durante o relacionamento.         |
| Churn            | Acompanhar cancelamentos de contas e perda de receita.               |
| Ativação         | Escritório cadastra equipe, importa clientes e cria o primeiro caso. |
| Adoção do portal | Percentual de clientes convidados que acessam e concluem pendências. |
| Tempo para valor | Tempo entre cadastro e primeira rotina concluída na plataforma.      |

# 3 Estrutura funcional

| **Módulo**            | **Escopo principal**                                                          | **Fase** |
|-----------------------|-------------------------------------------------------------------------------|----------|
| Autenticação          | Login, recuperação, MFA, sessões e políticas de senha.                        | MVP      |
| Escritórios           | Conta, marca, configurações, unidades e plano contratado.                     | MVP      |
| Equipe e permissões   | Usuários, cargos, equipes, acesso por caso e auditoria.                       | MVP      |
| Clientes              | Cadastro, contatos, consentimentos, conflitos e histórico.                    | MVP      |
| Casos e processos     | Caso interno, número CNJ opcional, partes, área, fase, status e responsáveis. | MVP      |
| Documentos            | Upload, categorias, versões, pendências, aprovação e acesso.                  | MVP      |
| Tarefas e prazos      | Agenda, alertas, responsáveis, prioridade e conclusão.                        | MVP      |
| Portal do cliente     | Status liberado, timeline, pendências, arquivos e mensagens.                  | MVP      |
| Modelos e automações  | Checklists por tipo de caso, lembretes e geração de tarefas.                  | Fase 2   |
| Integração processual | Consulta de metadados públicos e captura autorizada de movimentações.         | Fase 2   |
| Financeiro            | Honorários, contratos, parcelas, despesas e inadimplência.                    | Fase 2   |
| IA assistiva          | Resumo, classificação, busca e rascunhos com revisão humana obrigatória.      | Fase 3   |

## 3.1 Conceitos principais

| **Conceito** | **Definição**                                                                           |
|--------------|-----------------------------------------------------------------------------------------|
| Escritório   | Organização contratante e limite principal de isolamento dos dados.                     |
| Cliente      | Pessoa física ou jurídica atendida pelo escritório.                                     |
| Caso         | Unidade interna de trabalho, judicial ou extrajudicial.                                 |
| Processo     | Registro judicial associado a um caso; um caso pode ter nenhum, um ou vários processos. |
| Pendência    | Item que exige ação ou documento de alguém, com responsável, prazo e estado.            |
| Evento       | Registro cronológico de movimentação, atualização, comunicação ou ação interna.         |

# 4 Usuários e permissões

| **Perfil**              | **Acesso recomendado**                                                                         |
|-------------------------|------------------------------------------------------------------------------------------------|
| Proprietário da conta   | Plano, cobrança, configurações, usuários e acesso total ao escritório.                         |
| Sócio ou administrador  | Gestão completa, relatórios, equipes e auditoria; sem transferência da propriedade por padrão. |
| Advogado                | Casos atribuídos ou da equipe, documentos, tarefas, prazos e comunicações autorizadas.         |
| Paralegal ou assistente | Rotinas operacionais conforme escopo, sem decisões exclusivas do advogado.                     |
| Financeiro              | Contratos e dados financeiros autorizados, sem conteúdo jurídico sensível por padrão.          |
| Recepção                | Cadastro e agenda, com acesso mínimo aos detalhes dos casos.                                   |
| Auditor                 | Consulta somente leitura a áreas definidas e logs, com prazo de validade.                      |
| Cliente                 | Somente os próprios casos e conteúdos expressamente publicados no portal.                      |

## 4.1 Modelo de autorização

O sistema deve combinar controle por função com controle por escopo. O perfil define capacidades gerais; a equipe, unidade e participação no caso definem quais registros o usuário pode acessar. Permissões sensíveis, como exportar dados, excluir documentos, convidar clientes, acessar financeiro ou administrar usuários, devem ser concedidas separadamente.

# 5 Diferencial competitivo recomendado

## 5.1 Painel de Clareza Jurídica

Cada caso terá duas visões: a visão técnica interna e a visão do cliente. O advogado escolhe quais eventos serão publicados e pode incluir uma explicação simples, impacto, ação necessária, responsável e expectativa de próxima atualização. O cliente não verá notas internas, estratégia, documentos restritos ou dados de terceiros.

- Semáforo de atenção do caso: em andamento normal, aguardando cliente, aguardando terceiro ou exige atenção do escritório.

- Próximo passo explicado: o que acontecerá, quem deve agir e até quando.

- Central de pendências documentais com checklist inteligente por tipo de serviço.

- Comprovante de envio e trilha de aprovação dos documentos.

- Resumo periódico aprovado pelo advogado, reduzindo mensagens repetitivas.

## 5.2 Índice de Prontidão do Caso

Indicador operacional interno calculado a partir de documentação, dados obrigatórios, tarefas críticas e aprovações. Ele não estima chance de vitória e não deve usar linguagem probabilística sobre resultado jurídico. Sua função é mostrar se o caso está preparado para a próxima etapa.

## 5.3 Cofre de documentos com coleta guiada

Em vez de pedir genericamente “envie seus documentos”, o escritório monta uma lista contextual. Cada item informa formato aceito, exemplo, validade, titular, obrigatoriedade e motivo da solicitação. O sistema detecta arquivo ausente, vencido, duplicado ou aguardando validação, sem afirmar autenticidade jurídica automaticamente.

## 5.4 Automações por playbook

O escritório cria modelos por área e tipo de caso. Ao iniciar um caso, o sistema gera fases, checklist documental, tarefas, responsáveis e mensagens sugeridas. Isso transforma conhecimento informal em processo replicável.

## 5.5 IA com supervisão

Recursos futuros de inteligência artificial devem atuar como assistência: resumir documentos, sugerir categorias, localizar informações e preparar rascunhos. Conteúdo gerado não será enviado ao cliente, protocolado ou tratado como orientação jurídica sem validação humana explícita. A origem dos dados, a versão do conteúdo e a aprovação devem permanecer auditáveis.

# 6 Regras de negócio

As regras abaixo formam a base funcional do produto. Elas devem ser convertidas em critérios de aceitação e testes antes do desenvolvimento de cada módulo.

RN 001 Isolamento por escritório

> Todo registro deve pertencer a um único escritório. Usuários de um escritório não podem consultar, pesquisar, exportar ou inferir dados de outro, inclusive por URL, API, relatório ou notificação.

RN 002 Propriedade da conta

> Cada escritório deve possuir ao menos um proprietário ativo. A transferência de propriedade exige reautenticação, confirmação do novo proprietário e registro de auditoria.

RN 003 Convite de usuário

> Somente usuários autorizados podem convidar membros. Convites devem expirar, ser de uso único e já conter perfil e escopo inicial definidos.

RN 004 Privilégio mínimo

> Novos usuários recebem apenas os acessos necessários. Permissões administrativas, financeiras, de exportação e exclusão não devem ser presumidas.

RN 005 Autenticação reforçada

> Ações sensíveis exigem sessão válida e podem exigir nova autenticação. MFA deve ser obrigatório para administradores e recomendado para os demais perfis.

RN 006 Cliente único com múltiplos casos

> Um cliente pode possuir vários casos. A identificação duplicada deve gerar alerta, mas a fusão de cadastros exige confirmação e preservação do histórico.

RN 007 Verificação de conflito

> Antes de confirmar novo cliente ou parte, o sistema deve pesquisar nomes, documentos e organizações relacionados na base do próprio escritório e registrar a decisão do usuário autorizado.

RN 008 Caso judicial ou extrajudicial

> O número processual não é obrigatório para criar um caso. Quando informado, deve seguir validação estrutural aplicável e permitir associação a mais de um processo relacionado.

RN 009 Responsabilidade do caso

> Todo caso ativo deve ter ao menos um responsável interno. A remoção do último responsável exige substituição ou encerramento do caso.

RN 010 Status interno e status público

> O status interno é separado do status exibido ao cliente. Alterar um não publica automaticamente o outro.

RN 011 Publicação controlada

> Somente usuários autorizados podem publicar atualizações no portal. A publicação deve indicar autor, data, conteúdo e versão; correções posteriores preservam o histórico.

RN 012 Segredo e restrição

> Casos e documentos marcados como sigilosos possuem lista explícita de acesso. Nenhum resumo, busca global, relatório ou notificação pode revelar conteúdo a usuários não autorizados.

RN 013 Checklist documental

> Cada pendência documental deve indicar solicitante, destinatário, obrigatoriedade, prazo, estado e critérios de aceite.

RN 014 Estados do documento

> O fluxo mínimo é solicitado, enviado, em análise, aprovado, recusado, substituído e dispensado. Recusa e dispensa exigem justificativa.

RN 015 Versionamento

> Substituir um arquivo cria nova versão. Versões anteriores permanecem preservadas conforme política de retenção e só podem ser vistas por usuários autorizados.

RN 016 Disponibilização ao cliente

> Nenhum documento interno fica visível ao cliente por padrão. A liberação é explícita e pode ser revogada sem apagar o registro histórico.

RN 017 Arquivo potencialmente inseguro

> Uploads devem respeitar tamanho e formatos permitidos, passar por verificação de segurança e permanecer indisponíveis até a conclusão da análise técnica.

RN 018 Prazo e fuso horário

> Prazos devem armazenar data, hora, fuso, origem e responsável. Alterações relevantes geram histórico e notificação.

RN 019 Prazo crítico

> Prazos marcados como críticos exigem confirmação de responsável e alertas escalonados. O sistema auxilia o controle, mas não garante o cálculo jurídico do prazo.

RN 020 Conclusão de tarefa

> A conclusão registra usuário, data e evidência opcional. Tarefas obrigatórias de uma fase podem bloquear o avanço conforme configuração do playbook.

RN 021 Notificações

> Usuários controlam canais não críticos. Alertas essenciais de segurança, cobrança, prazo crítico e mudança de acesso não podem ser desativados integralmente.

RN 022 Comunicação com cliente

> Mensagens devem ficar associadas ao cliente e, quando aplicável, ao caso. Conteúdo interno nunca deve ser encaminhado automaticamente.

RN 023 Identidade do cliente

> O primeiro acesso do cliente exige convite válido e verificação do canal definido pelo escritório. Alterações de e-mail ou telefone exigem confirmação reforçada.

RN 024 Acesso do cliente

> O cliente acessa somente registros vinculados à sua identidade e liberados pelo escritório. Casos compartilhados com mais de um cliente devem respeitar restrições individuais.

RN 025 Solicitação do titular

> O escritório deve conseguir localizar, exportar, corrigir, restringir ou eliminar dados quando juridicamente aplicável, preservando exceções legais e registros necessários.

RN 026 Retenção

> A retenção varia por categoria de dado e obrigação do escritório. Expiração deve gerar revisão, não exclusão automática indiscriminada.

RN 027 Auditoria

> Login, falhas de acesso, visualização de itens sensíveis, download, compartilhamento, exportação, mudança de permissão, publicação e exclusão devem gerar logs protegidos contra alteração comum.

RN 028 Exclusão lógica

> Registros essenciais são desativados ou enviados à lixeira antes da remoção definitiva. Exclusão definitiva exige permissão especial, prazo de recuperação e verificação de dependências.

RN 029 Exportação

> O escritório pode exportar seus dados em formato utilizável. Exportações sensíveis exigem autorização, ficam disponíveis por tempo limitado e são auditadas.

RN 030 Cancelamento

> Após cancelamento, o escritório mantém acesso em modo de exportação por período contratual definido. Encerrado o prazo, aplica-se a política de retenção e eliminação comunicada previamente.

RN 031 Integração com fontes públicas

> Dados externos devem registrar fonte e data de consulta. A plataforma não deve apresentar metadados públicos como certidão, conteúdo integral ou garantia de atualização.

RN 032 IA assistiva

> Toda saída de IA deve ser identificada como sugestão, permitir revisão e registrar aprovação antes de qualquer uso externo. Dados de um escritório não podem treinar modelos para outro sem base e autorização específicas.

RN 033 Publicidade do escritório

> Páginas públicas e recursos de marketing devem permitir conteúdo informativo, sem promessas de resultado, captação indevida ou divulgação incompatível com as regras profissionais aplicáveis.

RN 034 Inadimplência

> A inadimplência pode limitar criação de novos registros após aviso e carência, mas não deve bloquear imediatamente o acesso aos dados, prazos ativos ou exportação essencial.

RN 035 Disponibilidade e incidentes

> O fornecedor deve manter backups, recuperação testada, monitoramento e procedimento de resposta a incidentes, com comunicação aos escritórios conforme impacto e obrigações aplicáveis.

# 7 Jornada principal

## 7.1 Onboarding do escritório

1.  Criar a conta e verificar o responsável.

2.  Cadastrar dados do escritório, política de privacidade e identidade visual.

3.  Convidar equipe e configurar perfis e equipes.

4.  Importar clientes ou iniciar cadastros manualmente.

5.  Selecionar um playbook ou criar o primeiro caso.

6.  Convidar o cliente para o portal e solicitar documentos.

7.  Acompanhar o painel de ativação até concluir os itens essenciais.

## 7.2 Jornada do cliente

8.  Receber convite seguro e validar a identidade.

9.  Aceitar termos e visualizar somente os casos liberados.

10. Consultar status explicado e próximo passo.

11. Enviar documentos solicitados e acompanhar a análise.

12. Receber avisos de novas pendências ou atualizações.

13. Manter um histórico pesquisável de arquivos e comunicações.

# 8 Página pública do produto

A página pública deve vender a plataforma para escritórios, não serviços jurídicos ao consumidor. Sua mensagem precisa ser informativa, demonstrável e sem promessas absolutas.

| **Seção**    | **Conteúdo**                                                                             |
|--------------|------------------------------------------------------------------------------------------|
| Topo         | Proposta de valor clara, demonstração e teste gratuito ou conversa comercial.            |
| Problemas    | Informações dispersas, documentos faltantes, clientes sem retorno e equipe sem controle. |
| Produto      | Visões do escritório e do portal, com capturas reais ou protótipo fiel.                  |
| Diferenciais | Clareza para o cliente, prontidão do caso, coleta guiada e playbooks.                    |
| Segurança    | MFA, criptografia, auditoria, backups, isolamento e compromissos de privacidade.         |
| Planos       | Limites compreensíveis e comparação sem esconder recursos essenciais.                    |
| Conteúdo     | Materiais educativos para gestão de escritório e adoção de tecnologia.                   |
| Rodapé       | Termos, privacidade, contato, status do serviço e informações empresariais.              |

# 9 Segurança privacidade e conformidade

A plataforma tratará documentos, dados pessoais e informações potencialmente sensíveis. Segurança e privacidade são requisitos de produto e de confiança comercial, não apenas tarefas técnicas.

- Criptografia em trânsito e, quando aplicável, em repouso; gestão segura de chaves e segredos.

- MFA, proteção contra tentativas automatizadas, gestão de sessões e reautenticação para ações críticas.

- RBAC com escopo por caso e equipe, além de revisões periódicas de acesso.

- Logs de auditoria, monitoramento, alertas, backups e testes de restauração.

- Ambientes separados, menor privilégio operacional e processo formal de incidentes.

- Contrato definindo os papéis de controlador e operador conforme cada tratamento.

- Inventário de dados, registro das operações, bases legais, retenção e canal para titulares.

- Avaliação de fornecedores, localização dos dados e transferências internacionais quando existirem.

A LGPD exige avaliação jurídica específica do modelo, contratos e fluxos. Este plano não substitui parecer jurídico, revisão de segurança ou adequação conduzida por profissionais responsáveis.

# 10 Integrações

| **Integração**            | **Uso**                             | **Cuidados**                                                         |
|---------------------------|-------------------------------------|----------------------------------------------------------------------|
| DataJud e fontes públicas | Metadados e movimentações públicas. | Respeitar limites, sigilo, cobertura, atualização e termos da fonte. |
| E-mail e calendário       | Convites, alertas e agenda.         | Consentimento, escopos mínimos e prevenção de duplicidade.           |
| Armazenamento             | Documentos e versões.               | Criptografia, isolamento, retenção e antivírus.                      |
| Assinatura eletrônica     | Contratos e documentos.             | Provedor confiável, evidências e validade conforme contexto.         |
| Mensageria                | Avisos e relacionamento.            | Opt-in, templates, histórico e proteção contra vazamento.            |
| Financeiro                | Cobrança e conciliação.             | Segregação de acesso e minimização de dados financeiros.             |

# 11 Escopo do MVP

## 11.1 Incluído

- Cadastro e login do escritório, equipe e clientes; recuperação de acesso e MFA administrativo.

- Multiempresa, perfis, permissões e equipes.

- Clientes, casos, processos relacionados, responsáveis, partes e timeline interna.

- Documentos, versões, checklist, pendências e aprovação.

- Tarefas, prazos, alertas e painel operacional.

- Portal do cliente com status publicado, próximo passo, pendências e upload.

- Auditoria mínima, exportação básica, lixeira e política de retenção inicial.

- Página pública do SaaS, planos, contato, termos e privacidade.

## 11.2 Fora do MVP

- Peticionamento eletrônico e cálculo jurídico automático de prazos.

- Captura universal de todos os tribunais e sistemas.

- Contabilidade completa do escritório.

- Assinatura eletrônica própria; usar integração futura.

- IA que decide estratégia, prevê resultado ou envia conteúdo sem aprovação.

- Aplicativo móvel nativo; começar com web responsiva e considerar PWA.

# 12 Roadmap recomendado

| **Fase**   | **Objetivo**                  | **Entregas**                                                        |
|------------|-------------------------------|---------------------------------------------------------------------|
| Descoberta | Validar dor e segmento        | 15 a 25 entrevistas, protótipo, teste de preço e mapa de riscos.    |
| MVP        | Entregar valor central        | Gestão básica, documentos, tarefas, permissões e portal do cliente. |
| Piloto     | Validar operação real         | 3 a 5 escritórios, migração assistida, métricas e correções.        |
| Fase 2     | Automatizar e integrar        | Playbooks, DataJud, calendários, mensageria e financeiro básico.    |
| Fase 3     | Aumentar inteligência         | Busca semântica, resumos e rascunhos supervisionados.               |
| Escala     | Melhorar aquisição e retenção | API, parceiros, onboarding self-service, SLA e controles avançados. |

# 13 Critérios de sucesso do MVP

- Pelo menos 60% dos escritórios pilotos concluem o onboarding sem intervenção técnica pesada.

- Pelo menos 70% dos casos ativos possuem responsável, próximo passo e documentação controlada.

- Redução percebida de contatos repetitivos de clientes após adoção do portal.

- Clientes convidados conseguem enviar documentos sem suporte na maioria das tentativas.

- Nenhum incidente de isolamento entre escritórios ou exposição indevida durante o piloto.

- Ao menos três escritórios pilotos demonstram disposição real de pagar após o teste.

# 14 Riscos e respostas

| **Risco**                                | **Resposta recomendada**                                                               |
|------------------------------------------|----------------------------------------------------------------------------------------|
| Escopo grande demais                     | Limitar o MVP aos quatro problemas centrais e adiar recursos especializados.           |
| Vazamento de informação                  | Isolamento por tenant, testes de autorização, auditoria e revisão de segurança.        |
| Cliente interpretar status como garantia | Linguagem aprovada pelo advogado e avisos claros no portal.                            |
| Integrações instáveis                    | Registrar fonte e atualização, usar filas, retentativas e sinalizar indisponibilidade. |
| Baixa adesão da equipe                   | Onboarding guiado, importação, playbooks e interface simples.                          |
| IA produzir erro                         | Supervisão humana, fontes visíveis, limites de uso e nenhuma ação externa automática.  |
| Conflito com regras profissionais        | Revisar publicidade, comunicações e funcionalidades com especialista.                  |
| Cancelamento por pouco valor             | Acompanhar ativação, portal utilizado e redução de pendências como sinais de valor.    |

# 15 Hipóteses a validar com o mercado

14. Escritórios pagarão principalmente para reduzir retrabalho de atendimento e controlar documentos.

15. O cliente final adotará um portal se o acesso for simples e as atualizações forem realmente úteis.

16. O principal comprador será o sócio gestor ou responsável pela operação, não necessariamente o advogado mais técnico.

17. Playbooks configuráveis gerarão mais retenção que uma lista genérica de tarefas.

18. Integração processual será importante para venda, mas não precisa ser completa no primeiro lançamento.

19. Preço por faixa de usuários e armazenamento será mais compreensível que cobrança por processo.

# 16 Próximas decisões

20. Escolher um nicho inicial ou confirmar uma proposta horizontal para pequenos escritórios.

21. Realizar entrevistas com sócios, advogados, assistentes e clientes de escritórios.

22. Definir nome provisório, identidade e domínio somente após pesquisa de marca e disponibilidade.

23. Criar protótipo navegável do escritório e do portal do cliente.

24. Transformar as regras RN 001 a RN 035 em épicos, histórias e critérios de aceitação.

25. Definir arquitetura, modelo de dados, controles de segurança e política de retenção.

26. Selecionar escritórios pilotos e documentar métricas de sucesso antes do desenvolvimento completo.

# 17 Referências regulatórias e técnicas

Lei nº 13.709 de 2018 Lei Geral de Proteção de Dados Pessoais. Presidência da República. https://www.planalto.gov.br/ccivil_03/\_ato2015-2018/2018/lei/l13709.htm

Guia orientativo sobre segurança da informação para agentes de tratamento de pequeno porte. ANPD. https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte

Provimento nº 205 de 2021 sobre publicidade e informação da advocacia. Conselho Federal da OAB. https://www.oab.org.br/util/print?numero=205%2F2021&origem=Provimentos&print=Legislacao

API Pública do DataJud. Conselho Nacional de Justiça. https://datajud-wiki.cnj.jus.br/api-publica/

## Registro de validação comercial — 27/09/2026

A página pública pode apresentar Essencial, Profissional e Escritório com preços e limites estritamente fictícios para demonstração. A composição comercial definitiva continua pendente de entrevistas e validação; esta decisão não substitui o histórico de hipóteses acima.
