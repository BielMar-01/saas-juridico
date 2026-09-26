"use client";
import { useEffect } from "react";
export function SectionReveals() { useEffect(() => { const sections = document.querySelectorAll<HTMLElement>("main > section"); const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduced) {
    sections.forEach(s => s.classList.add("reveal-visible"));
    return;
} const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) {
    entry.target.classList.add("reveal-visible");
    observer.unobserve(entry.target);
} }), { threshold: .08, rootMargin: "0px 0px -40px" }); sections.forEach(s => { s.classList.add("reveal-pending"); observer.observe(s); }); return () => observer.disconnect(); }, []); return null; }
