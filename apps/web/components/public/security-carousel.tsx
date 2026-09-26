"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "./icons";
const slides = [
  ["Isolamento por escritório", "Todo registro deverá pertencer a um único escritório, sem consulta ou inferência de dados entre organizações."],
  ["Privilégio mínimo", "Novos usuários deverão receber somente os acessos necessários para seu trabalho."],
  ["Documentos privados por padrão", "Arquivos internos não deverão ficar visíveis ao cliente sem liberação explícita."],
  ["Publicação controlada", "Atualizações do cliente deverão ser escolhidas por pessoas autorizadas e manter histórico."],
  ["Acesso por contexto", "Função, equipe, unidade e participação no caso deverão compor a decisão de acesso."],
  ["Ações auditáveis", "Acessos e mudanças sensíveis deverão registrar autor, data, contexto e ação."],
] as const;
export function SecurityCarousel() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  useEffect(() => { root.current?.classList.add("carousel-enhanced"); }, []);
  function go(index: number) { setActive((index + slides.length) % slides.length); }
  function handleKey(e: React.KeyboardEvent) { if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return; e.preventDefault(); if (e.key === "ArrowRight") go(active + 1); else if (e.key === "ArrowLeft") go(active - 1); else if (e.key === "Home") go(0); else go(slides.length - 1); }
  function finish(x: number) { if (start.current === null) return; const distance = x - start.current; start.current = null; if (Math.abs(distance) > 45) go(active + (distance < 0 ? 1 : -1)); }
  return <div ref={root} className="security-carousel" tabIndex={0} aria-label="Princípios de segurança" onKeyDown={handleKey} onPointerDown={(e) => { start.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerUp={(e) => finish(e.clientX)} onPointerCancel={() => { start.current = null; }}>
    <div className="carousel-viewport">{slides.map(([title, text], i) => <article key={title} className={`principle-slide${i === active ? " is-active" : ""}`}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    <div className="carousel-controls"><button type="button" onClick={() => go(active - 1)} aria-label="Princípio anterior"><ArrowIcon className="arrow-back" /></button><div className="carousel-dots" role="group" aria-label="Selecionar princípio">{slides.map((slide, i) => <button key={slide[0]} type="button" aria-label={`Ir ao princípio ${i + 1}`} aria-current={i === active ? "true" : undefined} onClick={() => go(i)} />)}</div><span aria-live="polite">{active + 1} de {slides.length}</span><button type="button" onClick={() => go(active + 1)} aria-label="Próximo princípio"><ArrowIcon /></button></div>
  </div>;
}
