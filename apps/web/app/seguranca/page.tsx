import type { Metadata } from "next";
import { SecurityPage } from "@/components/public/security-page";
import { SectionReveals } from "@/components/public/section-reveals";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
export const metadata: Metadata = { title: "Segurança e privacidade planejadas | JurisVia", description: "Conheça os princípios de segurança e privacidade planejados para o JurisVia, ainda sujeitos a implementação e validação." };
export default function Seguranca() { return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><SiteHeader /><main id="conteudo" tabIndex={-1}><SectionReveals /><SecurityPage /></main><SiteFooter /></>; }
