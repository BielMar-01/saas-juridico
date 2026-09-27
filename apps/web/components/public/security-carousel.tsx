"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon } from "./icons";

type Slide = { classification: string; title: string; body: string; points: readonly string[] };
const slides: readonly Slide[] = [
  { classification: "Fundamento de arquitetura", title: "Dados separados desde a base", body: "O JurisVia é planejado como uma plataforma multi-tenant. Cada escritório trabalha dentro do seu próprio contexto, reduzindo o risco de acesso indevido a clientes, casos, processos e documentos de outras organizações.", points: ["Isolamento por escritório", "Contexto obrigatório nas operações", "Validações aplicadas no backend", "Arquitetura preparada para políticas adicionais no banco"] },
  { classification: "Controle previsto no produto", title: "Cada pessoa acessa somente o necessário", body: "Usuários recebem permissões de acordo com seu papel, vínculo com o escritório e participação nos casos. A proposta é limitar o acesso ao mínimo necessário para cada atividade.", points: ["Funções e permissões", "Vínculo com escritório e equipe", "Acesso específico por caso", "Revisão de ações sensíveis"] },
  { classification: "Regra obrigatória de negócio", title: "Publicação controlada no portal", body: "O portal do cliente não é uma cópia da área interna. Atualizações, documentos e próximos passos só ficam visíveis quando o escritório decide publicá-los.", points: ["Separação entre conteúdo interno e público", "Publicação intencional", "Linguagem clara para o cliente", "Proteção de observações estratégicas"] },
  { classification: "Controle planejado", title: "Arquivos protegidos desde o envio", body: "Documentos jurídicos são privados por padrão. O acesso depende do vínculo do usuário e da finalidade do arquivo, evitando exposição automática ou links públicos permanentes.", points: ["Acesso autenticado", "Armazenamento privado", "Autorização antes do download", "Compartilhamento controlado"] },
  { classification: "Capacidade planejada", title: "Rastreabilidade para operações sensíveis", body: "A plataforma prevê registros de auditoria para operações relevantes, permitindo identificar quem realizou determinada ação, quando ela ocorreu e em qual contexto.", points: ["Usuário responsável", "Data e horário", "Ação realizada", "Escritório e entidade afetada"] },
  { classification: "Evolução futura", title: "Proteção evolui junto com o produto", body: "Backup, recuperação, monitoramento, gestão de incidentes e revisão periódica de acessos serão implantados progressivamente. Esses controles não devem ser apresentados como concluídos antes de sua implementação e validação.", points: ["Backups e restauração", "Monitoramento", "Resposta a incidentes", "Revisão periódica de acessos"] },
];

export function SecurityCarousel() {
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const [paused, setPaused] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [live, setLive] = useState("");
  const [interacting, setInteracting] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; x: number } | null>(null);
  const locked = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = requestAnimationFrame(() => { setEnhanced(true); setPaused(reduced.current); });
    const visibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", visibility); };
  }, []);

  const move = useCallback((index: number, manual = true) => {
    if (locked.current) return;
    locked.current = true;
    window.setTimeout(() => { locked.current = false; }, reduced.current ? 0 : 380);
    const next = (index + slides.length) % slides.length;
    setActive(next);
    setDrag(0);
    if (manual) { setPaused(true); setLive(`Princípio ${next + 1} de ${slides.length}: ${slides[next].title}`); }
  }, []);

  const shouldRun = enhanced && !paused && !hovered && !focused && !hidden && !interacting;
  useEffect(() => {
    if (!shouldRun) return;
    const timer = window.setTimeout(() => move(active + 1, false), 6000);
    return () => window.clearTimeout(timer);
  }, [active, move, shouldRun]);

  function keyDown(event: React.KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") move(active - 1);
    else if (event.key === "ArrowRight") move(active + 1);
    else if (event.key === "Home") move(0);
    else move(slides.length - 1);
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (locked.current || (event.target as HTMLElement).closest(".carousel-controls")) return;
    pointer.current = { id: event.pointerId, x: event.clientX };
    setInteracting(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    setPaused(true);
  }
  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    setDrag(event.clientX - pointer.current.x);
  }
  function pointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = pointer.current;
    pointer.current = null;
    setInteracting(false);
    setDrag(0);
    if (!gesture || gesture.id !== event.pointerId) return;
    const distance = event.clientX - gesture.x;
    if (Math.abs(distance) > 45) move(active + (distance < 0 ? 1 : -1));
  }

  function pointerCancel() {
    pointer.current = null;
    setInteracting(false);
    setDrag(0);
  }

  const style = { "--slide-index": active, "--drag-x": `${drag}px` } as CSSProperties;
  return (
    <div ref={root} className={`security-slider${enhanced ? " is-enhanced" : ""}${drag ? " is-dragging" : ""}`} tabIndex={0} aria-label="Princípios de segurança" onKeyDown={keyDown} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerCancel}>
      <div className="security-slider-viewport"><div className="security-slider-track" style={style}>{slides.map((slide, index) => <article key={slide.title} className="security-slide" aria-hidden={enhanced && index !== active}><div><span className="security-slide-number">0{index + 1}</span><span className="security-slide-class">{slide.classification}</span></div><h3>{slide.title}</h3><p>{slide.body}</p><ul>{slide.points.map((point) => <li key={point}>{point}</li>)}</ul></article>)}</div></div>
      <div className="carousel-controls"><button type="button" onClick={() => move(active - 1)} aria-label="Princípio anterior"><ArrowIcon className="arrow-back" /></button><button type="button" onClick={() => { setPaused((value) => { if (value) setFocused(false); return !value; }); }} aria-label={paused ? "Retomar rotação automática" : "Pausar rotação automática"}>{paused ? "Reproduzir" : "Pausar"}</button><span>{active + 1} de {slides.length}</span><button type="button" onClick={() => move(active + 1)} aria-label="Próximo princípio"><ArrowIcon /></button></div>
      <div className="carousel-dots" role="group" aria-label="Selecionar princípio">{slides.map((slide, index) => <button key={slide.title} type="button" aria-label={`Ir ao princípio ${index + 1}`} aria-current={active === index ? "true" : undefined} onClick={() => move(index)} />)}</div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{live}</p>
    </div>
  );
}
