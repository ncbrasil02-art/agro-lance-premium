import { Link } from "@tanstack/react-router";
 import { Eye, Gavel, Info, ChevronRight } from "lucide-react";
import type { Lot } from "@/lib/mock-data";
import { formatBRL } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";
import { Countdown } from "./countdown";
import { useEffectiveLotStatus } from "@/utils/auction-status";

 const AnimalIcon = ({ breed }: { breed?: string }) => {
   const b = breed?.toLowerCase() || "";
   const isHorse = b.includes("milha") || b.includes("mangalarga") || b.includes("cavalo") || b.includes("egua") || b.includes("potro") || b.includes("crioulo");
   
   if (isHorse) {
     return (
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gold shrink-0">
         <path d="M19 19c-1.5-1-3-4-3-4s-1-4-1-6 1-3 1-3-2 0-4 1-2 2-2 2-1 3-1 4 1 6 1 6" />
         <path d="M5 19s1-1 1-6-1-4-1-4 2 0 4 1" />
         <path d="M11 9s-1-2-3-2-3 2-3 2 1 3 1 4" />
       </svg>
     );
   }
   // Default to Cattle/Boi
   return (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gold shrink-0">
       <path d="M17 11V6c0-1.1-.9-2-2-2h-6C7.9 4 7 4.9 7 6v5" />
       <path d="M3 13h18l-1.5 6H4.5L3 13z" />
       <path d="M7 11c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2" />
       <path d="M7 6l-3-3" />
       <path d="M17 6l3-3" />
     </svg>
   );
 };
 
 export function LotCard({ lot }: { 
   lot: Lot & { 
     eventStartDate?: string; 
     eventEndDate?: string; 
     allowsPreBidding?: boolean; 
     eventStatus?: string;
     father?: string;
     mother?: string;
     sex?: string;
     color?: string;
     birthDate?: string;
     seller?: string;
     location?: string;
   } 
 }) {
  const dynamicStatus = useEffectiveLotStatus({
    status: lot.status,
    event_status: lot.eventStatus,
    event_start_date: lot.eventStartDate,
    event_end_date: lot.eventEndDate,
    allows_pre_bidding: lot.allowsPreBidding
  });

  return (
    <Link
      to="/lotes/$lotId"
      params={{ lotId: lot.id }}
       className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${dynamicStatus === 'recebendo_lances' ? 'animate-neon border-gold/40' : ''}`}
      aria-labelledby={`lot-title-${lot.id}`}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        <img 
          src={lot?.cover || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} 
          alt={lot?.name || "Animal"} 
          loading="lazy" 
          className="h-full w-full object-cover transition-smooth group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/90 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-col gap-2 items-start">
          <StatusBadge status={dynamicStatus} />
          {dynamicStatus === 'loteamento' && (
            <div className="group/info relative">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-gold backdrop-blur-md border border-gold/30 cursor-help">
                <Info className="h-3.5 w-3.5" />
              </div>
              <div className="absolute left-0 top-8 z-50 hidden w-48 rounded-xl bg-emerald-deep p-3 text-[10px] text-white/90 shadow-2xl border border-white/10 group-hover:block animate-in fade-in zoom-in-95">
                <p className="font-bold text-gold uppercase mb-1">Em Loteamento</p>
                {lot.eventStartDate ? (
                  <>Lances abrem em {new Date(lot.eventStartDate).toLocaleDateString('pt-BR')} às {new Date(lot.eventStartDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.</>
                ) : (
                  <>Lances ainda não abertos. Aguarde o início do evento.</>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="absolute right-3 top-3 z-10 rounded-full bg-background/80 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur shadow-sm">
          LOTE {lot?.number ? String(lot.number).padStart(2, "0") : "--"}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90" aria-label={`${lot?.viewers || 0} visualizações, ${lot?.bidsCount || 0} lances`}>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" /> {lot?.viewers || 0}</span>
          <span className="flex items-center gap-1"><Gavel className="h-3 w-3" aria-hidden="true" /> {lot?.bidsCount || 0} lances</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
         <div className="mb-1 flex items-center gap-2">
           <AnimalIcon breed={lot.breed} />
           <h3 id={`lot-title-${lot.id}`} className="font-bold text-lg leading-tight uppercase tracking-tight">{lot?.name || "Lote sem nome"}</h3>
         </div>

        <div className="grid grid-cols-1 gap-y-1.5 text-[11px] text-muted-foreground border-t border-border/50 pt-3">
          <div className="flex justify-between items-center">
            <span className="font-medium uppercase">Pai:</span>
            <span className="text-foreground font-semibold truncate ml-2">{lot.father || "--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium uppercase">Mãe:</span>
            <span className="text-foreground font-semibold truncate ml-2">{lot.mother || "--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium uppercase">Sexo:</span>
            <span className="text-foreground font-semibold uppercase">{lot.sex === 'M' ? 'Macho' : lot.sex === 'F' ? 'Fêmea' : lot.sex || "--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium uppercase">Raça:</span>
            <span className="text-foreground font-semibold">{lot.breed || "--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium uppercase">Pelagem:</span>
            <span className="text-foreground font-semibold">{lot.color || "--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium uppercase">Nasc.:</span>
            <span className="text-foreground font-semibold">{lot.birthDate ? new Date(lot.birthDate).toLocaleDateString('pt-BR') : "--"}</span>
          </div>
          <div className="flex justify-between items-center pt-1 mt-1 border-t border-border/30">
            <span className="font-medium uppercase">Vendedor:</span>
            <span className="text-emerald-deep font-bold truncate ml-2">{lot.seller || "--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium uppercase">Local:</span>
            <span className="text-foreground font-medium truncate ml-2 italic">{lot.location || "--"}</span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lance atual</div>
            <div className="text-xl font-bold text-gradient-gold">{formatBRL(lot?.currentBid || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {dynamicStatus === 'finished' || dynamicStatus === 'sold' ? 'Status' : 'Encerra em'}
            </div>
            {dynamicStatus === 'finished' || dynamicStatus === 'sold' ? (
              <span className="text-sm font-semibold text-muted-foreground uppercase">Encerrado</span>
            ) : lot.endsAt || lot.eventEndDate ? (
              <Countdown endsAt={lot.endsAt || lot.eventEndDate || ""} className="font-mono text-sm font-semibold text-foreground" />
            ) : (
              <span className="text-sm font-semibold text-foreground">--:--:--</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
