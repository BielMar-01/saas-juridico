import Link from "next/link";
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
          <Link href="/">Início</Link><Link href="/recursos">Recursos</Link><Link href="/seguranca">Segurança</Link><Link href="/contato">Contato</Link>
        </nav>
      </div>
      <div className="container footer-bottom"><span>Proposta de produto em desenvolvimento.</span><Link href="/">Voltar ao início</Link></div>
    </footer>
  );
}
