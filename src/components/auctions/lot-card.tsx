import { Link } from "@tanstack/react-router";
import { Eye, Gavel } from "lucide-react";
import type { Lot } from "@/lib/mock-data";
import { formatBRL } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";
import { Countdown } from "./countdown";

export function LotCard({ lot }: { lot: Lot & { eventStartDate?: string } }) {
  const getDynamicStatus = () => {
    const now = new Date();
    const eventStart = lot.eventStartDate ? new Date(lot.eventStartDate) : null;
    
    if (lot.status === 'sold' || lot.status === 'finished') return 'sold';
    if (lot.status === 'active') return 'recebendo_lances';
    
    if (eventStart && now < eventStart) {
      return 'loteamento';
    }
    
    if (lot.status === 'upcoming' || lot.status === 'open') {
      return 'pre_lance';
    }
    
    return lot.status;
  };

  const dynamicStatus = getDynamicStatus();

  return (
    <Link
      to="/lotes/$lotId"
      params={{ lotId: lot.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-labelledby={`lot-title-${lot.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img 
          src={lot?.cover || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} 
          alt={lot?.name || "Animal"} 
          loading="lazy" 
          className="h-full w-full object-cover transition-smooth group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/90 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <StatusBadge status={dynamicStatus} />
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur">
          LOTE {lot?.number ? String(lot.number).padStart(2, "0") : "--"}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90" aria-label={`${lot?.viewers || 0} visualizações, ${lot?.bidsCount || 0} lances`}>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" /> {lot?.viewers || 0}</span>
          <span className="flex items-center gap-1"><Gavel className="h-3 w-3" aria-hidden="true" /> {lot?.bidsCount || 0} lances</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 id={`lot-title-${lot.id}`} className="font-semibold tracking-tight">{lot?.name || "Lote sem nome"}</h3>
          <p className="text-xs text-muted-foreground">
            {lot?.breed || "Raça não informada"} {lot?.category ? `· ${lot.category}` : ""}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lance atual</div>
            <div className="text-xl font-bold text-gradient-gold">{formatBRL(lot?.currentBid || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Encerra em</div>
            {lot?.endsAt ? (
              <Countdown endsAt={lot.endsAt} className="font-mono text-sm font-semibold text-foreground" />
            ) : (
              <span className="text-sm font-semibold text-foreground">--:--:--</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
