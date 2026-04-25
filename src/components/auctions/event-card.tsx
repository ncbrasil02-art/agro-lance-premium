import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Users, Gavel } from "lucide-react";
import type { AuctionEvent } from "@/lib/mock-data";
import { formatDateBR } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";

export function EventCard({ event }: { event: AuctionEvent }) {
  return (
    <Link
      to="/eventos/$eventSlug"
       params={{ eventSlug: event.slug }}
       className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-labelledby={`event-title-${event.id}`}
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={event?.cover || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} 
          alt={event?.name || "Evento"} 
          loading="lazy" 
          className="h-full w-full object-cover transition-smooth group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-emerald-deep/40 to-transparent" />
        <div className="absolute left-4 top-4">
          <StatusBadge status={event?.status} />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 id={`event-title-${event.id}`} className="text-xl font-bold text-white">{event?.name || "Evento sem nome"}</h3>
          <p className="mt-1 text-sm text-white/80 line-clamp-2">{event?.description || ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 text-xs">
         <div className="flex items-center gap-2 text-muted-foreground" aria-label={`Data do evento: ${event?.date ? formatDateBR(event.date) : "--"}`}>
           <Calendar className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
          <span suppressHydrationWarning>{event?.date ? formatDateBR(event.date) : "--"}</span>
        </div>
         <div className="flex items-center gap-2 text-muted-foreground" aria-label={`Localização: ${event?.city || ""}/${event?.state || ""}`}>
           <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
          <span>{event?.city || ""}/{event?.state || ""}</span>
        </div>
         <div className="flex items-center gap-2 text-muted-foreground" aria-label={`Total de lotes: ${event?.lotsCount || 0}`}>
           <Gavel className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
          <span>{event?.lotsCount || 0} lotes</span>
        </div>
         <div className="flex items-center gap-2 text-muted-foreground" aria-label={`${(event?.viewers || 0).toLocaleString("pt-BR")} visualizações`}>
           <Users className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
          <span>{(event?.viewers || 0).toLocaleString("pt-BR")} visualizações</span>
        </div>
      </div>
    </Link>
  );
}
