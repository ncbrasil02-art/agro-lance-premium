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
         
          <HeroPhrase 
            phrases={customTexts?.hero_phrases} 
            className="text-6xl md:text-8xl font-black leading-none tracking-tighter uppercase italic mb-6"
            defaultTitle={
              <h1>
                {customTexts?.hero_title || (
                  <>
                    <span className="text-gradient-gold">{siteInfo?.name?.split(' ')?.[0]}</span><br />
                    {siteInfo?.name?.split(' ')?.slice(1)?.join(' ')}
                  </>
                )}
              </h1>
            } 
          />
         
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
             <Button size="lg" variant="outline" className="border-gold/50 text-gold hover:bg-gold/10 font-black uppercase tracking-wider h-14">
               Catálogo Completo
             </Button>
           </Link>
         </div>
 
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10">
           <div>
             <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1">Volume Negociado</div>
             <div className="text-2xl font-black">{formatBRL(stats.totalSold)}</div>
           </div>
           <div>
             <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1">Animais Registrados</div>
             <div className="text-2xl font-black">{stats.totalAnimals.toLocaleString()}</div>
           </div>
           <div>
             <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1">Base de Investidores</div>
             <div className="text-2xl font-black">{stats.totalUsers.toLocaleString()}</div>
           </div>
           <div>
             <div className="text-[10px] uppercase font-black text-gold tracking-widest mb-1">Eventos Ativos</div>
             <div className="text-2xl font-black">{stats.activeEvents}</div>
           </div>
         </div>
       </div>
     </div>
    </section>
    );
  };
 
  export const ModernHero = ({ siteInfo, nextEvent, customTexts, homepageSettings }: HeroProps) => {
    const isMobileMode = homepageSettings?.mobile_mode_enabled;
    return (
      <section className={cn(
        "relative flex items-center justify-center overflow-hidden bg-background",
        isMobileMode ? "min-h-[70vh] pt-10" : "min-h-[90vh]"
      )}>
      {homepageSettings?.hero_backgrounds?.length > 0 ? (
        <HeroBackground 
          backgrounds={homepageSettings?.hero_backgrounds} 
          opacity={homepageSettings?.hero_bg_opacity ?? 10} 
          blur={homepageSettings?.hero_bg_blur ?? 0} 
        />
      ) : (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--gold)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      )}
     
     <div className="container relative mx-auto px-4 text-center">
       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-deep/5 border border-emerald-deep/10 text-emerald-deep text-[10px] font-bold uppercase tracking-widest mb-8">
         <div className="w-1.5 h-1.5 rounded-full bg-emerald-deep animate-ping" />
         Plataforma de Investimento Genético
       </div>
 
        <HeroPhrase 
          phrases={customTexts?.hero_phrases} 
          className="text-5xl md:text-9xl font-black tracking-tighter uppercase mb-8 leading-[0.9]"
          defaultTitle={
            <h1>
              {customTexts?.hero_title || (
                <>
                  REVOLUCIONANDO O <br />
                  <span className="text-gradient-gold">AGRONEGÓCIO</span>
                </>
              )}
            </h1>
          }
        />
 
       <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 font-medium">
         {customTexts?.hero_subtitle || "A mais avançada experiência de leilões digitais com lances em tempo real e segurança inabalável."}
       </p>
 
       <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20">
         <Link to="/cadastro" className="w-full md:w-auto">
           <Button size="lg" className="w-full md:w-auto bg-emerald-deep text-white h-14 px-10 rounded-full font-bold uppercase tracking-widest">
             Começar agora
           </Button>
         </Link>
         <Link to="/ao-vivo" className="w-full md:w-auto">
           <Button size="lg" variant="ghost" className="w-full md:w-auto h-14 px-10 rounded-full font-bold uppercase tracking-widest border border-border">
             <Radio className="mr-2 h-4 w-4 text-live" />
             Ver Live
           </Button>
         </Link>
       </div>
 
       {nextEvent && (
         <div className="max-w-4xl mx-auto p-1 bg-gradient-to-r from-gold/40 via-gold-bright to-gold/40 rounded-[2rem] shadow-2xl">
           <div className="bg-background rounded-[1.9rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="text-left">
               <div className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Próxima Oportunidade</div>
               <h3 className="text-2xl font-black uppercase italic tracking-tighter">{nextEvent.name}</h3>
             </div>
             <div className="flex flex-col items-center">
               <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">O leilão inicia em</div>
               <Countdown endsAt={nextEvent.date} variant="segmented" />
             </div>
             <Link to="/eventos/$eventSlug" params={{ eventSlug: nextEvent.slug }}>
               <Button className="bg-gold text-emerald-deep font-black uppercase rounded-xl h-12 px-8">
                 Ver Lotes
               </Button>
             </Link>
           </div>
         </div>
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