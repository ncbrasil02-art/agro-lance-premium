import { useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Radio, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getOptimizedImageUrl } from "@/utils/image-optimization";
import { Countdown } from "@/components/auctions/countdown";
import { formatBRL } from "@/utils/format";
import { Badge } from "@/components/ui/badge";

interface HeroProps {
  siteInfo: any;
  nextEvent: any;
  customTexts: any;
  stats: any;
  homepageSettings?: any;
}

const HeroSlider = ({ 
  backgrounds = [], 
  phrases = [], 
  opacity = 50, 
  blur = 0,
  duration = 6000,
  effect = 'fade',
  className
}: { 
  backgrounds: string[], 
  phrases: string[], 
  opacity: number, 
  blur: number,
  duration?: number,
  effect?: 'fade' | 'zoom' | 'slide' | 'kenburns' | 'none',
  className?: string
}) => {
  const [index, setIndex] = useState(0);
  const [vw, setVw] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setVw(window.innerWidth), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  // Bucket viewport into a handful of widths so the CDN cache stays warm.
  const targetWidth = vw <= 640 ? 768 : vw <= 1024 ? 1280 : vw <= 1536 ? 1600 : 1920;
  
  const images = backgrounds.length > 0 ? backgrounds : ["https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"];
  const maxIndex = Math.max(images.length, phrases.length);

  useEffect(() => {
    if (maxIndex <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % maxIndex);
    }, Math.max(1500, duration));
    return () => clearInterval(interval);
  }, [maxIndex, duration]);

  const currentImage = images[index % images.length] || images[0];

  const variants = {
    fade:     { initial: { opacity: 0 },                 animate: { opacity: 1 }, exit: { opacity: 0 } },
    zoom:     { initial: { opacity: 0, scale: 1.1 },     animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } },
    slide:    { initial: { opacity: 0, x: 60 },          animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -60 } },
    kenburns: { initial: { opacity: 0 },                 animate: { opacity: 1 }, exit: { opacity: 0 } },
    none:     { initial: { opacity: 1 },                 animate: { opacity: 1 }, exit: { opacity: 1 } },
  } as const;
  const v = variants[effect] ?? variants.fade;
  const useKen = effect === 'kenburns' || effect === 'fade';
  const currentPhrase = phrases[index % phrases.length];

  // Preload upcoming image (optimized variant) to avoid flash on transition
  useEffect(() => {
    if (images.length <= 1) return;
    const next = images[(index + 1) % images.length];
    if (!next) return;
    const img = new Image();
    img.decoding = "async";
    img.src = getOptimizedImageUrl(next, { width: targetWidth, quality: 75 });
  }, [index, images, targetWidth]);

  return (
    <div className="absolute inset-0 z-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={v.initial}
          animate={v.animate}
          exit={v.exit}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
           <div className="absolute inset-0 overflow-hidden">
             <motion.div
               initial={useKen ? { scale: 1.15, x: index % 2 === 0 ? -20 : 20 } : { scale: 1, x: 0 }}
               animate={useKen ? { scale: 1, x: 0 } : { scale: 1, x: 0 }}
               transition={{ duration: useKen ? 7 : 0, ease: "easeOut" }}
               className="absolute inset-0"
               style={{ opacity: opacity / 100, filter: `blur(${blur}px)` }}
             >
               <OptimizedImage 
                 src={currentImage} 
                 alt="Hero Background" 
                 width={targetWidth}
                 quality={index === 0 ? 80 : 75}
                 className="h-full w-full object-cover"
                 priority="high"
                 loading="eager"
                 fetchPriority="high"
                 decoding="async"
                 disablePlaceholder
               />
             </motion.div>
           </div>
          
          {currentPhrase && (
            <div className={cn("absolute inset-0 z-20 flex items-center px-4 md:px-20 pt-40 md:pt-0 pointer-events-none", className)}>
              <motion.div
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-4xl md:text-7xl font-extralight tracking-[0.25em] uppercase text-white/90 max-w-5xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] leading-tight italic"
              >
                {typeof currentPhrase === 'string' && currentPhrase.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                    className={cn(i % 3 === 0 ? "text-gold/90" : "text-white/90")}
                  >
                    {word}{" "}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const EliteHero = ({ siteInfo, nextEvent, customTexts, stats, homepageSettings }: HeroProps) => {
  const isMobileMode = homepageSettings?.mobile_mode_enabled;
  
  return (
    <section className={cn(
      "relative overflow-hidden flex items-center",
       isMobileMode ? "min-h-[80vh] pt-10" : "min-h-[95vh]"
    )}>
      <HeroSlider 
        backgrounds={homepageSettings?.hero_backgrounds || []} 
        phrases={customTexts?.hero_phrases || []}
        opacity={homepageSettings?.hero_bg_opacity ?? 50} 
        blur={homepageSettings?.hero_bg_blur ?? 0} 
        duration={homepageSettings?.hero_slide_duration ?? 6000}
        effect={homepageSettings?.hero_slide_effect ?? 'fade'}
      />
      
      <div className="absolute inset-0 z-1 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 z-1 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className={cn("container relative z-10 mx-auto px-4 py-20", isMobileMode && "py-10")}>
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-6 bg-gold/10 text-gold border-gold/20 px-4 py-1.5 uppercase tracking-widest text-[10px] font-black animate-pulse">
            <Sparkles className="h-3 w-3 mr-2" />
            A nova era dos leilões de elite
          </Badge>
          
           <div className="mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tighter uppercase"
              >
               {customTexts?.hero_title || (
                 <span className="flex flex-wrap items-baseline gap-x-3">
                   <span className="text-emerald-bright">
                     {siteInfo?.name && typeof siteInfo.name === 'string' ? siteInfo.name.split(' ')[0] : "NC"}
                   </span>
                   <span className="text-gradient-gold">
                     {siteInfo?.name && typeof siteInfo.name === 'string' ? siteInfo.name.split(' ').slice(1).join(' ') : "Agro Leilões"}
                   </span>
                 </span>
               )}
              </motion.h1>
           </div>
          
          <p className="text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-medium italic">
            {customTexts?.hero_subtitle || "Curadoria genética de excelência e tecnologia de ponta para o agronegócio global."}
          </p>

          <div className="flex flex-wrap gap-4 mb-16">
            <a href={customTexts?.hero_cta_primary_url || "/ao-vivo"}>
              <Button size="lg" className="bg-gold-gradient text-emerald-deep font-black uppercase tracking-wider px-8 h-14 hover:scale-105 transition-transform shadow-gold">
                <Radio className="mr-2 h-4 w-4 animate-pulse" />
                {customTexts?.hero_cta_primary_label || "Assista Agora"}
              </Button>
            </a>
            <a href={customTexts?.hero_cta_secondary_url || "/eventos"}>
              <Button size="lg" variant="outline" className="border-gold/50 text-gold hover:bg-gold-gradient hover:text-emerald-deep hover:border-transparent font-black uppercase tracking-widest h-14 px-8 rounded-none transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-gold/20 hover:scale-105">
                {customTexts?.hero_cta_secondary_label || "Catálogo Completo"}
              </Button>
            </a>
          </div>

          <div className="flex flex-col gap-12">
            {nextEvent && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="relative max-w-2xl group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-gold/40 via-gold-bright/60 to-gold/40 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 p-1 rounded-[2.1rem] shadow-2xl">
                   <div className="bg-background/40 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      <Badge className="bg-gold/20 text-gold border-gold/30 mb-3 px-3 py-1 text-[10px] font-black uppercase tracking-widest animate-pulse">Próximo Evento</Badge>
                      <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white leading-none mb-1">{nextEvent.name}</h3>
                      <div className="flex items-center gap-2 text-gold/60 text-[10px] font-bold uppercase tracking-widest">
                        <Calendar className="h-3 w-3" />
                        {new Date(nextEvent.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Inicia em</span>
                      <Countdown endsAt={nextEvent.date} variant="segmented" />
                    </div>
                    <Link to="/eventos/$eventSlug" params={{ eventSlug: nextEvent.slug }}>
                      <Button size="lg" className="bg-gold-gradient text-emerald-deep font-black uppercase tracking-widest h-16 px-8 rounded-2xl shadow-gold hover:scale-105 transition-transform">
                        PARTICIPAR
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

             <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12 max-w-4xl">
               <div>
                 <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1 opacity-60">{stats.labels?.totalSold || "Volume Negociado"}</div>
                 <div className="text-3xl font-black tracking-tighter text-white">{formatBRL(stats.totalSold || 184500000)}</div>
               </div>
               <div>
                 <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1 opacity-60">{stats.labels?.totalAnimals || "Animais Registrados"}</div>
                 <div className="text-3xl font-black tracking-tighter text-white">{(stats.totalAnimals || 12847).toLocaleString()}</div>
               </div>
               <div>
                 <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1 opacity-60">{stats.labels?.totalUsers || "Base de Investidores"}</div>
                 <div className="text-3xl font-black tracking-tighter text-white">{(stats.totalUsers || 38420).toLocaleString()}</div>
               </div>
               <div>
                 <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1 opacity-60">{stats.labels?.activeEvents || "Eventos Ativos"}</div>
                 <div className="text-3xl font-black tracking-tighter text-white">{(stats.activeEvents || 14).toLocaleString()}</div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ModernHero = EliteHero;
export const TraditionalHero = EliteHero;
export const EventsHero = EliteHero;
export const NewsHero = EliteHero;
export const CreativeHero = EliteHero;
