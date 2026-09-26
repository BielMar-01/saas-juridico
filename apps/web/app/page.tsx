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
import { SiteHeader } from "@/components/public/site-header";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1}>
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
      <SiteFooter />
    </>
  );
}
