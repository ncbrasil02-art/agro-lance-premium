import { Link } from "@tanstack/react-router";
import { Eye, Gavel, Info, ChevronRight, ChevronLeft, MessageSquare, Play } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Lot } from "@/lib/mock-data";
import { formatBRL } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";
import { Countdown } from "./countdown";
import { useEffectiveLotStatus } from "@/utils/auction-status";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OfferDialog } from "./OfferDialog";

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

export function LotCard({ lot, settings: propSettings }: { 
  lot: Lot & { 
    eventStartDate?: string; 
    eventEndDate?: string; 
    allowsPreBidding?: boolean; 
    eventType?: string;
    eventStatus?: string;
    father?: string;
    mother?: string;
    sex?: string;
    color?: string;
    birthDate?: string;
    seller?: string;
    location?: string;
    winnerName?: string;
    acceptsOffers?: boolean;
    photos?: string[];
    youtube_url?: string;
    registration_number?: string;
    vaccination_records?: any;
  },
  settings?: any
}) {
  const [isUrgent, setIsUrgent] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const router = useRouter();
  const rootContext = router.state.matches.find(m => m.id === '__root__')?.context as any;
  
  const animations = useMemo(() => rootContext?.animations || {
    badge_blink: true,
    badge_glow: true,
    card_hover_tilt: true
  }, [rootContext?.animations]);

  const settings = useMemo(() => propSettings || rootContext?.lot_card_settings || {
    media_mode: 'gallery',
    displayed_fields: [
      { key: "father", label: "Pai", enabled: true },
      { key: "mother", label: "Mãe", enabled: true },
      { key: "sex", label: "Sexo", enabled: true },
      { key: "breed", label: "Raça", enabled: true },
      { key: "seller", label: "Vendedor", enabled: true }
    ]
  }, [propSettings, rootContext?.lot_card_settings]);
  
  const dynamicStatus = useEffectiveLotStatus({
    status: lot.status,
    event_status: lot.eventStatus,
    event_start_date: lot.eventStartDate,
    event_end_date: lot.eventEndDate,
    allows_pre_bidding: lot.allowsPreBidding
  });

  useEffect(() => {
    const checkUrgency = () => {
      const endsAt = lot.endsAt || lot.eventEndDate;
      if (!endsAt) return;
      const diff = new Date(endsAt).getTime() - Date.now();
      setIsUrgent(diff > 0 && diff < 600000);
    };
    
    const timer = setInterval(checkUrgency, 5000);
    checkUrgency();
    return () => clearInterval(timer);
  }, [lot.endsAt, lot.eventEndDate]);

  return (
    <div className="relative h-full flex">
      <Link
        to="/lotes/$lotId"
        params={{ lotId: lot.id }}
        className={`group relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-smooth hover-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${isUrgent ? 'animate-neon-urgent border-live/40 ring-1 ring-live/20' : dynamicStatus === 'recebendo_lances' ? 'animate-neon border-emerald-bright/40 ring-1 ring-emerald-bright/20' : ''}`}
        aria-labelledby={`lot-title-${lot.id}`}
      >
        <div className="relative overflow-hidden bg-muted aspect-[3/4] sm:aspect-square md:aspect-[3/4]">
          {settings.media_mode === 'video' && lot.youtube_url ? (
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
              <iframe 
                src={`https://www.youtube.com/embed/${lot.youtube_url.split('v=')[1]?.split('&')[0] || lot.youtube_url.split('/').pop()}?autoplay=0&mute=1&controls=0&loop=1&playlist=${lot.youtube_url.split('v=')[1]?.split('&')[0] || lot.youtube_url.split('/').pop()}`}
                className="w-full h-full pointer-events-none"
                allow="autoplay; encrypted-media"
                title="Animal Video"
              />
              <div className="absolute inset-0 bg-transparent z-10" />
            </div>
          ) : (
            <div className="relative h-full w-full">
              <OptimizedImage 
                src={(lot.photos && lot.photos.length > 0) ? lot.photos[currentPhotoIndex] : (lot?.cover || "")} 
                alt={lot?.name || "Animal"} 
                width={400}
                aspectRatio="portrait"
                category={lot?.breed?.toLowerCase().includes("milha") || lot?.breed?.toLowerCase().includes("mangalarga") ? "horse" : "cattle"}
                className="transition-smooth group-hover:scale-105 h-full w-full object-cover" 
              />
              
              {lot.photos && lot.photos.length > 1 && settings.media_mode === 'gallery' && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/40 border-white/20 backdrop-blur hover:bg-gold hover:text-emerald-deep"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentPhotoIndex((prev) => (prev === 0 ? lot.photos!.length - 1 : prev - 1));
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/40 border-white/20 backdrop-blur hover:bg-gold hover:text-emerald-deep"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentPhotoIndex((prev) => (prev === lot.photos!.length - 1 ? 0 : prev + 1));
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {lot.photos && lot.photos.length > 1 && settings.media_mode === 'gallery' && (
                <div className="absolute bottom-16 inset-x-0 flex justify-center gap-1 z-20">
                  {lot.photos.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 rounded-full transition-all ${idx === currentPhotoIndex ? 'w-4 bg-gold' : 'w-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/90 via-transparent to-transparent" />
          
          <div className="absolute left-3 top-3 flex flex-col gap-2.5 items-start">
            {(dynamicStatus === 'recebendo_lances' && lot.eventType === 'ao_vivo') && (
              <div className="flex items-center gap-1.5 rounded-full bg-live shadow-[0_0_25px_rgba(239,68,68,0.6)] px-3 py-1.5 text-[10px] font-black text-white animate-blink-fast border border-white/40 ring-2 ring-live/20">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                AO VIVO
              </div>
            )}
            <StatusBadge status={dynamicStatus} urgent={isUrgent} animations={animations} />
          </div>

          <div className={`absolute right-3 top-3 z-10 rounded-full bg-emerald-deep/90 px-2.5 py-1 text-[10px] font-black text-gold border border-gold/30 backdrop-blur shadow-gold/20 ${animations.badge_glow ? 'shadow-[0_0_10px_rgba(212,175,55,0.3)]' : ''}`}>
            LOTE {lot?.number ? String(lot.number).padStart(2, "0") : "--"}
          </div>

          {lot.acceptsOffers && (dynamicStatus === 'scheduled' || dynamicStatus === 'loteamento' || dynamicStatus === 'pre_lance') && (
            <div className="absolute top-[42px] right-3 z-20">
              <motion.div
                whileHover={{ scale: 1.1 }}
                animate={animations.badge_blink ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Button 
                  size="sm"
                  className={`bg-gold text-emerald-deep font-black gap-1 rounded-full shadow-gold h-7 text-[9px] px-3 border border-emerald-deep/20 ${animations.badge_glow ? 'shadow-[0_0_15px_rgba(212,175,55,0.4)]' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOfferOpen(true);
                  }}
                >
                  <MessageSquare className="h-3 w-3" />
                  FAZER UMA OFERTA
                </Button>
              </motion.div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 z-10">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" /> {lot?.viewers || 0}</span>
            {dynamicStatus === 'recebendo_lances' && (
              <span className={`bg-emerald-500/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${animations.badge_blink ? 'animate-pulse' : ''} ${animations.badge_glow ? 'shadow-[0_0_10px_rgba(16,185,129,0.4)]' : ''}`}>
                Recebendo Lance
              </span>
            )}
            <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Gavel className="h-3 w-3 text-gold" aria-hidden="true" /> 
              <span className="font-bold">{lot?.bidsCount || 0}</span> lances
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="mb-1 flex items-center gap-2">
            <AnimalIcon breed={lot.breed} />
            <motion.h3 
              initial={animations.animal_name_entry === 'slide-up' ? { y: 10, opacity: 0 } : animations.animal_name_entry === 'fade' ? { opacity: 0 } : {}}
              animate={{ y: 0, opacity: 1 }}
              className="font-bold text-lg leading-tight uppercase tracking-tight"
            >
              {lot?.name || "Lote sem nome"}
            </motion.h3>
          </div>

          <div className="grid grid-cols-1 gap-y-1.5 text-[11px] text-muted-foreground border-t border-border/50 pt-3 min-h-[140px]">
            {settings.displayed_fields
              .filter((f: any) => f.enabled)
              .map((field: any, idx: number) => {
                let value: any = lot[field.key as keyof typeof lot];
                
                // Formatting logic
                if (field.key === 'sex') {
                  value = value === 'M' ? 'Macho' : value === 'F' ? 'Fêmea' : value;
                } else if (field.key === 'birth_date' && value) {
                  value = new Date(value).toLocaleDateString('pt-BR');
                } else if (field.key === 'vaccination_records' && value) {
                  value = Array.isArray(value) ? `${value.length} vacinas` : "Sim";
                } else if (field.key === 'registration_number') {
                  value = value || lot.registration_number || "--";
                }

                const isLast = idx === settings.displayed_fields.filter((f: any) => f.enabled).length - 1;
                const isSeller = field.key === 'seller';

                return (
                  <div 
                    key={field.key} 
                    className={`flex justify-between items-center ${isLast ? 'pt-1 mt-1 border-t border-border/30' : ''}`}
                  >
                    <span className="font-medium uppercase">{field.label}:</span>
                    <span className={`font-semibold truncate ml-2 ${isSeller ? 'text-emerald-deep' : 'text-foreground'}`}>
                      {value || "--"}
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lance atual</div>
              <div className="text-xl font-bold text-gradient-gold">
                {formatBRL(lot?.currentBid || 0)}
              </div>
            </div>
            <div className="text-right">
              {dynamicStatus === 'sold' ? (
                <span className="text-sm font-bold text-gold uppercase italic">Arrematado</span>
              ) : (
                <Countdown endsAt={lot.endsAt || lot.eventEndDate || ""} className="font-mono text-sm font-semibold text-foreground" />
              )}
            </div>
          </div>
        </div>
      </Link>

      <OfferDialog 
        isOpen={isOfferOpen} 
        onOpenChange={setIsOfferOpen} 
        item={{
          id: lot.id,
          name: lot.name,
          price: lot.currentBid,
          type: 'lot'
        }}
      />
    </div>
  );
}
