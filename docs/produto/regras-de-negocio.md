# Regras de negócio

Versão operacional extraída do plano de negócio. Em caso de alteração, atualizar também o plano completo.


As regras abaixo formam a base funcional do produto. Elas devem ser convertidas em critérios de aceitação e testes antes do desenvolvimento de cada módulo.

## RN 001 Isolamento por escritório

> Todo registro deve pertencer a um único escritório. Usuários de um escritório não podem consultar, pesquisar, exportar ou inferir dados de outro, inclusive por URL, API, relatório ou notificação.

## RN 002 Propriedade da conta

> Cada escritório deve possuir ao menos um proprietário ativo. A transferência de propriedade exige reautenticação, confirmação do novo proprietário e registro de auditoria.

## RN 003 Convite de usuário

> Somente usuários autorizados podem convidar membros. Convites devem expirar, ser de uso único e já conter perfil e escopo inicial definidos.

## RN 004 Privilégio mínimo

> Novos usuários recebem apenas os acessos necessários. Permissões administrativas, financeiras, de exportação e exclusão não devem ser presumidas.

## RN 005 Autenticação reforçada

> Ações sensíveis exigem sessão válida e podem exigir nova autenticação. MFA deve ser obrigatório para administradores e recomendado para os demais perfis.

## RN 006 Cliente único com múltiplos casos

> Um cliente pode possuir vários casos. A identificação duplicada deve gerar alerta, mas a fusão de cadastros exige confirmação e preservação do histórico.

## RN 007 Verificação de conflito

> Antes de confirmar novo cliente ou parte, o sistema deve pesquisar nomes, documentos e organizações relacionados na base do próprio escritório e registrar a decisão do usuário autorizado.

## RN 008 Caso judicial ou extrajudicial

> O número processual não é obrigatório para criar um caso. Quando informado, deve seguir validação estrutural aplicável e permitir associação a mais de um processo relacionado.

## RN 009 Responsabilidade do caso

> Todo caso ativo deve ter ao menos um responsável interno. A remoção do último responsável exige substituição ou encerramento do caso.

## RN 010 Status interno e status público

> O status interno é separado do status exibido ao cliente. Alterar um não publica automaticamente o outro.

## RN 011 Publicação controlada

> Somente usuários autorizados podem publicar atualizações no portal. A publicação deve indicar autor, data, conteúdo e versão; correções posteriores preservam o histórico.

## RN 012 Segredo e restrição

> Casos e documentos marcados como sigilosos possuem lista explícita de acesso. Nenhum resumo, busca global, relatório ou notificação pode revelar conteúdo a usuários não autorizados.

## RN 013 Checklist documental

> Cada pendência documental deve indicar solicitante, destinatário, obrigatoriedade, prazo, estado e critérios de aceite.

## RN 014 Estados do documento

> O fluxo mínimo é solicitado, enviado, em análise, aprovado, recusado, substituído e dispensado. Recusa e dispensa exigem justificativa.

## RN 015 Versionamento

> Substituir um arquivo cria nova versão. Versões anteriores permanecem preservadas conforme política de retenção e só podem ser vistas por usuários autorizados.

## RN 016 Disponibilização ao cliente

> Nenhum documento interno fica visível ao cliente por padrão. A liberação é explícita e pode ser revogada sem apagar o registro histórico.

## RN 017 Arquivo potencialmente inseguro

> Uploads devem respeitar tamanho e formatos permitidos, passar por verificação de segurança e permanecer indisponíveis até a conclusão da análise técnica.

## RN 018 Prazo e fuso horário

> Prazos devem armazenar data, hora, fuso, origem e responsável. Alterações relevantes geram histórico e notificação.

## RN 019 Prazo crítico

> Prazos marcados como críticos exigem confirmação de responsável e alertas escalonados. O sistema auxilia o controle, mas não garante o cálculo jurídico do prazo.

## RN 020 Conclusão de tarefa

> A conclusão registra usuário, data e evidência opcional. Tarefas obrigatórias de uma fase podem bloquear o avanço conforme configuração do playbook.

## RN 021 Notificações

> Usuários controlam canais não críticos. Alertas essenciais de segurança, cobrança, prazo crítico e mudança de acesso não podem ser desativados integralmente.

## RN 022 Comunicação com cliente

> Mensagens devem ficar associadas ao cliente e, quando aplicável, ao caso. Conteúdo interno nunca deve ser encaminhado automaticamente.

## RN 023 Identidade do cliente

> O primeiro acesso do cliente exige convite válido e verificação do canal definido pelo escritório. Alterações de e-mail ou telefone exigem confirmação reforçada.

## RN 024 Acesso do cliente

> O cliente acessa somente registros vinculados à sua identidade e liberados pelo escritório. Casos compartilhados com mais de um cliente devem respeitar restrições individuais.

## RN 025 Solicitação do titular

> O escritório deve conseguir localizar, exportar, corrigir, restringir ou eliminar dados quando juridicamente aplicável, preservando exceções legais e registros necessários.

## RN 026 Retenção

> A retenção varia por categoria de dado e obrigação do escritório. Expiração deve gerar revisão, não exclusão automática indiscriminada.

## RN 027 Auditoria

> Login, falhas de acesso, visualização de itens sensíveis, download, compartilhamento, exportação, mudança de permissão, publicação e exclusão devem gerar logs protegidos contra alteração comum.

## RN 028 Exclusão lógica

> Registros essenciais são desativados ou enviados à lixeira antes da remoção definitiva. Exclusão definitiva exige permissão especial, prazo de recuperação e verificação de dependências.

## RN 029 Exportação

> O escritório pode exportar seus dados em formato utilizável. Exportações sensíveis exigem autorização, ficam disponíveis por tempo limitado e são auditadas.

## RN 030 Cancelamento

> Após cancelamento, o escritório mantém acesso em modo de exportação por período contratual definido. Encerrado o prazo, aplica-se a política de retenção e eliminação comunicada previamente.

## RN 031 Integração com fontes públicas

> Dados externos devem registrar fonte e data de consulta. A plataforma não deve apresentar metadados públicos como certidão, conteúdo integral ou garantia de atualização.

## RN 032 IA assistiva

> Toda saída de IA deve ser identificada como sugestão, permitir revisão e registrar aprovação antes de qualquer uso externo. Dados de um escritório não podem treinar modelos para outro sem base e autorização específicas.

## RN 033 Publicidade do escritório

> Páginas públicas e recursos de marketing devem permitir conteúdo informativo, sem promessas de resultado, captação indevida ou divulgação incompatível com as regras profissionais aplicáveis.

## RN 034 Inadimplência

> A inadimplência pode limitar criação de novos registros após aviso e carência, mas não deve bloquear imediatamente o acesso aos dados, prazos ativos ou exportação essencial.

## RN 035 Disponibilidade e incidentes

> O fornecedor deve manter backups, recuperação testada, monitoramento e procedimento de resposta a incidentes, com comunicação aos escritórios conforme impacto e obrigações aplicáveis.

