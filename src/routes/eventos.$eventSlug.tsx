import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, MapPin, Gavel, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { eventSchema } from "@/lib/schemas";
import { LotCard } from "@/components/auctions/lot-card";
import { StatusBadge } from "@/components/auctions/status-badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/eventos/$eventSlug")({
  loader: async ({ params }) => {
    const { data: event, error } = await supabase
      .from("events")
      .select("*, lots!lots_event_id_fkey(*, animal:animals(*))")
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
  const eventLots = event.lots || [];

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
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.8fr] items-start">
            {/* Main Rectangular Banner */}
            <div className="relative group mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-2 bg-gold/10 blur-3xl rounded-[2.5rem] opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-[2rem] md:rounded-[3rem] border-2 border-white/10 bg-emerald-deep shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:border-gold/30">
                <img 
                  src={event.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} 
                  alt={event.name} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
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
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <StatusBadge status={event.status} />
                {event.event_type && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/60">
                    {event.event_type}
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-7xl font-black tracking-tight text-white mb-6 uppercase leading-[0.9] italic">
                {event.name}
              </h1>
              
              <div className="relative mb-8">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gold rounded-full" />
                <p className="text-lg md:text-xl text-white/90 leading-relaxed font-medium italic pl-4">
                  {event.description || "Participe deste evento exclusivo com os melhores exemplares do agronegócio premium."}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Calendar, label: "Data/Hora", value: new Date(event.start_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { icon: MapPin, label: "Localização", value: event.location || "Online" },
                  { icon: Gavel, label: "Leiloeiro", value: event.auctioneer_name || "Convidado" },
                  { icon: Trophy, label: "Promotor", value: event.promoter_company || "Elite" },
                ].map((m) => (
                  <div key={m.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:bg-gold/5 hover:border-gold/20 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <m.icon className="h-3.5 w-3.5 text-gold" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gold/60">{m.label}</span>
                    </div>
                    <div className="text-sm font-bold text-white leading-snug line-clamp-1">{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                {event.status === "live" && (
                  <Link to="/ao-vivo" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full h-16 px-10 bg-gold-gradient text-emerald-deep font-black text-xl shadow-gold hover:scale-105 active:scale-95 transition-all rounded-2xl">
                      ASSISTIR AO VIVO
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold rounded-2xl">
                  Saber mais detalhes
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
