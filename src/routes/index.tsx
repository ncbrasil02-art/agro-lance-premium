import { SellerCarousel } from "@/components/site/SellerCarousel";
import { generateMetaTags } from "@/utils/seo";
import { useHomeRealtime } from "@/hooks/useRealtimeEvent";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ArticleCarousel } from "@/components/site/ArticleCarousel";
import { EventCarousel } from "@/components/site/EventCarousel";
import { FeaturedLotsCarousel } from "@/components/site/FeaturedLotsCarousel";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PAGE_LIMITS } from "@/config/limits";
import { ArrowRight, Radio, ShieldCheck, Sparkles, Trophy, Calendar, Bell, Loader2, ShoppingCart, Gavel } from "lucide-react";
import { Countdown } from "@/components/auctions/countdown";
import { getEffectiveEventStatus, getEffectiveLotStatus } from "@/utils/auction-status";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/auctions/event-card";
import { LotCard } from "@/components/auctions/lot-card";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/utils/format";
import { eventSchema, lotSchema, announcementSchema, ValidatedEvent, ValidatedLot } from "@/lib/schemas";
import { z } from "zod";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import { HomeSkeleton, PageSkeleton } from "@/components/ui/page-skeleton";
import { ErrorFallback, ErrorBoundary } from "@/components/ui/error-fallback";
import { EventRequestDialog } from "@/components/auctions/EventRequestDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeSaleLots } from "@/components/site/HomeSaleLots";
import { EliteHero } from "@/components/site/HomeTemplates";

export const Route = createFileRoute("/")({
  head: ({ matches }) => {
    const rootData = matches.find(m => m.id === '__root__')?.loaderData as any;
    const seoSettings = rootData?.seoSettings;
    return generateMetaTags({
      title: seoSettings?.home_title || "Home",
      description: seoSettings?.home_description,
      seoSettings,
      canonical: "",
      ogTitle: seoSettings?.home_og_title,
      ogDescription: seoSettings?.home_og_description,
      ogImage: seoSettings?.home_og_image
    });
  },
  loader: async () => {
    try {
      const results = await Promise.allSettled([
        supabase.from("events").select("*, lots!lots_event_id_fkey(id)").or("status.eq.live,status.eq.scheduled,status.eq.recebendo_lances,status.eq.incondicional,status.eq.em_condicional,status.eq.em_loteamento").order("start_date", { ascending: true }).limit(PAGE_LIMITS.HOME_EVENTS),
        supabase.from("lots").select("*, animal:animals(*, seller:sellers(name)), event:events!lots_event_id_fkey(*)").eq("is_featured", true).order("created_at", { ascending: false }).limit(PAGE_LIMITS.HOME_FEATURED_LOTS),
        supabase.from("events").select("*, lots!lots_event_id_fkey(id)").eq("status", "finished").order("start_date", { ascending: false }).limit(PAGE_LIMITS.HOME_PAST_EVENTS),
        supabase.from("site_settings").select("*").eq("key", "announcement").maybeSingle(),
        supabase.from("posts").select("*, category:categories(name)").eq("status", "published").order("published_at", { ascending: false }).limit(PAGE_LIMITS.HOME_ARTICLES),
        supabase.from("animals").select("*, categories(name)").eq("is_direct_sale", true).eq("sale_status", "available").order("created_at", { ascending: false }).limit(4),
      ]);

      const getVal = (res: any) => res.status === 'fulfilled' ? res.value : { data: [] };

      return {
        events: getVal(results[0]).data || [],
        lots: getVal(results[1]).data || [],
        pastEvents: getVal(results[2]).data || [],
        announcement: getVal(results[3]).data?.value || null,
        articles: getVal(results[4]).data || [],
        directSales: getVal(results[5]).data || [],
      };
    } catch (err) {
      console.error("Loader Home fatal error:", err);
      return {
        events: [],
        lots: [],
        pastEvents: [],
        announcement: null,
        articles: [],
        directSales: [],
      };
    }
  },
  component: Home,
  pendingComponent: HomeSkeleton,
  errorComponent: ErrorFallback,
});

function Home() {
  const router = useRouter();
   const { events, lots, pastEvents, announcement, articles, directSales } = Route.useLoaderData() as any;
  const context = Route.useRouteContext();
  const { siteInfo: ctxSiteInfo, theme: ctxTheme, homepage: ctxHomepage } = context || {};
   const { siteInfo: dynamicSiteInfo, homepage: sectionsSettings, customTexts, articleSettings, animations } = useSiteSettings({
    siteInfo: ctxSiteInfo, 
    theme: ctxTheme, 
    homepage: ctxHomepage 
  });
  
  const currentSiteInfo = dynamicSiteInfo || ctxSiteInfo;
  const baseSettings = sectionsSettings || ctxHomepage || { 
    show_articles: true, 
    show_upcoming_events: true, 
    show_featured_lots: true,
    show_animated_slides: true,
    template_id: 'model1'
  };
  
  const activeSections = {
    ...baseSettings,
    order: Array.isArray((baseSettings as any)?.order) 
      ? (baseSettings as any).order 
      : ["banners", "live_now", "upcoming_events", "featured_lots", "sale_menu", "articles", "sellers"]
  };

  useEffect(() => {
    const interval = setInterval(() => {}, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRealtimeUpdate = useCallback(() => {
    router.invalidate();
  }, [router]);

  useHomeRealtime(handleRealtimeUpdate);

  const mapEvent = (e: any) => ({
    id: e?.id || Math.random().toString(),
    slug: e?.slug || "",
    name: e?.name || "Evento sem nome",
    description: e?.description || "",
    date: e?.start_date || new Date().toISOString(),
    city: (e?.location as string)?.split("-")?.[0]?.trim() || "Brasil",
    state: (e?.location as string)?.split("-")?.[1]?.trim() || "",
    cover: e?.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80",
    status: e.status as any,
    end_date: (e as any).end_date,
    lotsCount: e.lots?.length || 0,
    viewers: e.viewers || 0,
    bidsCount: 0,
    auctioneer: e.auctioneer_name || "",
    promoter: e.promoter_company || "",
    show_countdown: e.show_countdown !== false,
  });

   const mappedEvents = (events || []).filter(Boolean).map(mapEvent);
   const mappedPastEvents = (pastEvents || []).filter(Boolean).map(mapEvent);
 
    const mappedLots = (lots || []).filter((l: any) => l && l.animal).map((l: any) => ({
    id: l.id,
    number: l.lot_number,
    eventId: l.event_id,
    name: l.animal?.name || "Sem nome",
    breed: l.animal?.breed || "",
    category: l.animal?.species as any,
    cover: l.animal?.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
    photos: l.animal?.photos || [],
    youtube_url: l.animal?.youtube_url || "",
    registration_number: l.animal?.registration_number || "",
    vaccination_records: l.animal?.vaccination_records || null,
    currentBid: l.current_price || l.starting_price,
    minIncrement: l.bid_increment,
    bidsCount: l.bids_count || 0,
    viewers: l.viewers || 0,
    endsAt: l.end_date || "",
    status: l.status as any,
    eventStatus: (l as any).event?.status,
    eventStartDate: (l as any).event?.start_date,
    eventEndDate: (l as any).event?.end_date,
    allowsPreBidding: (l as any).event?.allows_pre_bidding,
    eventType: (l as any).event?.event_type,
    father: (l as any).animal?.genealogy?.father,
    mother: (l as any).animal?.genealogy?.mother,
    sex: (l as any).animal?.sex,
    color: (l as any).animal?.color,
    birthDate: (l as any).animal?.birth_date,
    seller: (l as any).animal?.seller?.name,
    location: (l as any).animal?.location,
    acceptsOffers: (l as any).animal?.accepts_offers,
  }));

  const liveEvents = mappedEvents.filter((e: any) => {
    const status = getEffectiveEventStatus({ 
      status: e.status, 
      start_date: e.date, 
      end_date: e.end_date 
    });
    return ["live", "recebendo_lances", "incondicional", "em_condicional"].includes(status);
  });

  const upcomingEvents = mappedEvents.filter((e: any) => {
    const status = getEffectiveEventStatus({ 
      status: e.status, 
      start_date: e.date, 
      end_date: e.end_date 
    });
    return status === "scheduled" || status === "em_loteamento";
  });
  
  const nextEvent = mappedEvents
    .filter((e: any) => {
      const status = getEffectiveEventStatus({ 
        status: e.status, 
        start_date: e.date, 
        end_date: e.end_date 
      });
      return (status === 'scheduled' || status === 'em_loteamento') && e.show_countdown;
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const featuredLots = mappedLots.slice(0, 6);

   const siteStats: any = {
     totalSold: sectionsSettings?.stats?.totalSold ?? 184500000,
     totalAnimals: sectionsSettings?.stats?.totalAnimals ?? 12847,
     totalUsers: sectionsSettings?.stats?.totalUsers ?? 38420,
     activeEvents: sectionsSettings?.stats?.activeEvents ?? 14,
     labels: {
       totalSold: sectionsSettings?.stats?.labels?.totalSold || "Volume Negociado",
       totalAnimals: sectionsSettings?.stats?.labels?.totalAnimals || "Animais Registrados",
       totalUsers: sectionsSettings?.stats?.labels?.totalUsers || "Base de Investidores",
       activeEvents: sectionsSettings?.stats?.labels?.activeEvents || "Eventos Ativos"
     }
   };

  return (
    <div className="relative min-h-screen transition-colors duration-700">
      {announcement && (announcement as any).active && (
        <div className="bg-gold py-2.5 px-4 text-emerald-deep border-b border-gold-bright/30">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 bg-emerald-deep/5 rounded-lg p-1 hidden sm:flex items-center justify-center">
                  <img 
                    src="https://ccrslflbnxdazvadjlvj.supabase.co/storage/v1/object/public/public_assets/logo-0.9588475542778425.png" 
                    alt="Logo" 
                    className="h-full object-contain"
                  />
               </div>
               <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase italic tracking-tighter">
                 <Bell className="h-4 w-4 animate-bounce" />
                 {(announcement as any).text}
               </div>
            </div>
            {(announcement as any).link && (
              <Link to={(announcement as any).link} className="bg-emerald-deep text-gold px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Saiba mais</Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0">
        {(activeSections.order).map((sectionId: string) => (
          <ErrorBoundary key={sectionId} fallback={<div className="p-10 text-center text-muted-foreground">Erro ao carregar seção {sectionId}</div>}>
             {sectionId === "banners" && (!activeSections || (activeSections as any).show_animated_slides) && (
               <EliteHero siteInfo={currentSiteInfo} nextEvent={nextEvent} customTexts={customTexts} stats={siteStats} homepageSettings={activeSections} />
             )}

             {sectionId === "live_now" && liveEvents.length > 0 && (
               <section className="container mx-auto px-4 py-8 lg:py-12 relative z-20">
                 <motion.div 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="group relative overflow-hidden rounded-[2rem] border-2 border-live/20 bg-emerald-deep shadow-[0_20px_50px_-15px_rgba(239,68,68,0.3)]"
                 >
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                   <div className="flex flex-col md:flex-row items-stretch min-h-[350px]">
                     {/* Image Section */}
                     <div className="relative w-full md:w-[45%] overflow-hidden">
                       <OptimizedImage 
                         src={liveEvents[0].cover} 
                         alt={liveEvents[0].name}
                         width={800}
                         className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-emerald-deep" />
                       <div className="absolute left-6 top-6">
                         <div className="inline-flex items-center gap-2 rounded-full bg-live px-4 py-2 text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-xl animate-pulse">
                           <span className="h-2 w-2 rounded-full bg-white" />
                           Leilão Ao Vivo
                         </div>
                       </div>
                     </div>

                     {/* Content Section */}
                     <div className="flex-1 p-8 md:p-12 flex flex-col justify-center gap-6 relative">
                       <div>
                         <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4 group-hover:text-gold transition-colors duration-500">
                           {liveEvents[0].name}
                         </h2>
                         <p className="text-white/70 text-base md:text-xl max-w-md italic font-medium leading-relaxed">
                           {liveEvents[0].description || "Participe agora do nosso leilão de elite em tempo real."}
                         </p>
                       </div>

                       <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-white/10">
                         <div className="flex items-center gap-3 text-live">
                           <div className="h-10 w-10 rounded-full bg-live/10 flex items-center justify-center border border-live/20">
                             <Radio className="h-5 w-5 animate-pulse" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Audiência Real</span>
                             <span className="text-lg font-black text-white uppercase tracking-tighter italic">
                               {Math.max(1, liveEvents[0].viewers).toLocaleString()} assistindo
                             </span>
                           </div>
                         </div>
                         
                         <Link 
                           to="/eventos/$eventSlug" 
                           params={{ eventSlug: liveEvents[0].slug }}
                           className="w-full md:w-auto"
                         >
                           <Button 
                             size="lg" 
                             className="bg-live hover:bg-live/90 text-white font-black uppercase italic tracking-widest h-16 px-10 rounded-2xl shadow-live hover:scale-105 transition-all w-full"
                           >
                             ENTRAR NO LEILÃO
                             <ArrowRight className="ml-2 h-5 w-5" />
                           </Button>
                         </Link>
                       </div>
                     </div>
                   </div>
                 </motion.div>
                 {liveEvents.length > 1 && (
                   <div className="mt-6 flex justify-end">
                     <Link to="/ao-vivo" className="flex items-center gap-2 text-gold hover:text-gold-bright text-xs font-black uppercase tracking-widest transition-colors">
                       Ver outros {liveEvents.length - 1} eventos ao vivo <ArrowRight className="h-4 w-4" />
                     </Link>
                   </div>
                 )}
               </section>
             )}
              {sectionId === "upcoming_events" && (activeSections as any)?.show_upcoming_events && (
                <div className="relative py-8 overflow-hidden">
                  <EventCarousel 
                   events={upcomingEvents} 
                   title="Próximos eventos" 
                   subtitle="Reserve sua agenda e participe das maiores oportunidades."
                   variant="model1"
                 />
               </div>
             )}
              {sectionId === "featured_lots" && (activeSections as any)?.show_featured_lots && (
                <div className="relative py-12">
                  <FeaturedLotsCarousel lots={mappedLots} variant="model1" />
                 <section className="container mx-auto px-4 py-8 lg:hidden relative z-10">
                    <div className="grid gap-6 sm:grid-cols-2">
                       {mappedLots.slice(0, 4).map((lot: any) => (
                          <LotCard key={lot.id} lot={lot} />
                       ))}
                    </div>
                 </section>
               </div>
             )}
              {sectionId === "articles" && (activeSections as any)?.show_articles && (
                <div className="relative py-12">
                  <ArticleCarousel 
                   articles={articles} 
                   variant="model1" 
                   settings={articleSettings}
                 />
               </div>
             )}
             {sectionId === "articles" && directSales.length > 0 && (
               <HomeSaleLots directSales={directSales} />
             )}
              {sectionId === "sale_menu" && (activeSections as any)?.show_sale_menu && (
                <section className="container mx-auto px-4 py-16">
                  <div className="rounded-3xl bg-emerald-deep/40 border border-gold/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Compra Direta de Elite</h2>
                      <p className="text-white/60 max-w-md">Acesse nosso catálogo exclusivo de venda direta e garanta seu animal sem a necessidade de disputa em leilão.</p>
                    </div>
                    <Link to="/compra-direta">
                      <Button size="lg" className="bg-gold text-emerald-deep font-black uppercase italic tracking-widest h-16 px-8 rounded-2xl shadow-gold hover:scale-105 transition-transform">
                        Acessar Catálogo
                      </Button>
                    </Link>
                  </div>
                </section>
              )}
              {sectionId === "sellers" && (
                <div className="py-16">
                  <SellerCarousel />
                </div>
              )}
          </ErrorBoundary>
        ))}
      </div>

      {mappedPastEvents.length > 0 && (
        <section className="container mx-auto px-4 py-16 border-t border-border/40">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-muted-foreground">Leilões encerrados</h2>
            <p className="mt-2 text-sm text-muted-foreground">Confira os resultados dos últimos eventos realizados.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 opacity-80 grayscale-[0.5]">
            {mappedPastEvents.map((e: any) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      <section className="border-y border-border/60 bg-card/40">
        <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-3">
          {[
            { icon: Radio, title: "Lances em tempo real", desc: "WebSocket de baixa latência com atualização instantânea, contagem regressiva inteligente e alertas visuais." },
            { icon: ShieldCheck, title: "Curadoria veterinária", desc: "Cada animal passa por avaliação genealógica, exames e laudos antes de entrar em leilão." },
            { icon: Trophy, title: "Compradores qualificados", desc: "Cadastro com aprovação manual, comprovação financeira e contratos assinados digitalmente." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-gradient shadow-gold">
                <item.icon className="h-5 w-5 text-emerald-deep" />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-hero-gradient p-10 md:p-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Pronto para <span className="text-gradient-gold">arrematar</span> o melhor do agronegócio?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Cadastre-se, receba aprovação e participe dos próximos leilões em poucos cliques.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/cadastro">
                <Button size="lg" className="bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold">
                  Criar conta grátis
                </Button>
              </Link>
              <Link to="/eventos">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                  Explorar leilões
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
