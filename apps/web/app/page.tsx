import {PageJsonLd} from "@/components/public/page-json-ld";
import { pageMetadata } from "@/lib/seo";
import {
  ClaritySection,
  FaqSection,
  FinalCtaSection,
  FlowSection,
  HeroSection,
  PlatformSection,
  RoutineSection,
  SecuritySection,
} from "@/components/public/home-sections";
import { SiteFooter } from "@/components/public/site-footer";
import { SectionReveals } from "@/components/public/section-reveals";
import { SiteHeader } from "@/components/public/site-header";

export const metadata = pageMetadata("Gestão jurídica com clareza", "Uma proposta para organizar a rotina do escritório e deixar cada próximo passo claro.", "/");

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1}>
        <SectionReveals />
        <div id="inicio" className="anchor-target" />
        <HeroSection />
        <RoutineSection />
        <PlatformSection />
        <ClaritySection />
        <FlowSection />
        <SecuritySection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <PageJsonLd name="Gestão jurídica com clareza" description="Proposta pública do JurisVia." path="/"/><SiteFooter />
    </>
  );
}
