export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-wordmark">JurisVia</div>
          <p>Gestão jurídica com clareza para o escritório e para o cliente.</p>
          <span className="provisional-note">Nome provisório em validação.</span>
        </div>
        <nav aria-label="Navegação do rodapé">
          <a href="#plataforma">Plataforma</a>
          <a href="#clareza">Clareza para o cliente</a>
          <a href="#seguranca">Segurança</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>Proposta de produto em desenvolvimento.</span>
        <a href="#inicio">Voltar ao início</a>
      </div>
    </footer>
  );
}
