 import { useSiteSettings } from "@/hooks/useSiteSettings";
 import { ArticleCarousel } from "@/components/site/ArticleCarousel";
 import { EventCarousel } from "@/components/site/EventCarousel";
 import { FeaturedLotsCarousel } from "@/components/site/FeaturedLotsCarousel";
  import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowRight, Radio, ShieldCheck, Sparkles, Trophy, Calendar, Bell, Loader2 } from "lucide-react";
import { Countdown } from "@/components/auctions/countdown";
import { getEffectiveEventStatus, getEffectiveLotStatus } from "@/utils/auction-status";
import { useEffect, useState } from "react";
  import { logger } from "@/utils/logger";
 import { Button } from "@/components/ui/button";
 import { EventCard } from "@/components/auctions/event-card";
 import { LotCard } from "@/components/auctions/lot-card";
  import { supabase } from "@/integrations/supabase/client";
  import { formatBRL } from "@/utils/format";
  import { eventSchema, lotSchema, announcementSchema, ValidatedEvent, ValidatedLot } from "@/lib/schemas";
  import { z } from "zod";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { HomeSkeleton } from "@/components/ui/page-skeleton";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { EventRequestDialog } from "@/components/auctions/EventRequestDialog";

  export const Route = createFileRoute("/")({
     loader: async () => {
       logger.info("Iniciando carregamento da Home");
       try {
         const [eventsRes, lotsRes, pastEventsRes, settingsRes, articlesRes, sectionsSettingsRes] = await Promise.all([
           supabase.from("events")
             .select("*, lots!lots_event_id_fkey(id)")
             .or("status.eq.live,status.eq.scheduled,status.eq.recebendo_lances,status.eq.incondicional,status.eq.em_condicional,status.eq.em_loteamento")
             .order("start_date", { ascending: true })
             .limit(15),
            supabase.from("lots")
              .select("*, animal:animals(*, seller:sellers(name)), event:events!lots_event_id_fkey(*)")
              .eq("is_featured", true)
              .order("created_at", { ascending: false })
              .limit(12),
          supabase.from("events")
            .select("*, lots!lots_event_id_fkey(id)")
            .eq("status", "finished")
           .order("start_date", { ascending: false })
           .limit(3),
         supabase.from("site_settings")
           .select("*")
           .eq("key", "announcement")
           .maybeSingle(),
         supabase.from("posts")
           .select("*, category:categories(name)")
           .eq("status", "published")
           .order("published_at", { ascending: false })
           .limit(10),
         supabase.from("site_settings")
           .select("*")
           .eq("key", "homepage_sections")
           .maybeSingle()
       ]);

        logger.info("Carregamento da Home concluído com sucesso", {
          eventsCount: eventsRes.data?.length || 0,
          lotsCount: lotsRes.data?.length || 0
        });

        const validatedEvents = z.array(eventSchema).parse(eventsRes.data || []);
        const validatedLots = z.array(lotSchema).parse(lotsRes.data || []);
        const validatedPastEvents = z.array(eventSchema).parse(pastEventsRes.data || []);

        let validatedAnnouncement = null;
        if (settingsRes.data?.value) {
          try {
            validatedAnnouncement = announcementSchema.parse(settingsRes.data.value);
          } catch (e) {
            logger.warn("Anúncio com formato inválido no banco de dados", { error: e });
          }
        }

         return {
           events: validatedEvents,
           lots: validatedLots,
           pastEvents: validatedPastEvents,
           announcement: validatedAnnouncement,
           articles: articlesRes.data || [],
           sectionsSettings: sectionsSettingsRes.data?.value || { show_articles: true, show_upcoming_events: true, show_featured_lots: true }
         };
      } catch (error) {
        logger.error("Erro ao carregar dados da Home", { error });
        throw error;
      }
    },
    component: Home,
    pendingComponent: HomeSkeleton,
    errorComponent: ErrorFallback,
  });

 function Home() {
     const router = useRouter();
      const { events, lots, pastEvents, announcement, articles, sectionsSettings: initialSections } = Route.useLoaderData();
      const { homepage: sectionsSettings, siteInfo } = useSiteSettings();
      
      const activeSections = sectionsSettings || initialSections;
    const [now, setNow] = useState(Date.now());

     useEffect(() => {
       const interval = setInterval(() => setNow(Date.now()), 1000);
       
       const channel = supabase
         .channel('home-updates')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
           logger.info("Evento alterado, atualizando home...");
           router.invalidate();
         })
         .on('postgres_changes', { event: '*', schema: 'public', table: 'lots' }, () => {
           logger.info("Lote alterado, atualizando home...");
           router.invalidate();
         })
         .subscribe();
 
       return () => {
         clearInterval(interval);
         supabase.removeChannel(channel);
       };
     }, [router]);

    const mapEvent = (e: ValidatedEvent) => ({
     id: e.id,
     slug: e.slug || "",
     name: e.name,
     description: e.description || "",
     date: e.start_date,
     city: e.location?.split("-")?.[0]?.trim() || "Brasil",
     state: e.location?.split("-")?.[1]?.trim() || "",
      cover: e.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80",
      status: e.status as any,
      end_date: (e as any).end_date,
       lotsCount: e.lots?.length || 0,
     viewers: e.viewers || 0,
     bidsCount: 0,
     auctioneer: e.auctioneer_name || "",
      promoter: e.promoter_company || "",
      show_countdown: e.show_countdown !== false,
    });

    const mappedEvents = events.map(mapEvent);
    const mappedPastEvents = pastEvents.map(mapEvent);
 
    const mappedLots = lots.map((l: ValidatedLot) => ({
     id: l.id,
     number: l.lot_number,
     eventId: l.event_id,
     name: l.animal?.name || "Sem nome",
     breed: l.animal?.breed || "",
     category: l.animal?.species as any,
     cover: l.animal?.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
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
    }));
 
    const liveEvents = mappedEvents.filter((e: any) => {
      const status = getEffectiveEventStatus({ 
        status: e.status, 
        start_date: e.date, 
        end_date: e.end_date 
      });
      return status === "live" || status === "recebendo_lances" || status === "incondicional" || status === "em_condicional";
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
        // Consider upcoming events for the hero countdown
        return (status === 'scheduled' || status === 'em_loteamento') && e.show_countdown;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
   const featuredLots = mappedLots.slice(0, 6);
 
   const stats = {
     totalSold: 184500000,
     totalAnimals: 12847,
     totalUsers: 38420,
     activeEvents: 14,
   };

  return (
    <>
      {/* ANNOUNCEMENT BANNER */}
      {announcement && (announcement as any).active && (
        <div className="bg-gold py-2 px-4 text-emerald-deep">
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-bold">
            <Bell className="h-4 w-4" />
            {(announcement as any).text}
            {(announcement as any).link && (
              <Link to={(announcement as any).link} className="underline ml-2">Saiba mais</Link>
            )}
          </div>
        </div>
      )}

       {/* HERO / BANNERS */}
       {(!activeSections || (activeSections as any).show_animated_slides) && (
         <section className="relative overflow-hidden">
           <div className="absolute inset-0">
             <OptimizedImage 
               src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80" 
               alt="Cavalo de elite ao entardecer" 
               width={1920} 
               className="h-full w-full opacity-40" 
             />
             <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
             <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
           </div>

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              A nova era dos leilões agropecuários
            </div>
            {nextEvent && (
              <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-gold/30 bg-black/40 p-6 backdrop-blur-xl md:w-fit mb-12 shadow-[0_0_40px_rgba(212,175,55,0.1)] border-l-4 border-l-gold">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/80">Próximo Evento de Elite</div>
                    <div className="text-xl font-black text-white uppercase italic tracking-tighter">{nextEvent.name}</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Inicia em</span>
                    <Countdown endsAt={nextEvent.date} variant="segmented" className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent" />
                  </div>
                  
                  <div className="flex gap-3">
                    <Link 
                      to="/eventos/$eventSlug" 
                      params={{ eventSlug: nextEvent.slug }} 
                      className="group/btn flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-xs font-black uppercase text-emerald-deep transition-all hover:bg-gold-bright active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                    >
                      Ver Catálogo
                      <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                    <Link 
                      to="/cadastro" 
                      className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-xs font-black uppercase text-white transition-all hover:bg-white/10 active:scale-95"
                    >
                      Garantir Vaga
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl uppercase">
              {(siteInfo?.name || "Leilões").split(' ')[0]} <span className="text-gradient-gold">{(siteInfo?.name || "Premium").split(' ').slice(1).join(' ')}</span><br />
              em tempo real
            </h1>
             <p className="mt-5 max-w-xl text-lg text-muted-foreground italic">
              {siteInfo?.name || "Premium Agro"} - A elite do agronegócio com transmissão ao vivo, curadoria genética
              e tecnologia de ponta para compradores e leiloeiros profissionais.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/ao-vivo">
                <Button size="lg" className="bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold">
                  <Radio className="mr-2 h-4 w-4 animate-pulse-live" />
                  Assistir agora
                </Button>
              </Link>
              <Link to="/eventos">
                <Button size="lg" variant="outline" className="border-gold/40 hover:bg-gold/10">
                  Ver próximos eventos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <EventRequestDialog />
            </div>

            {/* Stats inline */}
            <dl className="mt-12 grid max-w-lg grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { v: formatBRL(stats.totalSold), l: "Vendido" },
                { v: stats.totalAnimals.toLocaleString("pt-BR"), l: "Animais" },
                { v: stats.totalUsers.toLocaleString("pt-BR"), l: "Usuários" },
                { v: stats.activeEvents, l: "Eventos ativos" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</dt>
                  <dd className="mt-1 text-lg font-bold text-foreground">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      )}

      {/* AO VIVO */}
      {liveEvents.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-live/30 bg-live/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-live">
                <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse-live" /> Acontecendo agora
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Eventos ao vivo</h2>
            </div>
            <Link to="/ao-vivo" className="hidden items-center gap-1 text-sm text-gold hover:underline md:inline-flex">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {liveEvents.map((e: any) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* DYNAMIC SECTIONS ORDERING */}
      {((activeSections as any)?.order || ["upcoming_events", "featured_lots", "sale_menu", "articles"]).map((sectionId: string) => {
        if (sectionId === "upcoming_events" && (activeSections as any)?.show_upcoming_events) {
          return (
            <EventCarousel 
              key="upcoming"
              events={upcomingEvents} 
              title="Próximos eventos" 
              subtitle="Reserve sua agenda e participe das maiores oportunidades."
            />
          );
        }
        if (sectionId === "featured_lots" && (activeSections as any)?.show_featured_lots) {
          return <FeaturedLotsCarousel key="featured" lots={mappedLots} />;
        }
        if (sectionId === "articles" && (activeSections as any)?.show_articles) {
          return <ArticleCarousel key="articles" articles={articles} />;
        }
        if (sectionId === "sale_menu" && (activeSections as any)?.show_sale_menu) {
          return (
            <section key="sale" className="container mx-auto px-4 py-16">
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
          );
        }
        return null;
      })}

      {/* EVENTOS PASSADOS */}
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

      {/* DIFERENCIAIS */}
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

      {/* CTA */}
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
    </>
  );
}
