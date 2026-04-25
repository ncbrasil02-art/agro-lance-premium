 import { createFileRoute } from "@tanstack/react-router";
  import { EventCard } from "@/components/auctions/event-card";
  import { logger } from "@/utils/logger";
  import { supabase } from "@/integrations/supabase/client";
  import { eventSchema, ValidatedEvent } from "@/lib/schemas";
  import { z } from "zod";

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
      lotsCount: e.lots?.length || 0,
     viewers: e.viewers || 0,
     bidsCount: 0,
     auctioneer: e.auctioneer_name || "",
     promoter: e.promoter_company || "",
   }));
 
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Calendário de eventos</h1>
        <p className="mt-2 text-muted-foreground">Acompanhe todos os leilões em andamento e agendados.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {mappedEvents.map((e: any) => <EventCard key={e.id} event={e as any} />)}
      </div>
    </div>
  );
}
