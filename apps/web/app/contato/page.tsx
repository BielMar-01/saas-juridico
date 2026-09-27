import type { Metadata } from "next";
import { ContactPage } from "@/components/public/contact-page";
import { SectionReveals } from "@/components/public/section-reveals";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
export const metadata:Metadata={title:"Contato | JurisVia",description:"Conheça a prévia do futuro canal de contato do JurisVia. Nenhum dado é enviado ou armazenado."};
export default function Contato(){return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><SiteHeader/><main id="conteudo" tabIndex={-1}><SectionReveals/><ContactPage/></main><SiteFooter/></>}
