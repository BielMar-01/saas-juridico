import type { Metadata } from "next";
import { ResourcesPage } from "@/components/public/resources-page";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

export const metadata: Metadata = {
  title: "Recursos planejados | JurisVia",
  description: "Conheça a visão planejada para organizar clientes, casos, processos, documentos, prazos, equipe e comunicação com o cliente.",
  openGraph: {
    title: "Recursos planejados | JurisVia",
    description: "Uma visão planejada da gestão jurídica com clareza e controle.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Recursos() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1}><ResourcesPage /></main>
      <SiteFooter />
    </>
  );
}
