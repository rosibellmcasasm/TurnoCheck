import { Header } from "@/components/app/landing/Header";
import { Hero } from "@/components/app/landing/Hero";
import { Problema } from "@/components/app/landing/Problema";
import { Agitacion } from "@/components/app/landing/Agitacion";
import { Solucion } from "@/components/app/landing/Solucion";
import { AppPorDentro } from "@/components/app/landing/AppPorDentro";
import { Oferta } from "@/components/app/landing/Oferta";
import { Garantia } from "@/components/app/landing/Garantia";
import { Faq } from "@/components/app/landing/Faq";
import { CtaFinal } from "@/components/app/landing/CtaFinal";
import { Footer } from "@/components/app/landing/Footer";
import { StickyMobileCta } from "@/components/app/landing/StickyMobileCta";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background pb-16 sm:pb-0">
      <Header />
      <main className="flex-1">
        <Hero />
        <Problema />
        <Agitacion />
        <Solucion />
        <AppPorDentro />
        <Oferta />
        <Garantia />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />
      <StickyMobileCta />
    </div>
  );
}
