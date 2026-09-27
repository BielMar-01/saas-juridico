import {PageJsonLd} from "@/components/public/page-json-ld";
import {pageMetadata} from "@/lib/seo";
import {PlansPage} from "@/components/public/plans-page";
import {SectionReveals} from "@/components/public/section-reveals";
import {SiteFooter} from "@/components/public/site-footer";
import {SiteHeader} from "@/components/public/site-header";
export const metadata=pageMetadata("Planos demonstrativos","Compare referências demonstrativas de planos enquanto a oferta comercial ainda está em validação.","/planos");
export default function Page(){return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><SiteHeader/><main id="conteudo" tabIndex={-1}><SectionReveals/><PlansPage/></main><PageJsonLd name="Planos demonstrativos" description="Referências comerciais demonstrativas." path="/planos"/><SiteFooter/></>}
