 import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
 import { Calendar, MapPin, Gavel, Users, Trophy, Zap, RefreshCw } from "lucide-react";
 import { useRealtimeEvent } from "@/hooks/useRealtimeEvent";
import { Countdown } from "@/components/auctions/countdown";
import { supabase } from "@/integrations/supabase/client";
import { eventSchema } from "@/lib/schemas";
import { LotCard } from "@/components/auctions/lot-card";
import { StatusBadge } from "@/components/auctions/status-badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/eventos/$eventSlug")({
  loader: async ({ params }) => {
    const { data: event, error } = await supabase
      .from("events")
        .select("*, lots!lots_event_id_fkey(*, animal:animals(*, seller:sellers(name)))")
      .eq("slug", params.eventSlug)
      .maybeSingle();

    if (error || !event) throw notFound();

    try {
      const validatedEvent = eventSchema.parse(event);
      return { event: validatedEvent };
    } catch (e) {
      console.error("Erro de validação do evento:", e);
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.event ? [
      { title: `${loaderData.event.name} — Premium Agro Leilões` },
      { name: "description", content: loaderData.event.description || "" },
      { property: "og:title", content: loaderData.event.name },
      { property: "og:description", content: loaderData.event.description || "" },
      { property: "og:image", content: loaderData.event.banner_url || "" },
    ] : [],
  }),
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Evento não encontrado</h1>
      <Link to="/eventos" className="mt-4 inline-block text-gold hover:underline">Ver todos os eventos</Link>
    </div>
  ),
  component: EventDetail,
});

function EventDetail() {
  const { event } = Route.useLoaderData() as any;
   const router = useRouter();
  const eventLots = event.lots || [];
 
   const { status } = useRealtimeEvent(event.id, () => {
     router.invalidate();
   });
 
   const isConnected = status === 'SUBSCRIBED';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header com transição suave para o conteúdo */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img 
          src={event.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} 
          alt="" 
          className="h-full w-full object-cover blur-sm brightness-50" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

       <section className="relative -mt-40 md:-mt-60 z-10 pb-16">
         {/* Connection Indicator */}
         {!isConnected && (
           <div className="absolute top-0 right-4 z-50 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[10px] text-white/60 border border-white/5">
             <RefreshCw className="h-3 w-3 animate-spin" />
             Sincronizando...
           </div>
         )}
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.8fr] items-start">
            {/* Main Rectangular Banner */}
            <div className="relative group mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-2 bg-gold/10 blur-3xl rounded-[2.5rem] opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative aspect-[3/4] md:aspect-square lg:aspect-[4/5] overflow-hidden rounded-[2rem] md:rounded-[3rem] border-2 border-white/10 bg-emerald-deep shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:border-gold/30 group/banner">
                {/* Blurred background to fill gaps */}
                <img 
                  src={event.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} 
                  alt="" 
                  className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-40 scale-110" 
                />
                {/* Main contained image to see everything */}
                <img 
                  src={event.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} 
                  alt={event.name} 
                  className="relative h-full w-full object-contain transition-transform duration-700 group-hover/banner:scale-[1.03]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                    <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em]">Flyer Oficial</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Header Info */}
            <div className="flex flex-col lg:pt-12">
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <StatusBadge status={event.status} className="scale-110" />
                <div className="h-4 w-px bg-white/10" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{event.event_type || 'Leilão Premium'}</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-8 uppercase leading-[0.85] italic">
                {event.name}
              </h1>
              
              <div className="relative mb-12 max-w-2xl">
                <div className="absolute -left-6 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gold via-gold/50 to-transparent rounded-full" />
                <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl">
                  <p className="text-lg md:text-2xl text-white/90 leading-relaxed font-medium italic whitespace-pre-wrap">
                    {event.description || "Participe deste evento exclusivo com os melhores exemplares do agronegócio premium selecionados cuidadosamente por nossa curadoria genética."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-12">
                {[
                  { icon: Calendar, label: "Cronograma", value: new Date(event.start_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { icon: MapPin, label: "Recinto/Local", value: event.location || "Arena Digital" },
                  { icon: Gavel, label: "Martelo", value: event.auctioneer_name || "Convidado Especial" },
                  { icon: Trophy, label: "Fomento", value: event.promoter_company || "Premium Agro" },
                ].map((m) => (
                  <div key={m.label} className="p-5 md:p-6 rounded-[2rem] bg-emerald-deep/40 border border-white/5 backdrop-blur-xl group hover:bg-gold/5 hover:border-gold/20 transition-all flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center">
                        <m.icon className="h-4 w-4 text-gold" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60">{m.label}</span>
                    </div>
                    <div className="text-base md:text-lg font-black text-white leading-tight uppercase tracking-tight">{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {event.status === "live" ? (
                  <Link to="/ao-vivo" className="flex-1">
                    <Button size="lg" className="w-full h-20 bg-gold-gradient text-emerald-deep font-black text-2xl shadow-[0_10px_40px_rgba(212,175,55,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all rounded-[1.5rem] tracking-tighter italic">
                      ASSISTIR AGORA
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1">
                    <div className="flex flex-col h-20 justify-center p-6 rounded-[1.5rem] border border-gold/20 bg-gold/5">
                      <div className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-1">Faltam para o início</div>
                      <Countdown endsAt={event.start_date} variant="segmented" className="text-white" />
                    </div>
                  </div>
                )}
                <Button variant="outline" size="lg" className="h-20 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold rounded-[1.5rem] flex-1 sm:flex-none uppercase tracking-widest text-xs">
                  Contatar Assessoria
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lots Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">Lotes Disponíveis</h2>
            <p className="mt-2 text-muted-foreground font-medium">Exemplares selecionados exclusivamente para este evento.</p>
          </div>
          <div className="h-px flex-1 bg-white/5 hidden md:block mx-8" />
          <div className="text-right">
            <span className="text-5xl font-black text-gold/20 tabular-nums">#{eventLots.length}</span>
          </div>
        </div>

        {eventLots.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {eventLots.map((l: any) => (
              <LotCard 
                key={l.id} 
                lot={{
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
                  endsAt: l.end_date || event.end_date || "",
                  status: l.status as any,
                  eventStatus: event.status,
                  eventStartDate: event.start_date,
                  eventEndDate: event.end_date,
                  allowsPreBidding: event.allows_pre_bidding,
                  father: l.animal?.genealogy?.father,
                  mother: l.animal?.genealogy?.mother,
                  sex: l.animal?.sex,
                  color: l.animal?.color,
                  birthDate: l.animal?.birth_date,
                  seller: l.animal?.seller?.name,
                  location: l.animal?.location,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-[3rem] bg-white/5 border border-dashed border-white/10">
            <Gavel className="h-16 w-16 text-white/10 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground font-medium italic">Lotes em fase de preparação.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Acompanhe nossas redes para saber quando os lotes forem liberados.</p>
          </div>
        )}
      </section>
    </div>
  );
}
