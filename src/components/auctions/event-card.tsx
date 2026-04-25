import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Users, Gavel, Timer } from "lucide-react";
import type { AuctionEvent } from "@/lib/mock-data";
import { formatDateBR } from "@/lib/mock-data";
import { StatusBadge } from "@/components/auctions/status-badge";
import { useEffectiveEventStatus } from "@/utils/auction-status";
import { Countdown } from "@/components/auctions/countdown";

export function EventCard({ event }: { event: AuctionEvent & { end_date?: string | null } }) {
  const effectiveStatus = useEffectiveEventStatus({
    status: event.status,
    start_date: event.date,
    end_date: event.end_date
  });

  return (
    <Link
      to="/eventos/$eventSlug"
       params={{ eventSlug: event.slug }}
       className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-labelledby={`event-title-${event.id}`}
    >
      <div className="relative aspect-video overflow-hidden bg-emerald-deep/20">
        {/* Background Blur */}
        <img 
          src={event?.cover || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} 
          alt="" 
          className="absolute inset-0 h-full w-full object-cover blur-md opacity-30 scale-110" 
        />
        {/* Main Image Contained */}
        <img 
          src={event?.cover || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} 
          alt={event?.name || "Evento"} 
          loading="lazy" 
          className="relative h-full w-full object-contain transition-smooth group-hover:scale-[1.02]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-emerald-deep/40 to-transparent" />
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 items-start">
          <StatusBadge status={effectiveStatus} />
          {effectiveStatus === 'scheduled' && event?.date && (
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-gold/30 px-2.5 py-1 text-[10px] font-bold text-gold shadow-lg animate-in fade-in slide-in-from-left-2">
              <Timer className="h-3 w-3" />
              <Countdown endsAt={event.date} className="font-mono" />
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-emerald-deep to-transparent">
          <h3 id={`event-title-${event.id}`} className="text-2xl font-black text-white uppercase leading-none tracking-tighter mb-2 italic">
            {event?.name || "Evento sem nome"}
          </h3>
          <p className="text-xs text-white/70 line-clamp-2 font-medium italic">
            {event?.description || "Leilão premium com curadoria genética de elite."}
          </p>
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
