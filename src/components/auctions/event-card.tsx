 import { Link } from "@tanstack/react-router";
 import { cn } from "@/lib/utils";
import { Calendar, MapPin, Users, Gavel, Timer } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { AuctionEvent } from "@/lib/mock-data";
import { formatDateBR } from "@/lib/mock-data";
import { StatusBadge } from "@/components/auctions/status-badge";
import { useEffectiveEventStatus } from "@/utils/auction-status";
import { Countdown } from "@/components/auctions/countdown";

 const AnimalIcon = ({ name, description }: { name?: string, description?: string }) => {
   const text = `${name} ${description}`.toLowerCase();
   const isHorse = text.includes("cavalo") || text.includes("egua") || text.includes("potro") || text.includes("quarto de milha") || text.includes("mangalarga");
   
   if (isHorse) {
     return (
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gold shrink-0">
         <path d="M19 19c-1.5-1-3-4-3-4s-1-4-1-6 1-3 1-3-2 0-4 1-2 2-2 2-1 3-1 4 1 6 1 6" />
         <path d="M5 19s1-1 1-6-1-4-1-4 2 0 4 1" />
         <path d="M11 9s-1-2-3-2-3 2-3 2 1 3 1 4" />
       </svg>
     );
   }
   const isCattle = text.includes("nelore") || text.includes("boi") || text.includes("vaca") || text.includes("touro") || text.includes("gado") || text.includes("angus");
   if (isCattle) {
     return (
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gold shrink-0">
         <path d="M17 11V6c0-1.1-.9-2-2-2h-6C7.9 4 7 4.9 7 6v5" />
         <path d="M3 13h18l-1.5 6H4.5L3 13z" />
         <path d="M7 11c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2" />
         <path d="M7 6l-3-3" />
         <path d="M17 6l3-3" />
       </svg>
     );
   }
   return <Gavel className="h-5 w-5 text-gold shrink-0" />;
 };
 
  import { useState, useEffect, MouseEvent } from "react";
  import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
  import { Maximize2 } from "lucide-react";
 
  export function EventCard({ event }: { event: AuctionEvent & { end_date?: string | null } }) {
   const [isUrgent, setIsUrgent] = useState(false);
    const [isFlyerOpen, setIsFlyerOpen] = useState(false);
   
   useEffect(() => {
     const checkUrgency = () => {
       const endsAt = event.end_date;
       if (!endsAt) return;
       const diff = new Date(endsAt).getTime() - Date.now();
       setIsUrgent(diff > 0 && diff < 600000);
     };
     const timer = setInterval(checkUrgency, 5000);
     checkUrgency();
     return () => clearInterval(timer);
   }, [event.end_date]);
 
  const effectiveStatus = useEffectiveEventStatus({
    status: event.status,
    start_date: event.date,
    end_date: event.end_date
  });

  return (
    <div className="group relative flex flex-col">
      <Link
        to="/eventos/$eventSlug"
        params={{ eventSlug: event.slug }}
        className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${isUrgent ? 'animate-neon-urgent border-live/40 ring-1 ring-live/20' : effectiveStatus === 'live' ? 'animate-neon border-emerald-bright/40 ring-1 ring-emerald-bright/20' : ''}`}
        aria-labelledby={`event-title-${event.id}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-emerald-deep/20">
          {/* Background Blur */}
          <OptimizedImage 
            src={event?.cover || ""} 
            alt="" 
            width={50}
            quality={10}
            category="event"
            className="absolute inset-0 h-full w-full object-cover blur-md opacity-30 scale-110" 
          />
          {/* Main Image */}
          <OptimizedImage 
            src={event?.cover || ""} 
            alt={event?.name || "Evento"} 
            width={800}
            category="event"
            className="h-full w-full object-cover transition-smooth group-hover:scale-105" 
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep via-emerald-deep/40 to-transparent" />
          
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-2.5 items-start">
            {((effectiveStatus === 'live' || event.status === 'recebendo_lances') && event.event_type === 'ao_vivo') && (
              <div className="flex items-center gap-1.5 rounded-full bg-live shadow-[0_0_25px_rgba(239,68,68,0.6)] px-3 py-1.5 text-[10px] font-black text-white animate-blink-fast border border-white/40 ring-2 ring-live/20">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                AO VIVO
              </div>
            )}
             <div className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1.5 text-[10px] font-black text-white border border-white/20 uppercase tracking-widest shadow-lg flex items-center gap-2">
               <span className={cn("h-1.5 w-1.5 rounded-full", event.event_type === 'ao_vivo' ? "bg-live animate-pulse" : "bg-emerald-bright")} />
               {event.event_type === 'ao_vivo' ? 'Ao Vivo' : 'Online'}
             </div>
            {effectiveStatus === 'scheduled' && event?.date && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-gold/30 px-2.5 py-1 text-[10px] font-bold text-gold shadow-lg">
                <Timer className="h-3 w-3" />
                <Countdown endsAt={event.date} className="font-mono" />
              </div>
            )}
          </div>

           <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-emerald-deep to-transparent z-20">
             {(['recebendo_lances', 'incondicional', 'em_condicional', 'live'].includes(effectiveStatus)) && (
               <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-[0.2em] border border-white/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                 <Gavel className="h-3 w-3" />
                 {effectiveStatus === 'incondicional' ? 'Evento Confirmado' : 
                  effectiveStatus === 'em_condicional' ? 'Em Condicional' : 
                  'Recebendo Lance'}
               </div>
             )}
            <div className="flex items-center gap-3 mb-2">
              <AnimalIcon name={event.name} description={event.description} />
              <h3 id={`event-title-${event.id}`} className="text-2xl font-black text-white uppercase leading-none tracking-tighter italic">
                {event?.name || "Evento sem nome"}
              </h3>
            </div>
            <p className="text-xs text-white/70 line-clamp-2 font-medium italic">
              {event?.description || "Leilão premium com curadoria genética de elite."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-gold" />
            <span suppressHydrationWarning>{event?.date ? formatDateBR(event.date) : "--"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            <span>{event?.city || ""}/{event?.state || ""}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gavel className="h-3.5 w-3.5 text-gold" />
            <span>{event?.lotsCount || 0} lotes</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-gold" />
            <span>{(event?.viewers || 0).toLocaleString("pt-BR")} visualizações</span>
          </div>
        </div>
      </Link>

      {/* Flyer Dialog Button - Positioned over the card */}
      <div 
        className="absolute top-4 right-4 z-40"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Dialog open={isFlyerOpen} onOpenChange={setIsFlyerOpen}>
          <DialogTrigger asChild>
            <button 
              className="rounded-lg bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-gold hover:text-emerald-deep transition-all flex items-center gap-2 shadow-xl group-hover:bg-black/80"
            >
              <Maximize2 className="h-3 w-3" />
              Ver Flyer
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-white/10">
            <div className="relative w-full h-full flex items-center justify-center p-4 min-h-[50vh]">
              <OptimizedImage 
                src={event?.cover || ""} 
                alt={event?.name || "Flyer do Evento"} 
                width={1600}
                className="max-w-full max-h-[90vh] object-contain" 
              />
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                 <div className="h-8 w-8 bg-white/10 rounded-lg p-1.5 backdrop-blur-md">
                    <img 
                      src="https://ccrslflbnxdazvadjlvj.supabase.co/storage/v1/object/public/public_assets/logo-0.9588475542778425.png" 
                      alt="Logo" 
                      className="h-full object-contain opacity-60"
                    />
                 </div>
                 <div className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-bold">
                   NC Agro Leilões - Documento Digital
                 </div>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
