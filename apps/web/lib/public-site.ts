export const site={name:"JurisVia",provisionalNote:"Nome provisório em validação.",description:"Gestão jurídica com clareza para o escritório e para o cliente."} as const;
export const primaryNavigation=[{href:"/",label:"Início"},{href:"/recursos",label:"Recursos"},{href:"/seguranca",label:"Segurança"},{href:"/planos",label:"Planos"},{href:"/faq",label:"FAQ"},{href:"/contato",label:"Contato"}] as const;
export const legalNavigation=[{href:"/termos",label:"Termos de uso"},{href:"/privacidade",label:"Privacidade"}] as const;
export const pricingNotice="Planos, preços e limites apresentados apenas para demonstração. A oferta comercial ainda não foi definida.";
export const plans=[
{id:"essencial",name:"Essencial",price:"R$ 99",period:"/mês",audience:"Para profissionais autônomos e escritórios pequenos.",limits:["Até 2 usuários","Até 100 clientes ativos"],features:["Gestão de casos e processos","Tarefas e prazos","Documentos","Portal do cliente","Suporte por e-mail"]},
{id:"profissional",name:"Profissional",price:"R$ 249",period:"/mês",audience:"Para escritórios em crescimento.",limits:["Até 10 usuários","Até 500 clientes ativos"],features:["Tudo do Essencial","Equipe e permissões","Painel de Clareza Jurídica","Índice de Prontidão do Caso","Playbooks jurídicos","Auditoria","Suporte prioritário"],featured:true},
{id:"escritorio",name:"Escritório",price:"R$ 499",period:"/mês",audience:"Para operações maiores e estruturadas.",limits:["Até 30 usuários","Clientes conforme política futura"],features:["Tudo do Profissional","Configurações avançadas","Relatórios","Armazenamento ampliado","Implantação assistida","Canal de suporte diferenciado"]}] as const;
export const faqCategories=[
{id:"produto",title:"Produto",items:[
{question:"O JurisVia substitui um sistema processual oficial?",answer:"Não. O JurisVia organiza o trabalho e a comunicação; sistemas oficiais, fontes processuais e a atuação profissional continuam sujeitos às suas próprias fontes e responsabilidades."},
{question:"Todo caso precisa ter um processo?",answer:"Não. Um caso poderá ser judicial ou extrajudicial e existir sem número de processo."},
{question:"Um caso pode ter mais de um processo?",answer:"Sim. Um caso poderá ter zero, um ou vários processos vinculados."},
{question:"O JurisVia oferece orientação jurídica?",answer:"Não. É um software de apoio à organização, sem aconselhamento jurídico ou garantia de resultado."}]},
{id:"seguranca",title:"Segurança",items:[
{question:"Como os documentos serão protegidos?",answer:"Documentos deverão ser privados por padrão, com autenticação e autorização antes do acesso. Esses controles ainda serão implementados e validados."},
{question:"Como funcionarão usuários e permissões?",answer:"O acesso deverá considerar papel, escritório, equipe, participação no caso e permissões específicas. O cargo, sozinho, não será suficiente."}]},
{id:"portal",title:"Portal do cliente",items:[
{question:"O cliente verá informações internas?",answer:"Não. O cliente deverá ver somente o conteúdo publicado para a sua identidade."},
{question:"Como funcionará o portal do cliente?",answer:"O escritório deverá liberar atualizações, próximos passos e documentos. Conteúdo interno não será publicado automaticamente."}]},
{id:"implantacao",title:"Implantação",items:[
{question:"Haverá integração com tribunais?",answer:"Essa integração pertence a uma fase futura e não está disponível."},
{question:"O produto será adequado para profissionais autônomos?",answer:"O plano Essencial é uma proposta demonstrativa para esse perfil. Oferta, limites e preço ainda não são definitivos."}]},
{id:"planos",title:"Planos",items:[{question:"Os planos e preços são definitivos?",answer:"Não. Planos, preços e limites são demonstrativos e ainda dependem de validação comercial."}]},
{id:"suporte",title:"Suporte e contato",items:[{question:"O formulário de contato envia uma mensagem?",answer:"Não. A página apresenta os campos previstos, sem transmissão ou armazenamento."}]}] as const;
export const allFaqItems=faqCategories.reduce<{question:string;answer:string}[]>((items,category)=>[...items,...category.items],[]);