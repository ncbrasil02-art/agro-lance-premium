 import { createFileRoute, Link } from "@tanstack/react-router";
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
import { EventRequestDialog } from "@/components/auctions/EventRequestDialog";

  export const Route = createFileRoute("/")({
    loader: async () => {
      logger.info("Iniciando carregamento da Home");
      try {
        const [eventsRes, lotsRes, pastEventsRes, settingsRes] = await Promise.all([
         supabase.from("events")
           .select("*, lots!lots_event_id_fkey(id)")
           .or("status.eq.live,status.eq.scheduled")
          .order("start_date", { ascending: true })
          .limit(6),
          supabase.from("lots")
            .select("*, animal:animals(*, seller:sellers(name)), event:events!lots_event_id_fkey(*)")
           .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(6),
         supabase.from("events")
           .select("*, lots!lots_event_id_fkey(id)")
           .eq("status", "finished")
          .order("start_date", { ascending: false })
          .limit(3),
        supabase.from("site_settings")
          .select("*")
          .eq("key", "announcement")
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
          announcement: validatedAnnouncement
        };
      } catch (error) {
        logger.error("Erro ao carregar dados da Home", { error });
        throw error;
      }
    },
    component: Home,
    pendingComponent: HomeSkeleton,
  });

function Home() {
    const { events, lots, pastEvents, announcement } = Route.useLoaderData();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }, []);

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
        return status === "live";
      });

      const upcomingEvents = mappedEvents.filter((e: any) => {
        const status = getEffectiveEventStatus({ 
          status: e.status, 
          start_date: e.date, 
          end_date: e.end_date 
        });
        return status === "scheduled";
      });
     
     // Find the closest upcoming event with countdown enabled
      const nextEvent = mappedEvents
        .filter((e: any) => {
          const status = getEffectiveEventStatus({ 
            status: e.status, 
            start_date: e.date, 
            end_date: e.end_date 
          });
          return status === 'scheduled' && e.show_countdown;
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

      {/* HERO */}
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
              <div className="mt-8 flex flex-col gap-2 rounded-2xl border border-gold/20 bg-gold/5 p-4 backdrop-blur-sm md:w-fit mb-8">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gold">
                  <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse" />
                  Oportunidade Imperdível: {nextEvent.name}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-6">
                  <Countdown endsAt={nextEvent.date} variant="segmented" className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent" />
                  <div className="h-10 w-px bg-white/10" />
                  <Link to="/eventos/$eventSlug" params={{ eventSlug: nextEvent.slug }} className="group/btn flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-black uppercase text-emerald-deep transition-all hover:bg-gold-bright active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    Garantir Vaga
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            )}
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Leilões <span className="text-gradient-gold">premium</span><br />
              em tempo real
            </h1>
             <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Cavalos, bovinos e embriões de elite com transmissão ao vivo, curadoria genética
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveEvents.map((e: any) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* EVENTOS FUTUROS */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Próximos eventos</h2>
          <p className="mt-2 text-muted-foreground">Reserve sua agenda e participe das maiores oportunidades.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((e: any) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>

      {/* LOTES DESTAQUE */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Lotes em <span className="text-gradient-gold">destaque</span></h2>
            <p className="mt-2 text-muted-foreground">Os animais mais disputados desta semana.</p>
          </div>
          <Link to="/lotes" className="hidden items-center gap-1 text-sm text-gold hover:underline md:inline-flex">
            Ver todos os lotes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredLots.map((l: any) => <LotCard key={l.id} lot={l} />)}
        </div>
      </section>

      {/* EVENTOS PASSADOS */}
      {mappedPastEvents.length > 0 && (
        <section className="container mx-auto px-4 py-16 border-t border-border/40">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-muted-foreground">Leilões encerrados</h2>
            <p className="mt-2 text-sm text-muted-foreground">Confira os resultados dos últimos eventos realizados.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-80 grayscale-[0.5]">
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
