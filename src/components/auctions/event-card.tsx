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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant"
    >
      <div className="relative aspect-video overflow-hidden">
        <img src={event.cover} alt={event.name} loading="lazy" className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-emerald-deep/40 to-transparent" />
        <div className="absolute left-4 top-4">
          <StatusBadge status={event.status} />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white">{event.name}</h3>
          <p className="mt-1 text-sm text-white/80 line-clamp-2">{event.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-gold" />
          <span>{formatDateBR(event.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-gold" />
          <span>{event.city}/{event.state}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Gavel className="h-3.5 w-3.5 text-gold" />
          <span>{event.lotsCount} lotes</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-gold" />
          <span>{event.viewers.toLocaleString("pt-BR")} visualizações</span>
        </div>
      </div>
    </Link>
  );
}
