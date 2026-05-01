
export const EventsHero = ({ siteInfo, nextEvent, customTexts, homepageSettings }: HeroProps) => {
  const isMobileMode = homepageSettings?.mobile_mode_enabled;
  return (
    <section className={cn(
      "relative min-h-[90vh] flex items-center bg-black text-white overflow-hidden",
      isMobileMode && "min-h-[70vh] pt-10"
    )}>
      <div className="absolute inset-0 z-0">
        <HeroBackground 
          backgrounds={homepageSettings?.hero_backgrounds} 
          opacity={30} 
          blur={5} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="h-px w-12 bg-gold/50" />
            <span className="text-gold uppercase tracking-[0.5em] font-black text-xs">Agenda de Eventos</span>
            <div className="h-px w-12 bg-gold/50" />
          </motion.div>

          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8 leading-none max-w-4xl">
            {customTexts?.hero_title || "Os Maiores Encontros da Genética Mundial"}
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl font-medium italic mb-12">
            {customTexts?.hero_subtitle || "Acompanhe nossa agenda completa e não perca nenhuma oportunidade de investimento."}
          </p>
        </div>

        {nextEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid lg:grid-cols-2 gap-8 items-stretch"
          >
            <div className="relative group overflow-hidden rounded-[3rem] border border-white/10 aspect-video lg:aspect-auto">
              <OptimizedImage 
                src={nextEvent.cover} 
                alt={nextEvent.name} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-12 flex flex-col justify-end">
                <Badge className="bg-gold text-black w-fit mb-4 uppercase font-black">Destaque</Badge>
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4 leading-none">{nextEvent.name}</h2>
                <p className="text-white/70 font-medium mb-8 max-w-md">{nextEvent.description}</p>
                <Link to="/eventos/$eventSlug" params={{ eventSlug: nextEvent.slug }}>
                  <Button className="bg-white text-black font-black uppercase rounded-full h-14 px-8 hover:bg-gold transition-colors">
                    Ver Detalhes do Evento
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 flex flex-col justify-center gap-12">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-gold uppercase tracking-[0.4em]">Contagem Regressiva</span>
                <Countdown endsAt={nextEvent.date} variant="segmented" />
              </div>
              
              <div className="grid grid-cols-2 gap-8 py-12 border-y border-white/10">
                <div className="space-y-1">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Cidade/UF</span>
                  <div className="text-xl font-bold">{nextEvent.city} - {nextEvent.state}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Início</span>
                  <div className="text-xl font-bold">{new Date(nextEvent.date).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Link to="/ao-vivo" className="flex-1">
                  <Button className="w-full bg-gold-gradient text-emerald-deep font-black uppercase h-16 rounded-2xl shadow-gold hover:scale-105 transition-transform">
                    <Radio className="mr-2 h-4 w-4" /> Ao Vivo
                  </Button>
                </Link>
                <Link to="/eventos">
                  <Button variant="outline" className="h-16 px-8 rounded-2xl border-white/20 hover:bg-white/10 font-black uppercase">
                    Agenda Completa
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

export const NewsHero = ({ siteInfo, nextEvent, customTexts, homepageSettings }: HeroProps) => {
  const isMobileMode = homepageSettings?.mobile_mode_enabled;
  return (
    <section className={cn(
      "relative min-h-[90vh] bg-[#fdfbf7] flex items-center overflow-hidden",
      isMobileMode && "min-h-[70vh] pt-10"
    )}>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#f4f1ea] -z-0" />
      <div className="absolute top-20 right-20 text-[20rem] font-black text-black/5 select-none pointer-events-none uppercase italic -rotate-90">
        News
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 flex flex-col lg:flex-row items-center gap-20">
        <div className="lg:w-1/2 space-y-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Badge className="bg-black text-white px-4 py-1.5 rounded-none font-serif italic text-lg capitalize tracking-normal">
              Editorial Agro
            </Badge>
            <h1 className="text-6xl md:text-8xl font-serif font-black leading-[0.9] text-[#1a1a1a]">
              {customTexts?.hero_title || (
                <>
                  O Futuro do <br />
                  <span className="italic text-[#8b6b45]">Agronegócio</span> <br />
                  em Foco
                </>
              )}
            </h1>
            <p className="text-xl text-black/60 font-medium leading-relaxed max-w-lg border-l-2 border-[#8b6b45] pl-6">
              {customTexts?.hero_subtitle || "Informação de qualidade, curadoria genética e as principais tendências que moldam o mercado rural brasileiro."}
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-6">
            <Link to="/noticias">
              <Button className="bg-[#1a1a1a] text-white rounded-none h-16 px-10 font-bold uppercase tracking-widest hover:bg-[#8b6b45] transition-colors">
                Explorar Notícias
              </Button>
            </Link>
            <Link to="/ao-vivo">
              <Button variant="outline" className="border-black text-black rounded-none h-16 px-10 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                TV Agro Online
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:w-1/2 relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="bg-white p-6 shadow-[40px_40px_80px_rgba(0,0,0,0.1)] relative z-10">
              <div className="aspect-[4/5] overflow-hidden relative">
                <HeroBackground backgrounds={homepageSettings?.hero_backgrounds} opacity={100} blur={0} />
              </div>
              <div className="pt-8 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#8b6b45]">
                  <span>Capa da Semana</span>
                  <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#1a1a1a]">Transformação Digital: O novo capítulo da pecuária de corte no Brasil.</h3>
              </div>
            </div>
            
            {/* Floating decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#8b6b45]/10 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-gold/10 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export const CreativeHero = ({ siteInfo, nextEvent, customTexts, homepageSettings }: HeroProps) => {
  const isMobileMode = homepageSettings?.mobile_mode_enabled;
  return (
    <section className={cn(
      "relative min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white overflow-hidden",
      isMobileMode && "min-h-[80vh] pt-10"
    )}>
      {/* Interactive floating shapes */}
      <div className="absolute inset-0 z-0 opacity-40">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-white/10 rounded-full"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "circOut" }}
          className="relative inline-block"
        >
          <div className="absolute -inset-10 bg-gold/20 rounded-full blur-[100px] animate-pulse" />
          <h1 className="text-7xl md:text-[14rem] font-black uppercase tracking-[-0.05em] leading-none mb-4 mix-blend-difference">
            {customTexts?.hero_title || (
              <>
                PURE <br />
                <span className="text-gold italic font-signature normal-case tracking-normal">Genetics</span>
              </>
            )}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-2xl text-white/50 max-w-3xl mx-auto font-light tracking-widest uppercase mb-16"
        >
          {customTexts?.hero_subtitle || "The ultimate intersection between art, technology and livestock excellence."}
        </motion.p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link to="/cadastro">
              <Button size="lg" className="bg-white text-black font-black uppercase h-20 px-16 rounded-none text-xl tracking-[0.2em] shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                Join The Elite
              </Button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Link to="/ao-vivo">
              <Button variant="ghost" className="h-20 px-16 font-black uppercase text-xl tracking-[0.2em] border border-white/20 rounded-none hover:bg-white hover:text-black">
                Experience Live
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Floating Design Pieces */}
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-20 w-64 h-64 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center hidden lg:flex"
      >
        <div className="text-center">
          <div className="text-5xl font-black text-gold mb-1">98%</div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">Success Rate</div>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-40 left-20 w-48 h-48 bg-gold/5 backdrop-blur-3xl border border-gold/10 rounded-full flex items-center justify-center hidden lg:flex"
      >
        <div className="text-center">
          <Trophy className="h-12 w-12 text-gold mx-auto mb-2" />
          <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">Premium Class</div>
        </div>
      </motion.div>
    </section>
  );
};
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
      "relative min-h-screen lg:grid lg:grid-cols-2 bg-emerald-deep overflow-hidden",
      isMobileMode && "min-h-0 pt-6"
    )}>
      {/* Floating abstract patterns for "Agro" feel */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      <div className="relative flex items-center p-8 md:p-24 text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 w-full"
        >
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            src={siteInfo?.logo_url || "https://ccrslflbnxdazvadjlvj.supabase.co/storage/v1/object/public/public_assets/logo-0.9588475542778425.png"} 
            alt="Logo" 
            className="h-20 object-contain mb-16 invert brightness-0 grayscale"
          />
          
          <HeroPhrase 
            phrases={customTexts?.hero_phrases} 
            className="text-7xl md:text-[9rem] font-black tracking-tighter uppercase leading-[0.8] mb-12"
            defaultTitle={
              <h1 className="drop-shadow-2xl">
                {customTexts?.hero_title || (
                  <>
                    TRADIÇÃO <br />
                    <span className="text-gold italic font-serif normal-case tracking-normal">e Resultado</span>
                  </>
                )}
              </h1>
            }
          />
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-white/70 max-w-lg mb-16 leading-relaxed font-medium italic border-l-4 border-gold pl-8"
          >
            {customTexts?.hero_subtitle || "Unindo o campo à tecnologia com a confiança de quem entende de genética animal."}
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-6">
            <Link to="/ao-vivo">
              <Button className="bg-gold text-emerald-deep h-16 px-12 font-black uppercase tracking-[0.2em] italic rounded-none hover:bg-white transition-colors shadow-2xl">
                <Radio className="mr-2 h-5 w-5 animate-pulse" />
                Acompanhar ao vivo
              </Button>
            </Link>
            <EventRequestDialog />
          </div>
        </motion.div>
      </div>
      
      <div className="relative min-h-[500px] lg:min-h-full overflow-hidden group">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="h-full w-full"
        >
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
              className="h-full w-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-[3s]" 
            />
          )}
        </motion.div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-deep via-transparent to-transparent z-1" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/80 via-transparent to-transparent z-1" />
        
        {nextEvent && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="absolute bottom-12 left-12 right-12 bg-white/10 backdrop-blur-2xl p-1 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/20"
          >
            <div className="bg-white p-10 rounded-[1.8rem] flex items-center justify-between gap-8">
              <div className="flex-1">
                <Badge className="bg-emerald-deep text-white mb-4 rounded-none font-black uppercase tracking-widest px-4">Próximo Leilão</Badge>
                <h3 className="text-4xl font-black text-emerald-deep uppercase tracking-tighter leading-none">{nextEvent.name}</h3>
                <div className="flex items-center gap-4 mt-4 text-emerald-deep/60 text-xs font-black uppercase tracking-widest">
                  <Calendar className="h-4 w-4" />
                  {new Date(nextEvent.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-2 pr-8 border-r border-emerald-deep/10">
                <span className="text-[10px] font-black text-emerald-deep/40 uppercase tracking-[0.3em]">Cronômetro</span>
                <Countdown endsAt={nextEvent.date} variant="segmented" />
              </div>
              <Link to="/eventos/$eventSlug" params={{ eventSlug: nextEvent.slug }}>
                <Button size="icon" className="h-20 w-20 rounded-full bg-gold text-emerald-deep hover:bg-emerald-deep hover:text-white transition-all hover:scale-110 shadow-xl">
                  <ArrowRight className="h-8 w-8" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
