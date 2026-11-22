import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Countdown } from "@/components/auctions/countdown";
import cattlePhoto from "@/assets/catalog/cattle-1.webp.asset.json";
import horsePhoto from "@/assets/catalog/horse-1.webp.asset.json";

interface HeroProps { siteInfo: any; nextEvent: any; customTexts: any; stats: any; homepageSettings?: any }

export const EliteHero = ({ siteInfo, nextEvent, customTexts, homepageSettings }: HeroProps) => {
  const settings = homepageSettings ?? {};
  const texts = customTexts ?? {};
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const backgrounds: string[] = Array.isArray(settings.hero_backgrounds) && settings.hero_backgrounds.some((v: unknown) => typeof v === "string" && v.length > 0)
    ? settings.hero_backgrounds.filter((v: unknown) => typeof v === "string" && v.length > 0) : [cattlePhoto.url, horsePhoto.url];
  const phrases: string[] = Array.isArray(texts.hero_phrases) ? texts.hero_phrases.filter((v: unknown) => typeof v === "string" && v.length > 0) : [];
  const count = Math.max(backgrounds.length, phrases.length);
  const duration = Math.max(1500, Number(settings.hero_slide_duration) || 6000);
  useEffect(() => {
    if (count < 2 || reducedMotion) return;
    const timer = setInterval(() => setIndex(v => (v + 1) % count), duration);
    return () => clearInterval(timer);
  }, [count, duration, reducedMotion]);
  const effect = reducedMotion ? "none" : settings.hero_slide_effect || "fade";
  const initial = effect === "slide" ? { opacity: 0, x: 40 } : effect === "zoom" ? { opacity: 0, scale: 1.05 } : { opacity: effect === "none" ? 1 : 0 };
  return (
    <section className="ranch-hero relative isolate overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div key={index} initial={initial} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: effect === "none" ? 1 : 0 }} transition={{ duration: effect === "none" ? 0 : 0.8 }} className="absolute inset-0 -z-20">
          <motion.div className="h-full w-full" animate={effect === "kenburns" ? { scale: [1, 1.05] } : { scale: 1 }} transition={{ duration: duration / 1000 }} style={{ opacity: Math.max(40, settings.hero_bg_opacity ?? 100) / 100, filter: `blur(${settings.hero_bg_blur ?? 0}px)` }}>
            <OptimizedImage src={backgrounds[index % backgrounds.length] || cattlePhoto.url} alt="Animal no pasto de uma fazenda — imagem ilustrativa do catálogo" width={1600} priority="high" loading="eager" fetchPriority="high" disablePlaceholder className="h-full w-full object-cover" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="ranch-hero-shade absolute inset-0 -z-10" />
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-hero-foreground"><Gavel className="h-4 w-4" /> Bovinos e cavalos · Leilões e venda direta</p>
          <h1 className="ranch-hero-title text-4xl font-bold leading-tight text-hero-foreground md:text-6xl">
            {texts.hero_title || siteInfo?.name || "NC Agro Leilões"}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-hero-foreground">{texts.hero_subtitle || "Escolha seu próximo animal com informação, organização e confiança."}</p>
          <p className="mt-4 min-h-12 max-w-xl text-base text-hero-foreground" aria-live="off">{phrases[index % Math.max(1, phrases.length)] || "Consulte os lotes, compare os animais e acompanhe os leilões abertos."}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={texts.hero_cta_primary_url || "/eventos"}><Button size="lg" className="h-12 rounded-md px-6 font-semibold"><Gavel className="mr-2 h-4 w-4" />{texts.hero_cta_primary_label || "Ver leilões e dar lance"}</Button></a>
            <a href={texts.hero_cta_secondary_url || "/compra-direta"}><Button size="lg" variant="outline" className="h-12 rounded-md border-hero-foreground/50 bg-background/20 px-6 text-hero-foreground hover:bg-background/40 hover:text-hero-foreground">{texts.hero_cta_secondary_label || "Animais à venda"}<ArrowRight className="ml-2 h-4 w-4" /></Button></a>
          </div>
          {backgrounds.length > 1 && <div className="mt-8 flex gap-2" role="group" aria-label="Fotos em destaque">{backgrounds.map((_, i) => <Button key={i} variant="ghost" size="icon" aria-label={`Ver foto ${i + 1}`} aria-pressed={index % backgrounds.length === i} onClick={() => setIndex(i)} className="h-8 w-8 rounded-sm text-hero-foreground"><span className={`h-1 w-5 ${index % backgrounds.length === i ? "bg-primary" : "bg-hero-foreground/50"}`} /></Button>)}</div>}
        </div>
      </div>
      {nextEvent && <div className="border-t border-hero-foreground/20 bg-background/90"><div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-5">
        <div><p className="text-xs font-semibold uppercase text-primary">Próximo leilão</p><h2 className="mt-1 text-lg font-semibold text-foreground">{nextEvent.name}</h2><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{new Date(nextEvent.date).toLocaleDateString("pt-BR")}</p></div>
        <Countdown endsAt={nextEvent.date} variant="segmented" />
        <Link to="/eventos/$eventSlug" params={{ eventSlug: nextEvent.slug }}><Button variant="outline">Ver os animais <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </div></div>}
    </section>
  );
};
export const ModernHero = EliteHero;
export const TraditionalHero = EliteHero;
export const EventsHero = EliteHero;
export const NewsHero = EliteHero;
export const CreativeHero = EliteHero;
