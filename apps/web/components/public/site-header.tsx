"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";
import { ThemeControl } from "./theme-control";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const homeAnchor = (hash: string) => pathname === "/" ? hash : `/${hash}`;
  const links = [
    { href: "/", label: "Início", current: pathname === "/" },
    { href: "/recursos", label: "Recursos", current: pathname === "/recursos" },
    { href: "/seguranca", label: "Segurança", current: pathname === "/seguranca" },
    { href: "/contato", label: "Contato", current: pathname === "/contato" },
  ];

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

  function followMobileLink(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    const targetUrl = new URL(href, window.location.href);
    const isSamePageAnchor = targetUrl.pathname === window.location.pathname && Boolean(targetUrl.hash);
    setOpen(false);
    if (!isSamePageAnchor) return;
    event.preventDefault();
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(targetUrl.hash);
      if (!target) return;
      window.history.pushState(null, "", targetUrl.hash);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
    });
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="wordmark" href="/" aria-label="JurisVia, início">JurisVia <span>nome provisório</span></Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {links.map((link) => <Link key={link.href} href={link.href} aria-current={link.current ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <div className="header-actions">
          <ThemeControl />
          <Link className="button button-secondary header-demo" href={homeAnchor("#demonstracao")}>Ver demonstração</Link>
          <Link className="button button-primary header-primary" href={homeAnchor("#plataforma")}>Conhecer a plataforma</Link>
          <button ref={menuButton} className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((value) => !value)}>{open ? <CloseIcon /> : <MenuIcon />}</button>
        </div>
      </div>
      <nav id="mobile-navigation" className="mobile-nav" aria-label="Navegação móvel" hidden={!open}>
        <div className="container mobile-nav-inner">
          {links.map((link, index) => <Link key={link.href} ref={index === 0 ? firstLink : undefined} href={link.href} aria-current={link.current ? "page" : undefined} onClick={(event) => followMobileLink(event, link.href)}>{link.label}</Link>)}
          <div className="mobile-nav-actions">
            <Link className="button button-secondary" href={homeAnchor("#demonstracao")} onClick={(event) => followMobileLink(event, homeAnchor("#demonstracao"))}>Ver demonstração</Link>
            <Link className="button button-primary" href={homeAnchor("#plataforma")} onClick={(event) => followMobileLink(event, homeAnchor("#plataforma"))}>Conhecer a plataforma</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
