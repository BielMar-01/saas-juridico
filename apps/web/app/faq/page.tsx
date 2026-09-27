import {PageJsonLd} from "@/components/public/page-json-ld";
import {pageMetadata} from "@/lib/seo";
import {FaqPage} from "@/components/public/faq-page";
import {SectionReveals} from "@/components/public/section-reveals";
import {SiteFooter} from "@/components/public/site-footer";
import {SiteHeader} from "@/components/public/site-header";
import {allFaqItems} from "@/lib/public-site";
export const metadata=pageMetadata("Perguntas frequentes","Respostas sobre produto, segurança, portal do cliente, implantação, planos e contato do JurisVia.","/faq");
const faqJsonLd={"@context":"https://schema.org","@type":"FAQPage",mainEntity:allFaqItems.map(item=>({"@type":"Question",name:item.question,acceptedAnswer:{"@type":"Answer",text:item.answer}}))};
export default function Page(){return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><SiteHeader/><main id="conteudo" tabIndex={-1}><SectionReveals/><FaqPage/></main><PageJsonLd name="Perguntas frequentes" description="Respostas sobre a proposta." path="/faq"/><SiteFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqJsonLd).replace(/</g,"\\u003c")}}/></>}
