import { faqCategories } from "@/lib/public-site";
import { ArrowIcon, CheckIcon, DocumentIcon, LockIcon } from "./icons";
import { ProductPreview } from "./product-preview";

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="section-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="hero section" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Gestão jurídica com contexto</p>
          <h1 id="hero-title">Controle o escritório e deixe cada próximo passo claro.</h1>
          <p className="hero-lead">
            Organize casos, prazos, documentos e equipe em um só lugar. Dê ao cliente uma visão simples do que aconteceu, do que falta e do que vem depois.
          </p>
          <div className="button-row">
            <a className="button button-primary button-large" href="#plataforma">
              Conhecer a plataforma <ArrowIcon />
            </a>
            <a className="button button-secondary button-large" href="#demonstracao">Ver demonstração</a>
          </div>
          <p className="hero-note">Produto em desenvolvimento. A demonstração abaixo usa somente dados fictícios.</p>
        </div>
        <div id="demonstracao" className="anchor-target hero-preview" tabIndex={-1}>
          <ProductPreview compact />
        </div>
      </div>
    </section>
  );
}

export function RoutineSection() {
  return (
    <section className="routine section section-muted" aria-labelledby="routine-title">
      <div className="container routine-grid">
        <div className="section-intro sticky-intro">
          <p className="eyebrow">A rotina hoje</p>
          <h2 id="routine-title">Quando a informação fica espalhada, o próximo passo também.</h2>
          <p>Prazos em lugares diferentes, documentos em pastas e atualizações sem histórico tornam mais difícil acompanhar o trabalho e responder ao cliente com contexto.</p>
        </div>
        <ol className="routine-list">
          <li><span>01</span><div><h3>O prazo perde o contexto</h3><p>A equipe encontra a data, mas precisa procurar em outros lugares quem é responsável e o que precisa ser feito.</p></div></li>
          <li><span>02</span><div><h3>O documento vira uma busca</h3><p>Versões dispersas dificultam saber qual arquivo está em análise e qual já pode orientar o trabalho.</p></div></li>
          <li><span>03</span><div><h3>O cliente pede uma tradução</h3><p>Sem um histórico organizado, cada atualização exige reconstruir o caso antes de explicar o próximo passo.</p></div></li>
        </ol>
      </div>
    </section>
  );
}

export function PlatformSection() {
  return (
    <section id="plataforma" className="section anchor-target" aria-labelledby="platform-title" tabIndex={-1}>
      <div className="container">
        <SectionIntro
          eyebrow="Visão da plataforma"
          title="A rotina do escritório, organizada em uma só visão."
          text="Acompanhe casos, responsáveis, tarefas, prazos e documentos sem perder de vista o que precisa acontecer em seguida."
        />
        <ProductPreview />
        <div className="platform-details" aria-label="Informações organizadas na plataforma">
          <div><span className="detail-mark">01</span><h3>Status com contexto</h3><p>O estado do caso aparece junto de responsáveis, pendências e histórico.</p></div>
          <div><span className="detail-mark">02</span><h3>Próximo passo visível</h3><p>A equipe identifica o que precisa acontecer e quem conduz cada atividade.</p></div>
          <div><span className="detail-mark">03</span><h3>Documentos no fluxo</h3><p>Solicitações e versões ficam ligadas ao trabalho que lhes dá sentido.</p></div>
        </div>
      </div>
    </section>
  );
}

export function ClaritySection() {
  return (
    <section id="clareza" className="clarity section section-ink anchor-target" aria-labelledby="clarity-title" tabIndex={-1}>
      <div className="container">
        <SectionIntro
          eyebrow="Painel de Clareza Jurídica"
          title="Clareza para a equipe. Próximos passos para o cliente."
          text="A equipe mantém a visão de trabalho do caso. O cliente acompanha apenas as atualizações e os documentos que o escritório decidir liberar."
        />
        <div className="clarity-grid">
          <article className="clarity-panel internal-panel">
            <div className="panel-heading"><span>Visão interna</span><span className="status status-private"><LockIcon /> Restrito à equipe</span></div>
            <h3>Revisão contratual</h3>
            <table className="internal-table">
              <caption className="sr-only">Atividades internas do caso fictício de revisão contratual</caption>
              <thead>
                <tr><th scope="col">Atividade</th><th scope="col">Responsável</th><th scope="col">Estado</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Conferir anexos</th><td>Equipe Contratos</td><td>Concluído</td></tr>
                <tr><th scope="row">Revisar minuta</th><td>Responsável do caso</td><td>Em análise</td></tr>
                <tr><th scope="row">Preparar retorno</th><td>Atendimento</td><td>Pendente</td></tr>
              </tbody>
            </table>
            <p className="panel-note"><LockIcon /> Anotações, tarefas internas e documentos privados não são publicados automaticamente.</p>
          </article>
          <article className="clarity-panel client-panel">
            <div className="panel-heading"><span>Visão do cliente</span><span className="status status-shared"><CheckIcon /> Conteúdo liberado</span></div>
            <p className="client-overline">Atualização do caso</p>
            <h3>Estamos revisando os documentos recebidos.</h3>
            <p>A equipe está conferindo os pontos do contrato antes de preparar a próxima orientação.</p>
            <div className="client-next"><span>Próximo passo</span><strong>O escritório enviará uma atualização após a revisão.</strong></div>
            <div className="client-document"><DocumentIcon /><div><strong>Documento solicitado</strong><span>Comprovante de endereço • pendente</span></div></div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function FlowSection() {
  const steps = [
    ["Organize o caso", "Reúna responsáveis, tarefas, prazos e documentos com o contexto necessário."],
    ["Acompanhe o trabalho", "Visualize pendências e próximos passos para orientar a rotina da equipe."],
    ["Compartilhe com critério", "Escolha o conteúdo que pode ser publicado para o cliente."],
  ];
  return (
    <section className="flow section" aria-labelledby="flow-title">
      <div className="container">
        <SectionIntro eyebrow="Como funciona" title="Do caso organizado à atualização aprovada." text="Um fluxo simples para preservar o contexto do trabalho e comunicar apenas o que foi autorizado." />
        <ol className="flow-list">
          {steps.map(([title, text], index) => (
            <li key={title}><span className="flow-number">0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>
          ))}
        </ol>
        <p className="flow-note"><LockIcon /> A publicação para o cliente é uma decisão explícita do escritório.</p>
      </div>
    </section>
  );
}

export function SecuritySection() {
  return (
    <section id="seguranca" className="security section section-muted anchor-target" aria-labelledby="security-title" tabIndex={-1}>
      <div className="container security-grid">
        <div>
          <SectionIntro eyebrow="Segurança e privacidade" title="Informação jurídica exige acesso com critério." text="O produto é planejado para separar os dados de cada escritório, limitar acessos conforme o contexto e manter documentos privados até que sejam liberados explicitamente." />
          <p className="security-caveat">Estes são princípios de arquitetura do produto. Controles implementados serão validados antes da publicação definitiva.</p>
        </div>
        <ul className="principles-list">
          <li><span><LockIcon /></span><div><h3>Isolamento por escritório</h3><p>Dados e vínculos são planejados para permanecer no contexto de cada organização.</p></div></li>
          <li><span><CheckIcon /></span><div><h3>Privilégio mínimo</h3><p>O acesso considera função, equipe, caso e permissão específica.</p></div></li>
          <li><span><DocumentIcon /></span><div><h3>Privado por padrão</h3><p>Documentos internos permanecem privados até uma liberação explícita.</p></div></li>
        </ul>
      </div>
    </section>
  );
}

export function FaqSection() {
  const questions = faqCategories[0].items;
  return (
    <section id="duvidas" className="faq section anchor-target" aria-labelledby="faq-title" tabIndex={-1}>
      <div className="container faq-grid">
        <div className="section-intro sticky-intro"><p className="eyebrow">Dúvidas frequentes</p><h2 id="faq-title">Respostas diretas sobre a proposta.</h2><p>O escopo desta página apresenta a direção do produto, sem preços, cadastro ou promessa de disponibilidade.</p></div>
        <div className="faq-list">
          {questions.map(({ question, answer }) => (
            <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="final-cta section" aria-labelledby="cta-title">
      <div className="container final-cta-inner">
        <p className="eyebrow">Uma visão mais clara</p>
        <h2 id="cta-title">Veja como mais clareza pode fazer parte da rotina do escritório.</h2>
        <p>Conheça a proposta do JurisVia e explore a visão da plataforma.</p>
        <div className="button-row">
          <a className="button button-light button-large" href="#plataforma">Conhecer a plataforma <ArrowIcon /></a>
          <a className="button button-outline-light button-large" href="#demonstracao">Ver demonstração</a>
        </div>
      </div>
    </section>
  );
}
