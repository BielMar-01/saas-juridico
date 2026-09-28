"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type NavigationKind = "link" | "pop" | null;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function focusHash(hash: string) {
  if (!hash) return false;
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    id = hash.slice(1);
  }
  const target = document.getElementById(id);
  if (!target) return false;
  if (!target.matches("a,button,input,select,textarea,[tabindex]")) target.tabIndex = -1;
  target.focus({ preventScroll: true });
  target.scrollIntoView({
    block: "start",
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
  return true;
}

function focusPageStart() {
  const main = document.getElementById("conteudo");
  if (main) {
    if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
    main.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function NavigationManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kind = useRef<NavigationKind>(null);
  const mounted = useRef(false);
  const search = searchParams.toString();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      kind.current = "link";
      const sameLocation = url.pathname === window.location.pathname && url.search === window.location.search;
      if (!sameLocation || url.href !== window.location.href) return;
      window.requestAnimationFrame(() => {
        if (url.hash) focusHash(url.hash);
        else focusPageStart();
        kind.current = null;
      });
    }

    function onPopState() {
      kind.current = "pop";
    }

    function onHashChange() {
      if (kind.current === "pop") return;
      window.requestAnimationFrame(() => {
        focusHash(window.location.hash);
        kind.current = null;
      });
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (window.location.hash) window.requestAnimationFrame(() => focusHash(window.location.hash));
      return;
    }
    if (kind.current === "pop") {
      kind.current = null;
      return;
    }
    window.requestAnimationFrame(() => {
      if (window.location.hash) focusHash(window.location.hash);
      else focusPageStart();
      kind.current = null;
    });
  }, [pathname, search]);

  return null;
}
