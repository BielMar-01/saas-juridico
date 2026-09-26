"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";
import { ThemeControl } from "./theme-control";

const links = [
  { href: "#plataforma", label: "Plataforma" },
  { href: "#clareza", label: "Clareza para o cliente" },
  { href: "#seguranca", label: "Segurança" },
  { href: "#duvidas", label: "Dúvidas" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function followMobileAnchor(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    event.preventDefault();
    closeMenu();

    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      window.history.pushState(null, "", href);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
    });
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="wordmark" href="#inicio" aria-label="JurisVia, início">
          JurisVia <span>nome provisório</span>
        </a>

        <nav className="desktop-nav" aria-label="Navegação principal">
          {links.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className="header-actions">
          <ThemeControl />
          <a className="button button-secondary header-demo" href="#demonstracao">Ver demonstração</a>
          <a className="button button-primary header-primary" href="#plataforma">Conhecer a plataforma</a>
          <button
            ref={menuButton}
            className="menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="Navegação móvel"
        hidden={!open}
      >
        <div className="container mobile-nav-inner">
          {links.map((link, index) => (
            <a key={link.href} ref={index === 0 ? firstLink : undefined} href={link.href} onClick={(event) => followMobileAnchor(event, link.href)}>
              {link.label}
            </a>
          ))}
          <div className="mobile-nav-actions">
            <a className="button button-secondary" href="#demonstracao" onClick={(event) => followMobileAnchor(event, "#demonstracao")}>Ver demonstração</a>
            <a className="button button-primary" href="#plataforma" onClick={(event) => followMobileAnchor(event, "#plataforma")}>Conhecer a plataforma</a>
          </div>
        </div>
      </nav>
    </header>
  );
}
