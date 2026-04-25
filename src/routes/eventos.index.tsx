import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
  import { EventCard } from "@/components/auctions/event-card";
  import { logger } from "@/utils/logger";
  import { supabase } from "@/integrations/supabase/client";
  import { eventSchema, ValidatedEvent } from "@/lib/schemas";
  import { z } from "zod";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEffectiveEventStatus } from "@/utils/auction-status";

export const Route = createFileRoute("/eventos/")({
  head: () => ({
    meta: [
      { title: "Eventos — Premium Agro Leilões" },
      { name: "description", content: "Calendário completo de leilões premium de cavalos, bovinos e embriões." },
      { property: "og:title", content: "Eventos — Premium Agro Leilões" },
      { property: "og:description", content: "Próximos leilões agropecuários premium do Brasil." },
    ],
  }),
    loader: async () => {
      logger.info("Iniciando carregamento da página de Eventos");
      try {
        const { data: events, error } = await supabase
          .from("events")
          .select("*, lots!lots_event_id_fkey(id)")
          .order("start_date");
   
        if (error) {
          logger.error("Erro Supabase ao carregar eventos", { error });
          throw error;
        }

        const validatedEvents = z.array(eventSchema).parse(events || []);
        logger.info("Eventos carregados e validados com sucesso", { count: validatedEvents.length });
        return { events: validatedEvents };
      } catch (error) {
        logger.error("Erro ao carregar página de Eventos", { error });
        throw error;
      }
    },
   component: EventsPage,
});

function EventsPage() {
   const { events } = Route.useLoaderData();
  const [filter, setFilter] = useState("all");
 
    const mappedEvents = events.map((e: ValidatedEvent) => ({
     id: e.id,
     slug: e.slug || "",
     name: e.name,
     description: e.description || "",
     date: e.start_date,
     city: e.location?.split("-")?.[0]?.trim() || "Brasil",
     state: e.location?.split("-")?.[1]?.trim() || "",
     cover: e.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80",
     status: e.status as any,
    end_date: e.end_date,
      lotsCount: e.lots?.length || 0,
     viewers: e.viewers || 0,
     bidsCount: 0,
     auctioneer: e.auctioneer_name || "",
     promoter: e.promoter_company || "",
   }));
 
  const filteredEvents = useMemo(() => {
    if (filter === "all") return mappedEvents;
    return mappedEvents.filter((e: any) => {
      const effectiveStatus = getEffectiveEventStatus({
        status: e.status,
        start_date: e.date,
        end_date: e.end_date
      });
      return effectiveStatus === filter;
    });
  }, [mappedEvents, filter]);

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Calendário de eventos</h1>
        <p className="mt-2 text-muted-foreground">Acompanhe todos os leilões em andamento e agendados.</p>
      </header>

      <div className="mb-8 overflow-x-auto scrollbar-hide pb-2">
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="bg-emerald-deep/20 border border-white/5 rounded-2xl p-1 inline-flex w-auto">
            <TabsTrigger value="all" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Todos</TabsTrigger>
            <TabsTrigger value="live" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Ao Vivo</TabsTrigger>
            <TabsTrigger value="scheduled" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Próximos</TabsTrigger>
            <TabsTrigger value="finished" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Encerrados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {filteredEvents.length === 0 ? (
           <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
             <p className="text-muted-foreground">Nenhum evento encontrado nesta categoria.</p>
           </div>
         ) : (
           filteredEvents.map((e: any) => <EventCard key={e.id} event={e as any} />)
         )}
      </div>
    </div>
  );
}
