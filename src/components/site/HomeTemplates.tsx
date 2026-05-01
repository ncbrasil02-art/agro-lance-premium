import { useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Radio, Sparkles, Bell, Trophy, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Countdown } from "@/components/auctions/countdown";
import { formatBRL } from "@/utils/format";
import { EventRequestDialog } from "@/components/auctions/EventRequestDialog";
import { Badge } from "@/components/ui/badge";

interface HeroProps {
  siteInfo: any;
  nextEvent: any;
  customTexts: any;
  stats: any;
  homepageSettings?: any;
}

const HeroBackground = ({ backgrounds, opacity, blur }: { backgrounds: string[], opacity: number, blur: number }) => {
  const [index, setIndex] = useState(0);
  const images = (backgrounds && backgrounds.length > 0) ? backgrounds : ["https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"];

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => setIndex(prev => (prev + 1) % images.length), 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="absolute inset-0 z-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={images[index]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: opacity / 100, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ filter: `blur(${blur}px)` }}
        >
          <OptimizedImage 
            src={images[index]} 
            alt="Hero Background" 
            width={1920} 
            className="h-full w-full object-cover" 
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const HeroPhrase = ({ phrases, defaultTitle, className }: { phrases: string[], defaultTitle: ReactNode, className?: string }) => {
  const [index, setIndex] = useState(0);
  const items = (phrases && phrases.length > 0) ? phrases : [];

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => setIndex(prev => (prev + 1) % items.length), 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return <>{defaultTitle}</>;

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {items[index]}
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
      isMobileMode ? "min-h-[60vh] pt-10" : "min-h-[85vh]"
    )}>
      <HeroBackground 
        backgrounds={homepageSettings?.hero_backgrounds} 
        opacity={homepageSettings?.hero_bg_opacity ?? 50} 
        blur={homepageSettings?.hero_bg_blur ?? 0} 
      />
      <div className="absolute inset-0 z-1 bg-gradient-to-r from-background via-background/80 to-transparent" />
      <div className="absolute inset-0 z-1 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className={cn("container relative z-10 mx-auto px-4 py-20", isMobileMode && "py-10")}>
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-6 bg-gold/10 text-gold border-gold/20 px-4 py-1.5 uppercase tracking-widest text-[10px] font-black animate-pulse">
            <Sparkles className="h-3 w-3 mr-2" />
            A nova era dos leilões de elite
          </Badge>
          
          <div className="mb-8">
            {customTexts?.hero_phrases && customTexts.hero_phrases.length > 0 ? (
              <HeroPhrase 
                phrases={customTexts.hero_phrases} 
                className="text-4xl md:text-6xl font-light tracking-[0.2em] uppercase text-gold/80 mb-4 h-20"
                defaultTitle={null}
              />
            ) : null}
            
            <h1 className="text-6xl md:text-9xl font-black leading-none tracking-tighter uppercase italic drop-shadow-2xl">
              {customTexts?.hero_title || (
                <div className="flex flex-col gap-0 items-start">
                  <span className="text-gradient-gold font-signature normal-case text-8xl md:text-[11rem] -mb-10 block drop-shadow-xl leading-none animate-in fade-in slide-in-from-left-8 duration-1000">
                    {siteInfo?.name?.split(' ')?.[0]}
                  </span>
                  <span className="block pl-4 tracking-[-0.05em] uppercase font-black text-foreground animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    {siteInfo?.name?.split(' ')?.slice(1)?.join(' ')}
                  </span>
                </div>
              )}
            </h1>
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/eventos">
                <Button size="lg" variant="outline" className="border-gold/50 text-gold hover:bg-gold/20 hover:border-gold font-black uppercase tracking-wider h-14 transition-all shadow-lg hover:shadow-gold/20">
                  Catálogo Completo
                </Button>
              </Link>
            </motion.div>
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
                <div className="text-2xl font-black tracking-tighter">{stats.activeEvents}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ModernHero = ({ siteInfo, nextEvent, customTexts, homepageSettings, stats }: HeroProps) => {
  const isMobileMode = homepageSettings?.mobile_mode_enabled;
  return (
    <section className={cn(
      "relative flex items-center justify-center overflow-hidden bg-background",
      isMobileMode ? "min-h-[75vh] pt-10" : "min-h-[95vh]"
    )}>
      <div className="absolute inset-0 z-0 opacity-20 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gold/10 rounded-full blur-[100px]"
            style={{
              width: Math.random() * 400 + 200,
              height: Math.random() * 400 + 200,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 50, -50, 0],
              y: [0, -50, 50, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {homepageSettings?.hero_backgrounds?.length > 0 ? (
        <HeroBackground 
          backgrounds={homepageSettings?.hero_backgrounds} 
          opacity={homepageSettings?.hero_bg_opacity ?? 15} 
          blur={homepageSettings?.hero_bg_blur ?? 2} 
        />
      ) : (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--gold)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      )}
      
      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-deep/5 border border-emerald-deep/20 text-emerald-deep text-[10px] font-black uppercase tracking-[0.3em] mb-12 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-deep animate-pulse" />
          Plataforma de Investimento Genético 4.0
        </motion.div>

        <HeroPhrase 
          phrases={customTexts?.hero_phrases} 
          className="text-6xl md:text-[10rem] font-black tracking-tighter uppercase mb-10 leading-[0.85] text-gradient-gold-modern"
          defaultTitle={
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="drop-shadow-2xl"
            >
              {customTexts?.hero_title || (
                <>
                  REVOLUCIONANDO O <br />
                  <span className="text-gradient-gold italic">AGRONEGÓCIO</span>
                </>
              )}
            </motion.h1>
          }
        />

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="max-w-2xl mx-auto text-lg md:text-2xl text-muted-foreground mb-16 font-medium leading-relaxed"
        >
          {customTexts?.hero_subtitle || "A mais avançada experiência de leilões digitais com lances em tempo real e segurança inabalável."}
        </motion.p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-24">
          <Link to="/cadastro" className="w-full md:w-auto">
            <Button size="lg" className="w-full md:w-auto bg-emerald-deep text-white h-16 px-12 rounded-full font-black uppercase tracking-widest shadow-2xl hover:shadow-emerald-deep/40 transition-all hover:scale-105">
              Começar agora
            </Button>
          </Link>
          <Link to="/ao-vivo" className="w-full md:w-auto">
            <Button size="lg" variant="ghost" className="w-full md:w-auto h-16 px-12 rounded-full font-black uppercase tracking-widest border border-emerald-deep/20 hover:bg-emerald-deep/5 text-emerald-deep backdrop-blur-sm">
              <Radio className="mr-2 h-5 w-5 text-live" />
              Ver Live
            </Button>
          </Link>
        </div>

        {nextEvent && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="max-w-5xl mx-auto group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-gold via-emerald-deep to-gold rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-background/80 backdrop-blur-3xl rounded-[2.8rem] p-1 border border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
              <div className="bg-background/40 rounded-[2.7rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="text-left flex-1">
                  <Badge variant="outline" className="border-gold/30 text-gold uppercase tracking-[0.4em] font-black text-[10px] mb-4">Próxima Oportunidade</Badge>
                  <h3 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">{nextEvent.name}</h3>
                  <div className="mt-4 flex items-center gap-4 text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    <Calendar className="h-4 w-4 text-gold" />
                    {new Date(nextEvent.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 px-8 border-x border-border/50">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">O leilão inicia em</div>
                  <Countdown endsAt={nextEvent.date} variant="segmented" />
                </div>
                <Link to="/eventos/$eventSlug" params={{ eventSlug: nextEvent.slug }}>
                  <Button className="bg-gold-gradient text-emerald-deep font-black uppercase italic tracking-tighter rounded-2xl h-16 px-10 shadow-gold hover:scale-105 transition-transform">
                    Ver Lotes
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export const TraditionalHero = ({ siteInfo, nextEvent, customTexts, homepageSettings }: HeroProps) => {
  const isMobileMode = homepageSettings?.mobile_mode_enabled;
  return (
    <section className={cn(
      "relative min-h-screen grid lg:grid-cols-2",
      isMobileMode && "min-h-0 pt-6"
    )}>
      <div className="relative flex items-center p-8 md:p-20 bg-emerald-deep text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="relative z-10">
          <img 
            src={siteInfo?.logo_url || "https://ccrslflbnxdazvadjlvj.supabase.co/storage/v1/object/public/public_assets/logo-0.9588475542778425.png"} 
            alt="Logo" 
            className="h-16 object-contain mb-12 invert brightness-0"
          />
          
          <HeroPhrase 
            phrases={customTexts?.hero_phrases} 
            className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] mb-8"
            defaultTitle={
              <h1>
                {customTexts?.hero_title || (
                  <>
                    TRADIÇÃO <br />
                    <span className="text-gold">E RESULTADO</span>
                  </>
                )}
              </h1>
            }
          />
          
          <p className="text-xl text-emerald-bright/80 max-w-md mb-12 leading-relaxed font-medium">
            {customTexts?.hero_subtitle || "Unindo o campo à tecnologia com a confiança de quem entende de genética animal."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/ao-vivo">
              <Button className="bg-gold text-emerald-deep h-14 px-8 font-black uppercase tracking-widest hover:bg-gold-bright">
                Acompanhar ao vivo
              </Button>
            </Link>
            <EventRequestDialog />
          </div>
        </div>
      </div>
      
      <div className="relative min-h-[400px] lg:min-h-full overflow-hidden">
        {homepageSettings?.hero_backgrounds?.length > 0 ? (
          <HeroBackground 
            backgrounds={homepageSettings?.hero_backgrounds} 
            opacity={homepageSettings?.hero_bg_opacity ?? 100} 
            blur={homepageSettings?.hero_bg_blur ?? 0} 
          />
        ) : (
          <OptimizedImage 
            src="https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80" 
            alt="Farm" 
            width={1200} 
            className="h-full w-full object-cover" 
          />
        )}
        <div className="absolute inset-0 z-1 bg-emerald-deep/20" />
        
        {nextEvent && (
          <div className="absolute bottom-10 left-10 right-10 bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border-l-8 border-gold">
            <div className="flex items-center justify-between gap-6">
              <div>
                <Badge className="bg-emerald-deep text-white mb-2">Próximo Leilão</Badge>
                <h3 className="text-2xl font-black text-emerald-deep uppercase tracking-tight">{nextEvent.name}</h3>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm font-bold">
                  <Calendar className="h-4 w-4" />
                  {new Date(nextEvent.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <Link to="/eventos/$eventSlug" params={{ eventSlug: nextEvent.slug }}>
                <Button size="icon" className="h-14 w-14 rounded-full bg-gold text-emerald-deep hover:scale-110 transition-transform">
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
