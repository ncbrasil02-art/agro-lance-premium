import { useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Radio, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
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
  className
}: { 
  backgrounds: string[], 
  phrases: string[], 
  opacity: number, 
  blur: number,
  className?: string
}) => {
  const [index, setIndex] = useState(0);
  
  const images = backgrounds.length > 0 ? backgrounds : ["https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"];
  const maxIndex = Math.max(images.length, phrases.length);

  useEffect(() => {
    if (maxIndex <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % maxIndex);
    }, 6000);
    return () => clearInterval(interval);
  }, [maxIndex]);

  const currentImage = images[index % images.length] || images[0];
  const currentPhrase = phrases[index % phrases.length];

  return (
    <div className="absolute inset-0 z-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
           <div className="absolute inset-0 overflow-hidden">
             <motion.div
               initial={{ scale: 1.15, x: index % 2 === 0 ? -20 : 20 }}
               animate={{ scale: 1, x: 0 }}
               transition={{ duration: 7, ease: "easeOut" }}
               className="absolute inset-0"
               style={{ opacity: opacity / 100, filter: `blur(${blur}px)` }}
             >
               <OptimizedImage 
                 src={currentImage} 
                 alt="Hero Background" 
                 width={1920} 
                 className="h-full w-full object-cover" 
               />
             </motion.div>
             {/* Elegant Overlay Sweep */}
             <motion.div 
               initial={{ x: "-100%" }}
               animate={{ x: "100%" }}
               transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
               className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
             />
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
                {currentPhrase.split(" ").map((word, i) => (
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
      isMobileMode ? "min-h-[70vh] pt-10" : "min-h-[85vh]"
    )}>
      <HeroSlider 
        backgrounds={homepageSettings?.hero_backgrounds || []} 
        phrases={customTexts?.hero_phrases || []}
        opacity={homepageSettings?.hero_bg_opacity ?? 50} 
        blur={homepageSettings?.hero_bg_blur ?? 0} 
      />
      
      <div className="absolute inset-0 z-1 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 z-1 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className={cn("container relative z-10 mx-auto px-4 py-20", isMobileMode && "py-10")}>
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-6 bg-gold/10 text-gold border-gold/20 px-4 py-1.5 uppercase tracking-widest text-[10px] font-black animate-pulse">
            <Sparkles className="h-3 w-3 mr-2" />
            A nova era dos leilões de elite
          </Badge>
          
           <div className="mb-8 min-h-[140px] md:min-h-[250px]">
             <motion.h1 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1, ease: "easeOut" }}
               className="text-6xl md:text-9xl font-black leading-none tracking-tighter uppercase italic drop-shadow-2xl"
             >
              {customTexts?.hero_title || (
                <div className="flex flex-col gap-0 items-start">
                   <motion.span 
                     initial={{ x: -50, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: 0.2, duration: 0.8 }}
                     className="text-gradient-gold font-signature normal-case text-8xl md:text-[11rem] -mb-10 block drop-shadow-xl leading-none"
                   >
                     {siteInfo?.name?.split(' ')?.[0]}
                   </motion.span>
                   <motion.span 
                     initial={{ x: 50, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: 0.4, duration: 0.8 }}
                     className="block pl-4 tracking-[-0.05em] uppercase font-black text-foreground"
                   >
                     {siteInfo?.name?.split(' ')?.slice(1)?.join(' ')}
                   </motion.span>
                </div>
              )}
             </motion.h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-medium italic">
            {customTexts?.hero_subtitle || "Curadoria genética de excelência e tecnologia de ponta para o agronegócio global."}
          </p>

          <div className="flex flex-wrap gap-4 mb-16">
            <Link to="/ao-vivo">
              <Button size="lg" className="bg-gold-gradient text-emerald-deep font-black uppercase tracking-wider px-8 h-14 hover:scale-105 transition-transform shadow-gold">
                <Radio className="mr-2 h-4 w-4 animate-pulse" />
                Assista Agora
              </Button>
            </Link>
              <Link to="/eventos">
                <Button size="lg" variant="outline" className="border-gold/50 text-gold hover:bg-gold-gradient hover:text-emerald-deep hover:border-transparent font-black uppercase tracking-widest h-14 px-8 rounded-none transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:shadow-gold/20 hover:scale-105">
                  Catálogo Completo
                </Button>
              </Link>
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
                  <div className="bg-background/40 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
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
                <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1 opacity-60">Volume Negociado</div>
                <div className="text-2xl font-black tracking-tighter">{formatBRL(stats.totalSold)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1 opacity-60">Animais Registrados</div>
                <div className="text-2xl font-black tracking-tighter">{stats.totalAnimals.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1 opacity-60">Base de Investidores</div>
                <div className="text-2xl font-black tracking-tighter">{stats.totalUsers.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1 opacity-60">Eventos Ativos</div>
                <div className="text-2xl font-black tracking-tighter">{stats.activeEvents.toLocaleString()}</div>
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
