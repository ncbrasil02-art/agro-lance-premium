import { createFileRoute } from "@tanstack/react-router";
import { events } from "@/lib/mock-data";
import { EventCard } from "@/components/auctions/event-card";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Premium Agro Leilões" },
      { name: "description", content: "Calendário completo de leilões premium de cavalos, bovinos e embriões." },
      { property: "og:title", content: "Eventos — Premium Agro Leilões" },
      { property: "og:description", content: "Próximos leilões agropecuários premium do Brasil." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Calendário de eventos</h1>
        <p className="mt-2 text-muted-foreground">Acompanhe todos os leilões em andamento e agendados.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
    </div>
  );
}
