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
import { catalogEventCover } from "@/components/auctions/catalog-media";
 import { SectionFallback } from "@/components/site/SectionFallback";

export const Route = createFileRoute("/")({
  head: ({ matches }) => {
    const rootData = matches.find(m => m.id === '__root__')?.loaderData as any;
    const seoSettings = rootData?.seoSettings;
    return generateMetaTags({
      title: seoSettings?.home_title || "Bovinos e cavalos em leilão e à venda",
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
         supabase.from("events").select("id,slug,name,description,status,start_date,end_date,location,banner_url,viewers,auctioneer_name,promoter_company,show_countdown,lots!lots_event_id_fkey(id)").or("status.eq.live,status.eq.scheduled,status.eq.recebendo_lances,status.eq.incondicional,status.eq.em_condicional,status.eq.em_loteamento").order("start_date", { ascending: true }).limit(PAGE_LIMITS.HOME_EVENTS),
        supabase.from("lots").select("id,lot_number,event_id,current_price,starting_price,bid_increment,bids_count,viewers,end_date,status,is_featured,created_at,animal:animals(name,breed,species,photos,youtube_url,registration_number,vaccination_records,genealogy,sex,color,birth_date,location,accepts_offers,seller:sellers(name)),event:events!lots_event_id_fkey(status,start_date,end_date,allows_pre_bidding,event_type)").eq("is_featured", true).order("created_at", { ascending: false }).limit(PAGE_LIMITS.HOME_FEATURED_LOTS),
         supabase.from("events").select("id,slug,name,status,start_date,end_date,location,banner_url,lots!lots_event_id_fkey(id)").eq("status", "finished").order("start_date", { ascending: false }).limit(PAGE_LIMITS.HOME_PAST_EVENTS),
        supabase.from("site_settings").select("*").eq("key", "announcement").maybeSingle(),
        supabase.from("posts").select("id,slug,title,excerpt,featured_image,published_at,category:categories(name)").eq("status", "published").order("published_at", { ascending: false }).limit(PAGE_LIMITS.HOME_ARTICLES),
         supabase.from("animals").select("id,name,breed,species,photos,sale_price,direct_sale_price,sale_status,location,accepts_offers,categories(name)").eq("is_direct_sale", true).eq("sale_status", "available").order("created_at", { ascending: false }).limit(4),
      ]);

      const getData = (result: PromiseSettledResult<any>, fallback: any) => {
        if (result.status !== "fulfilled" || !result.value) return fallback;
        return result.value.data ?? fallback;
      };

      return {
        events: getData(results[0], []),
        lots: getData(results[1], []),
        pastEvents: getData(results[2], []),
        announcement: getData(results[3], null)?.value ?? null,
        articles: getData(results[4], []),
        directSales: getData(results[5], []),
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
  staleTime: 60_000,
  gcTime: 5 * 60_000,
});

function Home() {
  const router = useRouter();
  const loaderData = Route.useLoaderData() as any;
  const events = Array.isArray(loaderData?.events) ? loaderData.events : [];
  const lots = Array.isArray(loaderData?.lots) ? loaderData.lots : [];
  const pastEvents = Array.isArray(loaderData?.pastEvents) ? loaderData.pastEvents : [];
  const announcement = loaderData?.announcement ?? null;
  const articles = Array.isArray(loaderData?.articles) ? loaderData.articles : [];
  const directSales = Array.isArray(loaderData?.directSales) ? loaderData.directSales : [];
  const context = Route.useRouteContext();
  const { siteInfo: ctxSiteInfo, theme: ctxTheme, homepage: ctxHomepage } = context || {};
   const { siteInfo: dynamicSiteInfo, homepage: sectionsSettings, customTexts, articleSettings, animations } = useSiteSettings({
    siteInfo: ctxSiteInfo, 
    theme: ctxTheme, 
    homepage: ctxHomepage 
  });
  
  const currentSiteInfo = dynamicSiteInfo && typeof dynamicSiteInfo === "object"
    ? dynamicSiteInfo
    : ctxSiteInfo && typeof ctxSiteInfo === "object"
      ? ctxSiteInfo
      : null;
  const settingsCandidate = sectionsSettings || ctxHomepage;
  const baseSettings = settingsCandidate && typeof settingsCandidate === "object" && !Array.isArray(settingsCandidate)
    ? settingsCandidate
    : { 
    show_articles: true, 
    show_upcoming_events: true, 
    show_featured_lots: true,
    show_sale_menu: true,
    show_animated_slides: true,
    template_id: 'model1'
  };

  const defaultSectionOrder = ["banners", "live_now", "upcoming_events", "featured_lots", "sale_menu", "articles", "sellers"];
  const activeSections = {
    ...baseSettings,
    order: Array.isArray((baseSettings as any).order)
      ? (baseSettings as any).order.filter((sectionId: unknown): sectionId is string => typeof sectionId === "string")
      : defaultSectionOrder
  };

   useEffect(() => {
     const interval = setInterval(() => {
       router.invalidate();
     }, 180000);
     return () => clearInterval(interval);
   }, [router]);

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
    cover: catalogEventCover(e?.slug || "", e?.banner_url || ""),
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

   const statsData = (sectionsSettings as any)?.stats || {};
   const siteStats: any = {
     totalSold: statsData.totalSold ?? 184500000,
     totalAnimals: statsData.totalAnimals ?? 12847,
     totalUsers: statsData.totalUsers ?? 38420,
     activeEvents: statsData.activeEvents ?? 14,
     labels: {
       totalSold: statsData.labels?.totalSold || "Volume Negociado",
       totalAnimals: statsData.labels?.totalAnimals || "Animais Registrados",
       totalUsers: statsData.labels?.totalUsers || "Base de Investidores",
       activeEvents: statsData.labels?.activeEvents || "Eventos Ativos"
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
                    alt={`${currentSiteInfo?.name || "Premium Agro Leilões"} — marca oficial`} 
                    className="h-full object-contain"
                  />
               </div>
               <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase italic tracking-tighter">
                 <Bell className="h-4 w-4 animate-bounce" />
                 {(announcement as any).text}
               </div>
            </div>
            {(announcement as any).link && (
              <Link to={(announcement as any).link} className="bg-emerald-deep text-gold px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Ver detalhes do anúncio</Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0">
          {activeSections.order.map((sectionId: string) => (
           <ErrorBoundary 
             key={sectionId} 
            tag={sectionId}
             fallback={
               <SectionFallback 
                 variant="error" 
                 title={`Seção ${sectionId}`} 
                 message="Ocorreu um problema ao carregar esta seção. Tente recarregar a página." 
               />
             }
           >
              {sectionId === "banners" && (!activeSections || (activeSections as any).show_animated_slides) && (
                <EliteHero siteInfo={currentSiteInfo} nextEvent={nextEvent} customTexts={customTexts} stats={siteStats} homepageSettings={activeSections} />
              )}
 
              {sectionId === "live_now" && liveEvents.length > 0 && (
               <section className="border-b border-border bg-card/40">
                 <div className="container mx-auto px-4 py-10">
                   <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-emerald-bright">Lances abertos</p><h2 className="mt-1 text-2xl font-bold text-foreground">Leilões em andamento</h2></div><Link to="/eventos"><Button variant="outline">Todos os leilões <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div>
                   <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{liveEvents.map((event: any) => <EventCard key={event.id} event={event} />)}</div>
                 </div>
               </section>
             )}
               {sectionId === "upcoming_events" && (activeSections as any)?.show_upcoming_events && (
                 <div className="relative py-8 overflow-hidden">
                   {upcomingEvents.length > 0 ? (
                     <EventCarousel 
                       events={upcomingEvents} 
                       title="Próximos eventos" 
                       subtitle="Reserve sua agenda e participe das maiores oportunidades."
                       variant="model1"
                     />
                   ) : (
                     <SectionFallback 
                       title="Próximos Eventos" 
                       message="Novos eventos estão sendo preparados. Volte em breve para conferir!" 
                     />
                   )}
                 </div>
               )}
               {sectionId === "featured_lots" && (activeSections as any)?.show_featured_lots && (
                 <div className="relative py-12">
                   {mappedLots.length > 0 ? (
                     <section className="container mx-auto px-4"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Animais em leilão</h2><Link to="/lotes"><Button variant="outline">Ver todos os lotes <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{mappedLots.slice(0, 6).map((lot: any) => <LotCard key={lot.id} lot={lot} />)}</div></section>
                   ) : (
                     <SectionFallback 
                       title="Lotes em Destaque" 
                       message="Novos lotes de elite serão anunciados em breve." 
                     />
                   )}
                </div>
               )}
               {sectionId === "articles" && (activeSections as any)?.show_articles && (
                 <div className="relative py-12">
                   {articles.length > 0 ? (
                     <ArticleCarousel 
                       articles={articles} 
                       variant="model1" 
                       settings={articleSettings}
                     />
                   ) : (
                     <SectionFallback 
                       title="Últimas Notícias" 
                       message="Novos conteúdos estão sendo redigidos. Fique por dentro em breve!" 
                     />
                   )}
                 </div>
               )}
             {sectionId === "articles" && directSales.length > 0 && (
               <HomeSaleLots directSales={directSales} />
             )}
              {sectionId === "sale_menu" && (activeSections as any)?.show_sale_menu && (
                <section className="container mx-auto px-4 py-16">
                  <div className="border-y border-border py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h2 className="text-3xl font-bold text-foreground mb-4">Animais à venda</h2>
                      <p className="text-muted-foreground max-w-md">Consulte os animais disponíveis para compra direta e as condições de cada vendedor.</p>
                    </div>
                    <Link to="/compra-direta">
                      <Button size="lg" className="h-12 px-6 font-semibold">
                        Ver animais à venda
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
            { icon: Radio, title: "Lances em tempo real", desc: "Acompanhe os valores e a abertura dos lotes em cada leilão." },
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
        <div className="border-t border-border py-10 md:py-16">
          
          
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
              Pronto para <span className="text-gradient-gold">arrematar</span> o melhor do agronegócio?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Cadastre-se, receba aprovação e participe dos próximos leilões em poucos cliques.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/cadastro">
                <Button size="lg">
                  Criar conta grátis
                </Button>
              </Link>
              <Link to="/eventos">
                <Button size="lg" variant="outline">
                  Explorar leilões
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/30">
        <div className="container mx-auto flex flex-col gap-6 px-4 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-gold">Conteúdo educativo</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">Como investir em gado de elite</h2>
            <p className="mt-3 text-muted-foreground">Conheça os critérios de avaliação, os riscos e as etapas de participação em um leilão agropecuário.</p>
          </div>
          <Link to="/guia-investidor-agro">
            <Button size="lg" variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
              Ler o guia do investidor <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
