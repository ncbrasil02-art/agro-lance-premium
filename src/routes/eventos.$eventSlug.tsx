import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, MapPin, Gavel, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LotCard } from "@/components/auctions/lot-card";
import { StatusBadge } from "@/components/auctions/status-badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/eventos/$eventSlug")({
  loader: async ({ params }) => {
    const { data: event, error } = await supabase
      .from("events")
      .select("*, lots(*, animal:animals(*))")
      .eq("slug", params.eventSlug)
      .single();

    if (error || !event) throw notFound();
    return { event };
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
    <>
      <section className="relative">
        <div className="relative h-72 overflow-hidden md:h-96">
          <img src={event.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        </div>
        <div className="container mx-auto -mt-32 px-4 relative">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <StatusBadge status={event.status} />
                <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{event.name}</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{event.description}</p>
              </div>
              {event.status === "live" && (
                <Link to="/ao-vivo">
                  <Button size="lg" className="bg-gold-gradient text-emerald-deep shadow-gold">Assistir ao vivo</Button>
                </Link>
              )}
            </div>

            <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Calendar, label: "Data", value: new Date(event.start_date).toLocaleString('pt-BR') },
                { icon: MapPin, label: "Local", value: event.location || "A definir" },
                { icon: Gavel, label: "Leiloeiro", value: event.auctioneer_name || "A definir" },
                { icon: Trophy, label: "Promotor", value: event.promoter_company || "A definir" },
              ].map((m) => (
                <div key={m.label} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient">
                    <m.icon className="h-4 w-4 text-emerald-deep" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                    <div className="text-sm font-semibold">{m.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Lotes do evento ({eventLots.length})</h2>
        {eventLots.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  endsAt: l.end_date || "",
                  status: l.status as any,
                }} 
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Lotes serão divulgados em breve.</p>
        )}
      </section>
    </>
  );
}
