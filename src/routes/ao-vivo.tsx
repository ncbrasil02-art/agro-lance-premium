import { MessageSquare, Phone, Info, FileText, Syringe, TreePine, Expand, ChevronLeft, ChevronRight, Eye, Radio, Users, Gavel, Volume2, Loader2, AlertTriangle, BadgeCheck, Ban, RefreshCw, Share2, Printer, ShieldAlert, XCircle, Zap, ZapOff, WifiOff } from "lucide-react";
import { preloadImages } from "@/utils/image-optimization";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { createFileRoute, Link } from "@tanstack/react-router";
 import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
 import { Countdown } from "@/components/auctions/countdown";
 import { StatusBadge } from "@/components/auctions/status-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-fallback";
import { SectionFallback } from "@/components/site/SectionFallback";
  import { supabase } from "@/integrations/supabase/client";
  import { formatBRL } from "@/utils/format";
  import { eventSchema, lotSchema } from "@/lib/schemas";
  import { z } from "zod";
import { useEffect, useState, useCallback, useMemo } from "react";
 import { toast } from "sonner";
  import { useRealtimeFallback } from "@/hooks/useRealtimeFallback";
 import { useAuth } from "@/components/auth/auth-provider";
import { motion, AnimatePresence } from "framer-motion";

  export const Route = createFileRoute("/ao-vivo")({
  head: () => ({
    meta: [
      { title: "Ao Vivo — Premium Agro Leilões" },
      { name: "description", content: "Assista aos leilões agropecuários ao vivo com lances em tempo real." },
      { property: "og:title", content: "Leilão ao Vivo" },
      { property: "og:description", content: "Transmissão em tempo real com lances instantâneos." },
    ],
  }),
   loader: async () => {
      try {
        const now = new Date();
        // First, search for ANY event that is live or scheduled today
        const { data: events, error: eventError } = await supabase
           .from("events")
           .select("*")
           .or("status.eq.live,status.eq.scheduled")
           .order("start_date", { ascending: true });

        if (eventError) {
          console.error("Erro ao buscar eventos ao vivo:", eventError);
          return { liveEvent: null };
        }

        if (!events || events.length === 0) {
          console.log("Nenhum evento live/scheduled encontrado no banco.");
          return { liveEvent: null };
        }

        // Priority 1: Event explicitly marked as 'live' that has an active lot
        let liveEvent = events.find(e => e.status === 'live' && e.active_lot_id);
        
        // Priority 2: Any event explicitly marked as 'live'
        if (!liveEvent) {
          liveEvent = events.find(e => e.status === 'live');
        }
        
        // Priority 3: Event starting soon (within 2 hours) or already started
        if (!liveEvent) {
          const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
          
          liveEvent = events.find(e => {
            const start = new Date(e.start_date);
            return start >= twoHoursAgo && start <= fourHoursFromNow;
          });
        }

        // Priority 4: Scheduled event that should be happening now
        if (!liveEvent) {
          liveEvent = events.find(e => {
            const start = new Date(e.start_date);
            const end = e.end_date ? new Date(e.end_date) : null;
            return now >= start && (!end || now < end);
          });
        }

        if (!liveEvent) {
          console.log("Nenhum evento atende aos critérios de 'ao vivo' no momento.");
          return { liveEvent: null };
        }

        // Manual fetch of the active lot since we removed the join in main query
        if (liveEvent.active_lot_id) {
          const eventAny = liveEvent as any;
          const { data: activeLotData } = await supabase
            .from("lots")
            .select("*")
            .eq("id", liveEvent.active_lot_id)
            .single();
          
          if (activeLotData) {
            // Manual fetch of animal for the lot
            if (activeLotData.animal_id) {
              const { data: animalData } = await supabase
                .from("animals")
                .select("*")
                .eq("id", activeLotData.animal_id)
                .single();
              (activeLotData as any).animal = animalData;
            }
            eventAny.active_lot = activeLotData;
          }
        }

        // Fallback: Auto-selection of active lot
        const eventAny = liveEvent as any;
        if (!eventAny.active_lot && liveEvent.status === 'live') {
          const { data: fallbackLot } = await supabase
            .from("lots")
            .select("*")
            .eq("event_id", liveEvent.id)
            .or("status.eq.active,status.eq.live")
            .order("lot_number", { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (fallbackLot) {
            if (fallbackLot.animal_id) {
              const { data: animalData } = await supabase
                .from("animals")
                .select("*")
                .eq("id", fallbackLot.animal_id)
                .single();
              (fallbackLot as any).animal = animalData;
            }
            eventAny.active_lot = fallbackLot;
            eventAny.active_lot_id = fallbackLot.id;
          }
        }

        let initialBids: any[] = [];
        if (liveEvent.active_lot_id) {
          const { data: bids, error: bidsError } = await supabase
            .from("bids")
            .select("*")
            .eq("lot_id", liveEvent.active_lot_id)
            .order("created_at", { ascending: false })
            .limit(10);
          
          if (!bidsError && bids) {
            initialBids = bids;
          }
        }

        // Skip strict validation to avoid "Waiting for Transmission" due to minor schema mismatches
        return { 
          liveEvent: liveEvent as any,
          initialBids
        };
      } catch (err) {
        console.error("Erro fatal no loader ao-vivo:", err);
        return { liveEvent: null };
      }
    },
   component: LivePage,
   pendingComponent: PageSkeleton,
   errorComponent: ErrorFallback,
});

  function LivePage() {
    const { liveEvent: initialEvent, initialBids } = Route.useLoaderData() as any;
    const rootContext = Route.useRouteContext() as any;
    const animations = useMemo(() => rootContext.animations || {
      badge_blink: true,
      badge_glow: true,
      bid_button_pulse: true,
      animal_name_entry: "slide-up"
    }, [rootContext.animations]);

   const { user, profile } = useAuth();
   const [liveEvent, setLiveEvent] = useState(initialEvent);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("connected");
  const [lastSyncAt, setLastSyncAt] = useState<Date>(new Date());
  const [syncTrigger, setSyncTrigger] = useState(0);
  // pollingRetryCount removido pois agora é controlado pelo hook useRealtimeFallback
   const [reconnectTrigger, setReconnectTrigger] = useState(0);
   const [isFavorite, setIsFavorite] = useState(false);
   const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
 
   useEffect(() => {
     if (user && liveEvent?.active_lot_id) {
       supabase
         .from("followed_lots")
         .select("id")
         .eq("user_id", user.id)
         .eq("lot_id", liveEvent.active_lot_id)
         .maybeSingle()
         .then(r => setIsFavorite(!!r.data));
     }
   }, [user, liveEvent?.active_lot_id]);
 
   const toggleFavorite = async () => {
     if (!user) {
       toast.error("Faça login para seguir lotes.");
       return;
     }
     if (!liveEvent?.active_lot_id) return;
     
     setIsFavoriteLoading(true);
     try {
       if (isFavorite) {
         await supabase
           .from("followed_lots")
           .delete()
           .eq("user_id", user.id)
           .eq("lot_id", liveEvent.active_lot_id);
         setIsFavorite(false);
         toast.success("Lote removido dos seus favoritos.");
       } else {
         await supabase
           .from("followed_lots")
           .insert({
             user_id: user.id,
             lot_id: liveEvent.active_lot_id
           });
         setIsFavorite(true);
         toast.success("Lote adicionado aos seus favoritos!");
       }
     } catch (e) {
       toast.error("Erro ao processar favorito.");
     } finally {
       setIsFavoriteLoading(false);
     }
   };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Conexão restabelecida", { description: "Sincronizando dados..." });
      setSyncTrigger(prev => prev + 1); // Trigger immediate refresh
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Você está offline", { description: "Os lances podem não estar atualizados." });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

    // Preload animal photos
    useEffect(() => {
      if (liveEvent?.active_lot?.animal?.photos) {
        preloadImages(liveEvent.active_lot.animal.photos, { width: 1000 });
      }
    }, [liveEvent?.active_lot_id]);

  const [bids, setBids] = useState<any[]>(initialBids || []);
  const [bidderProfiles, setBidderProfiles] = useState<Record<string, any>>({});
     // Increment viewer count when page loads or lot changes
     useEffect(() => {
       if (liveEvent?.id) {
         supabase.rpc("increment_viewer_count", {
           p_entity_id: liveEvent.id,
           p_entity_type: 'event'
         });
       }
       
       if (liveEvent?.active_lot_id) {
         // @ts-ignore
         supabase.rpc("increment_lot_viewers", {
           p_lot_id: liveEvent.active_lot_id
         });
       }
     }, [liveEvent?.id, liveEvent?.active_lot_id]);

    // Pre-populate profile cache from initial bids to avoid extra queries
    useEffect(() => {
      if (initialBids?.length > 0) {
        const initialProfiles: Record<string, any> = {};
        initialBids.forEach((bid: any) => {
          if (bid.profile) {
            initialProfiles[bid.profile.id] = bid.profile;
          }
        });
        setBidderProfiles(prev => ({ ...prev, ...initialProfiles }));
      }
    }, [initialBids]);

    const [isBidding, setIsBidding] = useState(false);
    const [showConfirmBid, setShowConfirmBid] = useState(false);
    const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
   const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const nextPhoto = (photos: string[]) => {
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (photos: string[]) => {
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };
 
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      // Fix common malformed URLs (duplicate https, etc)
      let cleanUrl = url.trim();
      if (cleanUrl.includes("https:/https:/")) {
        cleanUrl = cleanUrl.replace("https:/https:/", "https://");
      }
      if (cleanUrl.includes("http:/http:/")) {
        cleanUrl = cleanUrl.replace("http:/http:/", "http://");
      }
      // If it contains multiple full URLs, take the last one
      if (cleanUrl.lastIndexOf("https://") > 0) {
        cleanUrl = cleanUrl.substring(cleanUrl.lastIndexOf("https://"));
      }

      if (cleanUrl.includes("youtube.com/embed/") || cleanUrl.includes("player.vimeo.com")) return cleanUrl;
      
      // Youtube long URL
      if (cleanUrl.includes("youtube.com/watch")) {
        const v = new URLSearchParams(cleanUrl.split('?')[1]).get("v");
        if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&mute=1&rel=0`;
      }
      
      // Youtube short URL
      if (cleanUrl.includes("youtu.be/")) {
        const id = cleanUrl.split("youtu.be/")[1]?.split("?")[0];
        if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0`;
      }
      
      // Vimeo
      if (cleanUrl.includes("vimeo.com/")) {
        const id = cleanUrl.split("vimeo.com/")[1]?.split("?")[0];
        if (id) return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1`;
      }
      return cleanUrl;
    } catch (e) {
      console.error("Erro ao processar URL de vídeo:", e);
      return url;
    }
  };
    // Secondary effect to ensure lot data is loaded if only ID is present
    useEffect(() => {
      if (liveEvent && liveEvent.active_lot_id && !liveEvent.active_lot) {
        const fetchMissingLot = async () => {
          const { data } = await supabase
            .from("lots")
            .select("*, animal:animals(*)")
            .eq("id", liveEvent.active_lot_id as string)
            .single();
          if (data) {
            setLiveEvent((prev: any) => prev ? ({ ...prev, active_lot: data }) : null);
          }
        };
        fetchMissingLot();
      }
    }, [liveEvent?.active_lot_id, liveEvent?.active_lot]);


    useEffect(() => {
      // Listen for updates to ANY event that could become live if we don't have one
      const uniqueGlobalId = `global-events-status-${Math.random().toString(36).slice(2, 9)}`;
      const globalChannel = supabase
        .channel(uniqueGlobalId)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "events" },
          async (payload) => {
            // If we don't have a live event, and an event just became 'live', or if a scheduled event updated
            if (!liveEvent) {
              if (payload.new.status === 'live' || payload.new.transmission_link) {
                console.log("Detectado novo evento ao vivo ou link, recarregando...");
                window.location.reload();
                return;
              }
            }
            
            // If it's our current event being updated
            if (liveEvent && payload.new.id === liveEvent.id) {
              const { data } = await supabase
                .from("events")
                .select("*, active_lot:lots!events_active_lot_id_fkey(*, animal:animals!lots_animal_id_fkey(*))")
                .eq("id", liveEvent.id)
                .single();
              
               if (data) {
                 // Detect if it was a force refresh or just an event update
                 const newActiveLotId = payload.new.active_lot_id;
                 const currentActiveLotId = liveEvent.active_lot_id;
                 const lotChanged = newActiveLotId !== currentActiveLotId;

                 setLiveEvent(data as any);

                 if (!lotChanged) {
                   console.log("Comando de atualização ou sincronização recebido do Administrador.", payload.new.updated_at);
                   toast.info("Sincronizando dados em tempo real...", { 
                     icon: <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />,
                     duration: 2000 
                   });
                   setSyncTrigger(prev => prev + 1);
                 }
                
                // Handle status messages - trigger even if message is the same to allow repeating "Dou-lhe uma!"
                if (payload.new.live_status_message) {
                  // Small trick: if it's the same message, clear it first to re-trigger the animation
                  setStatusMessage(null);
                  setTimeout(() => {
                    setStatusMessage(payload.new.live_status_message);
                    // Auto-clear after 8 seconds
                    setTimeout(() => setStatusMessage(null), 8000);
                  }, 50);
                }
                
                // If active lot changed, fetch bids for the new lot and reset state
                if (payload.new.active_lot_id !== payload.old?.active_lot_id) {
                  console.log("Lote alterado em tempo real:", payload.new.active_lot_id);
                  setActivePhotoIndex(0);
                  
                   if (!payload.new.active_lot_id) {
                     setBids([]);
                   } else {
                     // Pequeno delay para garantir que o banco processou a transação de ativação do lote
                     // e evitar race conditions com lances que ocorrem no exato momento da troca
                     setTimeout(async () => {
                        const { data: newBids } = await supabase
                          .from("bids")
                          .select("*, profile:profiles!bids_user_id_fkey(id, full_name)")
                          .eq("lot_id", payload.new.active_lot_id)
                          .order("created_at", { ascending: false })
                          .limit(15);
                       
                       if (newBids) {
                         setBids(prev => {
                           // Mesclar com lances que podem ter chegado via Realtime durante o fetch
                           const merged = [...newBids];
                           prev.forEach(pb => {
                             if (pb.lot_id === payload.new.active_lot_id && !merged.some(mb => mb.id === pb.id)) {
                               merged.push(pb);
                             }
                           });
                           return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);
                         });
                         
                         const newProfiles: Record<string, any> = {};
                         newBids.forEach((bid: any) => {
                           if (bid.profile) {
                             newProfiles[bid.profile.id] = bid.profile;
                           }
                         });
                         setBidderProfiles(prev => ({ ...prev, ...newProfiles }));
                       }
                     }, 500);
                   }
                  
                  toast.info("Próximo lote entrando no ar!", { 
                    description: "A tela será atualizada automaticamente.",
                    duration: 3000 
                  });
                }
              }
            }
          }
        )
        .subscribe();

      // Specific channel for the active lot to catch price and bid count updates
      let lotChannel: any = null;
      if (liveEvent?.active_lot_id) {
        const lotUniqueId = `lot-updates-${liveEvent.active_lot_id}-${Math.random().toString(36).slice(2, 9)}`;
        lotChannel = supabase
          .channel(lotUniqueId)
          .on(
            "postgres_changes",
            { 
              event: "UPDATE", 
              schema: "public", 
              table: "lots", 
              filter: `id=eq.${liveEvent.active_lot_id}` 
            },
            (payload) => {
              console.log("Lote atualizado em tempo real:", payload.new);
              
              // Notify if status changed
              if (payload.new.status !== payload.old?.status) {
                if (payload.new.status === 'sold') {
                  toast.success("LOTE ARREMATADO!", {
                    description: `O lote #${payload.new.lot_number} foi vendido com sucesso.`,
                    duration: 5000
                  });
                } else if (payload.new.status === 'passed') {
                  toast.info("LOTE FINALIZADO", {
                    description: `O lote #${payload.new.lot_number} foi finalizado sem venda.`,
                    duration: 5000
                  });
                }
              }

              setLiveEvent((prev: any) => {
                if (!prev || !prev.active_lot) return prev;
                return {
                  ...prev,
                  active_lot: {
                    ...prev.active_lot,
                    ...payload.new,
                    // Preserve animal data which isn't in the lot update payload
                    animal: prev.active_lot.animal
                  }
                };
              });
            }
          )
          .subscribe();
      }

      // Specific bids channel for the active lot - listens for ALL changes (INSERT, UPDATE)
      let bidsChannel: any = null;
      if (liveEvent?.active_lot_id) {
        console.log("Subscribing to bids for lot:", liveEvent.active_lot_id);
        const bidsUniqueId = `live-bids-${liveEvent.active_lot_id}-${Math.random().toString(36).slice(2, 9)}`;
        bidsChannel = supabase
          .channel(bidsUniqueId)
          .on(
            "postgres_changes",
            { 
              event: "*", 
              schema: "public", 
              table: "bids", 
              filter: `lot_id=eq.${liveEvent.active_lot_id}` 
            },
            async (payload: any) => {
              console.log("Bid change detected:", payload.eventType, payload.new);
              
               console.log("Bid change detected:", payload.eventType, payload.new);
               
               if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                 const newBid = payload.new;
                 
                 // Update bids list
                 setBids((prev: any[]) => {
                   const exists = prev.some((b: any) => b.id === newBid.id);
                   let updated;
                   if (exists) {
                     updated = prev.map((b: any) => b.id === newBid.id ? { ...b, ...newBid } : b);
                   } else {
                     updated = [newBid, ...prev];
                   }
                   return updated
                     .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                     .slice(0, 20);
                 });
 
                 // Update active lot price if this is a newer/higher bid
                 setLiveEvent((prev: any) => {
                   if (!prev || !prev.active_lot || prev.active_lot.id !== newBid.lot_id) return prev;
                   
                   const currentPrice = prev.active_lot.current_price || 0;
                   const isNewer = newBid.amount >= currentPrice;
                   
                   return {
                     ...prev,
                     active_lot: {
                       ...prev.active_lot,
                       current_price: isNewer ? newBid.amount : currentPrice,
                       // Only increment count on INSERT
                       bids_count: payload.eventType === "INSERT" 
                         ? (prev.active_lot.bids_count || 0) + 1 
                         : prev.active_lot.bids_count
                     }
                   };
                 });
                 
                  // Notify user if it's a new bid
                  if (payload.eventType === "INSERT") {
                    setBids(prevBids => {
                      // Check if outbidding current user
                      const isOutbiddingMe = user && prevBids.length > 0 && prevBids[0].user_id === user.id && newBid.user_id !== user.id;

                      if (isOutbiddingMe) {
                        // Tocar som de alerta
                        try {
                          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                          audio.volume = 0.5;
                          audio.play();
                        } catch (e) {
                          console.error("Erro ao tocar som:", e);
                        }

                        toast.error("VOCÊ FOI SUPERADO!", {
                          description: `Seu lance no lote #${liveLot?.lot_number} foi superado por ${formatBRL(newBid.amount)}.`,
                          icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
                          duration: 6000
                        });
                      } else {
                        toast.info(`Novo lance: ${formatBRL(newBid.amount)}`, {
                          description: newBid.bidder_name || "Licitante",
                          icon: <Gavel className="h-4 w-4 text-gold" />,
                          duration: 3000
                        });
                      }
                      return prevBids;
                    });
                  }
               } else if (payload.eventType === "DELETE") {
                const updatedBid = payload.new;
                setBids((prev: any[]) => 
                  prev.map((b: any) => b.id === updatedBid.id ? { ...b, ...updatedBid } : b)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                );
              } else if (payload.eventType === "DELETE") {
                setBids(prev => prev.filter(b => b.id !== payload.old.id));
              }
            }
          )
          .subscribe((status) => {
            console.log("Bid channel status:", status);
            setRealtimeStatus(status);
          });
      }

      // Real-time profiles subscription to update names in the history
      const profilesUniqueId = `live-profiles-sync-${Math.random().toString(36).slice(2, 9)}`;
      const profilesChannel = supabase
        .channel(profilesUniqueId)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles" },
          (payload) => {
            const updatedProfile = payload.new;
            setBidderProfiles(prev => {
              if (!prev[updatedProfile.id]) return prev;
              return { ...prev, [updatedProfile.id]: updatedProfile };
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(globalChannel);
        if (lotChannel) supabase.removeChannel(lotChannel);
        if (bidsChannel) supabase.removeChannel(bidsChannel);
        supabase.removeChannel(profilesChannel);
      };
    }, [liveEvent?.id, liveEvent?.active_lot_id, reconnectTrigger]);

    // Centralized refresh function with error tracking
    const refreshAllData = async () => {
      if (!liveEvent?.id) return;
      
      try {
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("viewers, active_lot:lots!active_lot_id(id, current_price, bids_count)")
          .eq("id", liveEvent.id)
          .single();
        
        if (eventError) throw eventError;

        if (eventData) {
          setLiveEvent((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              viewers: eventData.viewers,
              active_lot: prev.active_lot ? {
                ...prev.active_lot,
                current_price: (eventData.active_lot as any)?.current_price ?? prev.active_lot.current_price,
                bids_count: (eventData.active_lot as any)?.bids_count ?? prev.active_lot.bids_count,
              } : null
            };
          });

          const activeLotId = (eventData.active_lot as any)?.id || liveEvent.active_lot_id;
          if (activeLotId) {
            const { data: latestBids } = await supabase
              .from("bids")
              .select("*")
              .eq("lot_id", activeLotId)
              .order("created_at", { ascending: false })
              .limit(10);
            
             if (latestBids) {
               setBids(prev => {
                 // Mesclar para não perder lances que chegaram via Realtime durante o fetch
                 const merged = [...latestBids];
                 prev.forEach(pb => {
                   if (pb.lot_id === activeLotId && !merged.some(mb => mb.id === pb.id)) {
                     merged.push(pb);
                   }
                 });
                 return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);
               });
 
               const newProfiles: Record<string, any> = {};
               latestBids.forEach((bid: any) => {
                 if (bid.profile) newProfiles[bid.profile.id] = bid.profile;
               });
               setBidderProfiles(prev => ({ ...prev, ...newProfiles }));
             }
          }
          setLastSyncAt(new Date());
        }
      } catch (err) {
        console.error("Erro ao sincronizar dados:", err);
      }
    };

    const handleRefresh = useCallback(() => {
      refreshAllData();
    }, [liveEvent?.id]);

    const { delaySeconds, isPolling } = useRealtimeFallback({
      status: realtimeStatus,
      onUpdate: handleRefresh,
      label: "Leilão ao Vivo",
      // Polling agressivo se estiver online sem realtime
      initialPollInterval: isOffline ? 30000 : 2000,
      pollInterval: isOffline ? 60000 : 5000,
      maxInterval: isOffline ? 120000 : 15000,
      backoffFactor: 1.3
    });

    useEffect(() => {
      if (syncTrigger > 0) {
        refreshAllData();
      }
    }, [syncTrigger]);

    // Monitor realtime status and nudge reconnection if stuck
    useEffect(() => {
      if (realtimeStatus !== "SUBSCRIBED" && !isOffline) {
        // If we are not subscribed but we ARE online, wait a bit and then nudge reconnection
        const nudgeTimeout = setTimeout(() => {
          console.log("Realtime connection seems stuck, nudging...");
          setReconnectTrigger(prev => prev + 1);
        }, 15000); // 15 seconds of "stuck" state
        return () => clearTimeout(nudgeTimeout);
      }
    }, [realtimeStatus, isOffline]);
 
   const liveLot = liveEvent?.active_lot;

  // Atualizar título da aba dinamicamente conforme o status do lote
  useEffect(() => {
    const baseTitle = liveEvent?.name || "Ao Vivo";
    if (liveLot?.status === 'sold') {
      document.title = `LOTE ARREMATADO! — ${baseTitle}`;
    } else if (liveLot?.status === 'passed') {
      document.title = `LOTE FINALIZADO — ${baseTitle}`;
    } else if (liveLot?.status === 'active') {
      document.title = `🔴 AO VIVO: ${liveLot.animal?.name || baseTitle}`;
    } else {
      document.title = `${baseTitle} — Premium Agro Leilões`;
    }
  }, [liveLot?.status, liveLot?.animal?.name, liveEvent?.name]);
 
    const executeBid = async (amount: number) => {
      if (liveLot?.status === 'sold' || liveLot?.status === 'passed') {
        toast.error("Lote já finalizado. Não é mais possível dar lances.");
        return;
      }

      setIsBidding(true);
      try {
        const { data, error } = await supabase.rpc("place_bid_safe", {
          p_lot_id: (liveLot as any).id,
          p_amount: amount,
          p_bid_type: "online",
          p_session_id: "live-session",
        });

        if (error) throw error;

        const result = data as { success: boolean; message: string; previous_bidder_id?: string };
        if (result.success) {
          toast.success(result.message);

          // Enviar notificação por e-mail se houver um licitante anterior superado
          if (result.previous_bidder_id && user && result.previous_bidder_id !== user.id) {
            supabase.functions.invoke('user-notifications', {
              body: {
                userId: result.previous_bidder_id,
                type: 'outbid',
                lotId: liveLot?.id,
                data: {
                  amount: amount,
                  lotNumber: liveLot?.lot_number,
                  animalName: liveLot?.animal?.name
                }
              }
            }).catch(err => console.error("Erro ao enviar e-mail de outbid:", err));
          }

          // Fetch latest lot data immediately after a successful bid
          if (liveEvent?.active_lot_id) {
            const { data: latestLot } = await supabase
              .from("lots")
              .select("*, animal:animals(*)")
              .eq("id", liveEvent.active_lot_id)
              .single();
            if (latestLot) {
              setLiveEvent((prev: any) => prev ? ({ ...prev, active_lot: latestLot }) : prev);
            }
          }
        } else {
          toast.error(result.message, {
            duration: 6000,
            icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
          });
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao efetuar lance.");
      } finally {
        setIsBidding(false);
      }
    };

    const placeBid = (amount: number) => {
      if (!user) {
        toast.error("Você precisa estar logado para dar lances.");
        return;
      }
      if (!profile?.is_approved) {
        toast.error("Sua conta ainda não foi aprovada para dar lances.");
        return;
      }
      setPendingBidAmount(amount);
      setShowConfirmBid(true);
    };
 
   const currentPrice = liveLot?.current_price || liveLot?.starting_price || 0;
 
  if (!liveEvent) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Radio className="h-16 w-16 text-gold animate-pulse mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-emerald-deep uppercase tracking-tighter">Aguardando Transmissão</h1>
        <p className="mt-4 text-muted-foreground max-w-md mx-auto">
          Não há leilões ativos no momento. Fique atento às nossas redes sociais e ao calendário para os próximos eventos.
        </p>
        <Link to="/eventos" className="mt-8 inline-block">
          <Button className="bg-gold-gradient text-emerald-deep font-bold px-8 py-6 rounded-xl shadow-gold hover:scale-105 transition-transform">
            Ver calendário de eventos
          </Button>
        </Link>
      </div>
    );
  }

  if (!liveLot) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-4">
          <span className="text-xs font-bold text-gold uppercase tracking-widest animate-pulse">● Evento ao Vivo</span>
        </div>
        <h1 className="text-3xl font-extrabold text-emerald-deep md:text-5xl mb-2">{liveEvent.name}</h1>
        <p className="text-muted-foreground mb-8">{liveEvent.location || "Transmissão Online"}</p>
        
        <div className="mt-8 relative aspect-video max-w-4xl mx-auto overflow-hidden rounded-3xl border-4 border-gold/30 bg-emerald-deep shadow-2xl flex flex-col items-center justify-center group">
          {liveEvent.transmission_link ? (
            <iframe
              className="h-full w-full border-0"
              src={getEmbedUrl(liveEvent.transmission_link)}
              title="Transmissão ao Vivo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-center p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gold/20 rounded-full blur-2xl animate-pulse" />
                <Loader2 className="h-16 w-16 text-gold animate-spin relative z-10 mx-auto" />
              </div>
              <p className="text-gold font-black text-2xl uppercase tracking-tighter">Aguardando Transmissão</p>
              <p className="text-white/60 mt-3 max-w-xs mx-auto">O leiloeiro está preparando o sinal de vídeo e o próximo lote para entrar no ar.</p>
            </div>
          )}
        </div>
        
        <div className="mt-12 p-6 rounded-2xl bg-gold/5 border border-gold/10 max-w-2xl mx-auto">
          <p className="text-emerald-deep font-medium italic">
            "A transmissão continuará em instantes. Aproveite para conferir os detalhes dos animais no catálogo enquanto aguardamos a próxima oferta."
          </p>
        </div>
      </div>
    );
  }

    return (
     <div className="container mx-auto px-4 py-8">
      <AlertDialog open={showConfirmBid} onOpenChange={setShowConfirmBid}>
        <AlertDialogContent className="bg-emerald-deep border-gold/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gold">
              <AlertTriangle className="h-5 w-5" /> Confirmar Lance Ao Vivo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80">
               Deseja realmente confirmar o lance de <span className="text-white font-bold">{formatBRL(pendingBidAmount || 0)}</span> para o lote <span className="text-white font-bold">#{liveLot.lot_number}</span>?
               <br /><br />
               {bids?.[0]?.is_phone_bid && (
                 <div className="flex items-center gap-2 bg-white/10 p-2 rounded text-xs">
                   <Phone className="h-3 w-3 text-gold" />
                   <span>Último lance recebido via telefone</span>
                 </div>
               )}
              <br /><br />
              <span className="text-xs italic font-bold text-gold">Lances em leilão ao vivo são definitivos e irrevogáveis.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-gold text-emerald-deep hover:bg-gold/90 font-bold"
              onClick={() => {
                if (pendingBidAmount) executeBid(pendingBidAmount);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <StatusBadge 
            status={liveLot?.status === 'sold' || liveLot?.status === 'passed' ? liveLot.status : 'live'} 
            urgent={liveLot?.status !== 'sold' && liveLot?.status !== 'passed'}
            className="px-4 py-1.5"
          />
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{liveEvent.name}</h1>
           <div className="flex flex-col gap-1">
             <p className="text-sm text-muted-foreground italic line-clamp-1">{liveEvent.description || "Transmissão ao vivo do leilão premium."}</p>
             <p className="text-xs text-gold/60 font-bold uppercase tracking-wider">Leiloeiro: {liveEvent.auctioneer_name || "A definir"} · {liveEvent.promoter_company || "A definir"}</p>
           </div>
        </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-help ${isOffline ? 'bg-destructive/10 border-destructive/30 text-destructive' : isPolling ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'}`}>
                    {isOffline ? (
                      <WifiOff className="h-3.5 w-3.5 animate-pulse" />
                    ) : isPolling ? (
                      <ZapOff className="h-3.5 w-3.5 animate-pulse" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                      {isOffline ? 'Offline' : isPolling ? 'Polling' : 'Realtime'}
                    </span>
                    {delaySeconds > 0 && <span className="text-[9px] opacity-70 border-l border-current pl-2 ml-1 pr-1">{delaySeconds}s</span>}
                    <div 
                      className="h-5 w-5 rounded-full hover:bg-current/10 flex items-center justify-center transition-colors ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshAllData();
                        toast.success("Dados sincronizados com sucesso!");
                      }}
                      title="Recarregar dados manualmente"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  <p className="font-bold mb-1">Status da Transmissão</p>
                  <p className="text-muted-foreground">
                    {isOffline ? "Sem conexão com a internet." : isPolling ? "WebSocket instável. Usando redundância de polling para garantir que você não perca nenhum lance." : "Conectado ao servidor Elite. Recebendo lances instantaneamente."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-deep/5 border border-emerald-deep/10 text-muted-foreground">
              <Users className="h-4 w-4 text-gold" /> 
              <span className="font-bold">{(liveEvent.viewers || 0).toLocaleString("pt-BR")}</span> assistindo
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-deep/5 border border-emerald-deep/10 text-muted-foreground">
              <Gavel className="h-4 w-4 text-gold" /> 
              <span className="font-bold">{liveEvent.active_lot?.bids_count || 0}</span> lances
            </div>
            {liveEvent.active_lot?.viewers !== undefined && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-deep/5 border border-emerald-deep/10 text-muted-foreground">
                <Radio className="h-4 w-4 text-gold" /> 
                <span className="font-bold">{(liveEvent.active_lot.viewers || 0).toLocaleString("pt-BR")}</span> visualizações
              </div>
            )}
         </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] flex-col lg:flex-row">
        {/* Player + Lote em destaque */}
        <ErrorBoundary tag="live-player" fallback={<SectionFallback title="Transmissão" message="Falha ao carregar o player de vídeo." variant="error" />}>
          <div className="space-y-6 order-1 flex flex-col">
           <div className="relative aspect-video overflow-hidden rounded-2xl border border-gold/30 bg-emerald-deep shadow-elegant">
             {liveEvent.transmission_link ? (
               <iframe
                 className="h-full w-full border-0"
                 src={getEmbedUrl(liveEvent.transmission_link)}
                 title="Transmissão ao Vivo"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-emerald-deep via-emerald-deep/40 to-transparent text-center">
                 <OptimizedImage 
                   src={liveLot.animal?.photos?.[0] || ""} 
                   alt={liveLot.animal?.name || "Animal"} 
                   width={1280}
                   category={liveLot.animal?.breed?.toLowerCase().includes("milha") ? "horse" : "cattle"}
                   className="absolute inset-0 h-full w-full object-cover opacity-30" 
                 />
                 <Radio className="h-12 w-12 text-gold animate-pulse-live relative z-10" />
                 <p className="mt-3 text-sm font-bold uppercase tracking-wider text-gold relative z-10">Aguardando Transmissão</p>
                 <p className="text-white/80 text-xs relative z-10">O vídeo será exibido assim que o leiloeiro iniciar.</p>
               </div>
             )}
             
            {(statusMessage || liveLot.status === 'sold' || liveLot.status === 'passed') && (
              <div className="absolute inset-0 flex items-center justify-center z-[100] pointer-events-none p-4">
                <div className={`
                  ${liveLot.status === 'sold' ? 'bg-emerald-600/95 shadow-[0_0_100px_rgba(5,150,105,0.6)]' : 
                    liveLot.status === 'passed' ? 'bg-destructive/95 shadow-[0_0_100px_rgba(239,68,68,0.6)]' : 
                    'bg-gold/95 shadow-[0_0_100px_rgba(212,175,55,0.6)]'} 
                  backdrop-blur-md px-12 py-10 rounded-[40px] border-4 border-white/20 animate-in zoom-in duration-300 w-full max-w-lg
                `}>
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center shadow-xl backdrop-blur-sm border border-white/30">
                      {liveLot.status === 'sold' ? (
                        <BadgeCheck className="h-14 w-14 text-white animate-pulse" />
                      ) : liveLot.status === 'passed' ? (
                        <Ban className="h-14 w-14 text-white" />
                      ) : (
                        <Gavel className="h-14 w-14 text-emerald-deep animate-bounce" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-black text-5xl md:text-6xl uppercase tracking-tighter drop-shadow-lg">
                        {liveLot.status === 'sold' ? 'ARREMATADO!' : 
                         liveLot.status === 'passed' ? 'NÃO VENDIDO' : 
                         statusMessage}
                      </p>
                      {liveLot.status === 'sold' && (
                        <p className="text-white/90 font-bold text-xl mt-2 uppercase tracking-tight">Vendido por {formatBRL(currentPrice)}</p>
                      )}
                      {!(liveLot.status === 'sold' || liveLot.status === 'passed') && (
                        <div className="mt-4 h-2 w-full bg-emerald-deep/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-deep animate-progress-shrink" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
             
             <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur z-10">
               <Volume2 className="h-4 w-4" />
             </div>
            </div>
          </div>
        </ErrorBoundary>

          {/* Bid History for Mobile (Visible between Player and Lot Highlight) */}
          <div className="lg:hidden order-2 mb-2">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-bold text-xs uppercase tracking-wider">Histórico de Lances</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-bold text-emerald-600">
                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> AO VIVO
                </div>
              </div>
              <ul className="max-h-[160px] overflow-auto p-2 text-[11px] space-y-1 custom-scrollbar">
                {bids?.slice(0, 5).map((bid: any, i: number) => (
                  <li key={bid.id} className={`flex items-center justify-between p-2 rounded ${i === 0 ? 'bg-gold/10 ring-1 ring-gold/20 animate-bid-flash' : 'border-b border-border/40'}`}>
                    <div className="flex flex-col">
                      <span className="font-bold">{bid.bidder_name}</span>
                      <span className="text-[9px] text-muted-foreground">{new Date(bid.created_at).toLocaleTimeString("pt-BR")}</span>
                    </div>
                    <span className={`font-mono font-black ${i === 0 ? 'text-gold text-sm' : ''}`}>{formatBRL(bid.amount)}</span>
                  </li>
                ))}
                {(!bids || bids.length === 0) && <li className="text-center text-muted-foreground py-4 italic">Aguardando lances...</li>}
              </ul>
            </div>
          </div>

          {/* Lote em destaque - Otimizado */}
          <div className="overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-gold transition-all duration-500 order-3">
            <div className="grid md:grid-cols-[1fr_1.2fr]">
               {/* Lado Esquerdo: Foto Grande */}
                <div className="relative aspect-[4/3] h-full group">
                  <OptimizedImage 
                    src={liveLot.animal?.photos?.[activePhotoIndex] || ""} 
                    alt={liveLot.animal?.name || "Animal"} 
                    width={1000}
                    aspectRatio="landscape"
                    category={liveLot.animal?.breed?.toLowerCase().includes("milha") ? "horse" : "cattle"}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

                {/* Carimbo de VENDIDO/FINALIZADO sobre a foto */}
                {(liveLot.status === 'sold' || liveLot.status === 'passed') && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none group-hover:opacity-100 transition-opacity">
                    <div className={`
                      ${liveLot.status === 'sold' ? 'bg-emerald-600/90 shadow-[0_0_50px_rgba(5,150,105,0.5)]' : 'bg-destructive/90 shadow-[0_0_50px_rgba(239,68,68,0.5)]'}
                      w-full py-6 text-center transform -rotate-12 border-y-8 border-white shadow-2xl backdrop-blur-sm
                    `}>
                      <span className="text-white text-4xl md:text-6xl font-black uppercase tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                        {liveLot.status === 'sold' ? 'ARREMATADO!' : 'NÃO VENDIDO'}
                      </span>
                      {liveLot.status === 'sold' && (
                        <div className="text-white/90 text-sm md:text-xl font-bold mt-1 uppercase tracking-widest">{formatBRL(currentPrice)}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {liveLot.animal?.photos?.length > 1 && (
                  <>
                    <button 
                      onClick={() => prevPhoto(liveLot.animal.photos)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-gold/80 transition-colors backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => nextPhoto(liveLot.animal.photos)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-gold/80 transition-colors backdrop-blur-sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-6 left-6 flex gap-2 z-20">
                   <Dialog>
                     <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{ 
                            boxShadow: ["0 0 10px rgba(212,175,55,0.2)", "0 0 20px rgba(212,175,55,0.4)", "0 0 10px rgba(212,175,55,0.2)"]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="rounded-full"
                        >
                          <Button 
                            size="sm" 
                            className="bg-gold text-emerald-deep hover:bg-gold-bright hover:text-emerald-deep transition-all shadow-gold font-black border-2 border-emerald-deep/20 px-6 h-10 rounded-full"
                          >
                            <Expand className="mr-2 h-4 w-4" /> VER GALERIA
                          </Button>
                        </motion.div>
                     </DialogTrigger>
                     <DialogContent className="max-w-4xl bg-emerald-deep border-gold/20">
                       <DialogHeader>
                         <DialogTitle className="text-gold">Fotos — {liveLot.animal?.name}</DialogTitle>
                       </DialogHeader>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                         {liveLot.animal?.photos?.map((photo: string, idx: number) => (
                           <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-gold transition-colors cursor-pointer" onClick={() => setActivePhotoIndex(idx)}>
                             <OptimizedImage 
                               src={photo} 
                               alt={`${liveLot.animal?.name} - Foto ${idx + 1}`} 
                               width={300}
                               aspectRatio="square"
                             />
                           </div>
                         ))}
                       </div>
                     </DialogContent>
                   </Dialog>
                </div>
              </div>

              {/* Lado Direito: Info e Lances */}
              <div className="p-6 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">Lote #{String(liveLot.lot_number).padStart(2, "0")}</span>
                      <StatusBadge status={liveLot.status} className="h-5 text-[9px] px-2 border-emerald/20" />
                      {liveLot.animal?.registration_number && (
                        <span className="text-[10px] text-muted-foreground font-mono">Registro: {liveLot.animal.registration_number}</span>
                      )}
                    </div>
                    <motion.h2 
                      key={liveLot.animal?.id}
                      initial={
                        animations.animal_name_entry === 'slide-up' ? { y: 20, opacity: 0 } :
                        animations.animal_name_entry === 'fade' ? { opacity: 0 } :
                        animations.animal_name_entry === 'scale' ? { scale: 0.8, opacity: 0 } :
                        {}
                      }
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="text-2xl font-black text-emerald-deep tracking-tighter leading-none"
                    >
                      {liveLot.animal?.name}
                    </motion.h2>
                    <p className="text-sm text-muted-foreground font-medium">{liveLot.animal?.breed} · {liveLot.animal?.species}</p>
                  </div>
                  {liveLot.end_date && (
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Encerra em</div>
                      <Countdown 
                        endsAt={liveLot.end_date as string} 
                        className="font-mono text-xl font-black text-live" 
                        onEnd={() => {
                          toast.success("Tempo esgotado no lote atual!");
                          refreshAllData();
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 space-y-4">
                  {user && profile && !profile.is_approved && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex gap-2 items-start animate-in fade-in slide-in-from-top-4 duration-500">
                      <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-500 font-black text-[9px] uppercase tracking-wider mb-0.5">Cadastro em Análise</p>
                        <p className="text-emerald-deep/80 text-[10px] leading-tight">
                          Habilitação pendente. 
                          <a href="https://wa.me/5581989437877" target="_blank" className="text-emerald-deep hover:underline font-bold ml-1">Chamar no WhatsApp</a>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl bg-emerald-deep/5 border border-emerald-deep/10 p-5 relative overflow-hidden group/price" id="bid-actions">
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover/price:opacity-100 transition-opacity">
                       <Gavel className="h-10 w-10 text-gold" />
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-live animate-pulse" /> Lance atual
                    </div>
                    <div className="text-4xl font-black text-gradient-gold tracking-tighter">{formatBRL(currentPrice)}</div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[1, 5, 10].map((mult) => (
                        <Button
                          key={mult}
                          variant="outline"
                          size="sm"
                          className="border-gold/30 hover:bg-gold/10 h-8 text-[11px] font-bold"
                          disabled={isBidding || liveLot.status === 'sold' || liveLot.status === 'passed'}
                          onClick={() => placeBid(currentPrice + (liveLot.bid_increment * mult))}
                        >
                          +{formatBRL(liveLot.bid_increment * mult)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <motion.div
                      className="flex-1"
                      animate={animations.bid_button_pulse && !(isBidding || liveLot.status === 'sold' || liveLot.status === 'passed') ? {
                        scale: [1, 1.02, 1],
                        boxShadow: [
                          "0 0 0 rgba(212,175,55,0)",
                          "0 0 15px rgba(212,175,55,0.4)",
                          "0 0 0 rgba(212,175,55,0)"
                        ]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Button
                        className="w-full bg-gold-gradient text-emerald-deep hover:scale-[1.02] transition-transform shadow-gold h-12 font-black text-sm uppercase tracking-wider"
                        disabled={isBidding || liveLot.status === 'sold' || liveLot.status === 'passed'}
                        onClick={() => placeBid(currentPrice + liveLot.bid_increment)}
                      >
                        {isBidding ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : liveLot.status === 'sold' || liveLot.status === 'passed' ? (
                          <Ban className="mr-2 h-4 w-4" />
                        ) : (
                          <Gavel className="mr-2 h-4 w-4" />
                        )}
                        {liveLot.status === 'sold' ? 'LOTE ARREMATADO' : 
                         liveLot.status === 'passed' ? 'LOTE FINALIZADO' : 
                         `DAR LANCE (${formatBRL(currentPrice + liveLot.bid_increment)})`}
                      </Button>
                    </motion.div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className={`h-12 w-12 p-0 transition-colors ${isFavorite ? 'border-gold text-gold bg-gold/5' : 'border-emerald-deep/20 text-emerald-deep hover:bg-emerald-deep hover:text-white'}`}
                        onClick={toggleFavorite}
                        disabled={isFavoriteLoading || !liveEvent?.active_lot_id}
                      >
                        {isFavoriteLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BadgeCheck className={`h-5 w-5 ${isFavorite ? 'fill-gold' : ''}`} />}
                      </Button>

                      <Button 
                        variant="outline" 
                        className="border-emerald-deep/20 h-12 w-12 p-0 text-emerald-deep hover:bg-emerald-deep hover:text-white transition-colors"
                        onClick={() => {
                          const url = `${window.location.origin}/lotes/${liveEvent?.active_lot_id}`;
                          const text = `Veja agora o lote #${liveEvent?.active_lot?.lot_number} - ${liveEvent?.active_lot?.animal?.name} no leilão ao vivo!`;
                          const shareData = { title: liveEvent?.active_lot?.animal?.name, text, url };

                          if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                            navigator.share(shareData).catch(() => {
                              navigator.clipboard.writeText(url);
                              window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
                              toast.success("Link copiado e WhatsApp aberto!");
                            });
                          } else {
                            navigator.clipboard.writeText(url);
                            window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
                            toast.success("Link copiado e WhatsApp aberto!");
                          }
                        }}
                        disabled={!liveEvent?.active_lot_id}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-emerald-deep/20 h-12 w-12 p-0 text-emerald-deep hover:bg-emerald-deep hover:text-white transition-colors">
                            <Info className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="border-b pb-4">
                          <DialogTitle className="flex items-center gap-2 text-2xl font-black text-emerald-deep tracking-tight">
                             <BadgeCheck className="h-6 w-6 text-gold" /> Informações do Animal
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="py-4 space-y-8">
                          {/* Descrição */}
                          {liveLot.animal?.description && (
                            <section>
                              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gold mb-3">
                                <FileText className="h-4 w-4" /> Descrição Completa
                              </h3>
                              <p className="text-sm text-muted-foreground leading-relaxed italic border-l-4 border-gold/20 pl-4 py-1">
                                "{liveLot.animal.description}"
                              </p>
                            </section>
                          )}

                          <div className="grid sm:grid-cols-2 gap-6">
                            {/* Ficha Técnica */}
                            <section>
                              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gold mb-3">
                                <Info className="h-4 w-4" /> Ficha Técnica
                              </h3>
                              <div className="space-y-2 text-sm">
                                {liveLot.animal?.registration_number && (
                                  <div className="flex justify-between border-b border-border/40 pb-1">
                                    <span className="text-muted-foreground">Registro Principal</span>
                                    <span className="font-bold">{liveLot.animal.registration_number}</span>
                                  </div>
                                )}
                                {liveLot.animal?.registration_1cc && (
                                  <div className="flex justify-between border-b border-border/40 pb-1">
                                    <span className="text-muted-foreground">Registro 1CC</span>
                                    <span className="font-bold">{liveLot.animal.registration_1cc}</span>
                                  </div>
                                )}
                                {liveLot.animal?.registration_2 && (
                                  <div className="flex justify-between border-b border-border/40 pb-1">
                                    <span className="text-muted-foreground">Registro Secundário</span>
                                    <span className="font-bold">{liveLot.animal.registration_2}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-b border-border/40 pb-1">
                                  <span className="text-muted-foreground">Sexo</span>
                                   <span className="font-bold uppercase">{liveLot.animal?.sex === 'M' || liveLot.animal?.sex === 'male' ? 'Macho' : 'Fêmea'}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/40 pb-1">
                                  <span className="text-muted-foreground">Pelagem</span>
                                  <span className="font-bold">{liveLot.animal?.color || "-"}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/40 pb-1">
                                  <span className="text-muted-foreground">Localização</span>
                                  <span className="font-bold">{liveLot.animal?.location || "-"}</span>
                                </div>
                                <div className="flex justify-between border-b border-border/40 pb-1">
                                  <span className="text-muted-foreground">Peso / Altura</span>
                                  <span className="font-bold">{liveLot.animal?.weight ? `${liveLot.animal.weight}kg` : "-"} / {liveLot.animal?.height ? `${liveLot.animal.height}m` : "-"}</span>
                                </div>
                              </div>
                            </section>

                            {/* Saúde e Vacinação */}
                            <section className="col-span-full">
                              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gold mb-4 border-b pb-2">
                                <Syringe className="h-4 w-4" /> Saúde e Vacinação
                              </h3>
                              
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Registros de Vacinação</p>
                                   {liveLot.animal?.vaccination_records && (typeof liveLot.animal.vaccination_records === 'string' ? liveLot.animal.vaccination_records.length > 0 : liveLot.animal.vaccination_records.length > 0) ? (
                                    <div className="bg-emerald-deep/5 rounded-xl p-3 space-y-2 border border-emerald-deep/10">
                                       {(typeof liveLot.animal.vaccination_records === 'string' ? liveLot.animal.vaccination_records.split(',').map((s: string) => s.trim()).filter(Boolean) : liveLot.animal.vaccination_records).map((v: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                          <div className="flex items-center gap-2">
                                            <BadgeCheck className="h-4 w-4 text-emerald-600" />
                                            <span className="text-sm font-medium">{typeof v === 'string' ? v : (v.vaccine || v.name || v.label)}</span>
                                          </div>
                                          {v.date && <span className="text-xs text-muted-foreground font-mono">{v.date}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-muted rounded-xl">
                                      <p className="text-xs text-muted-foreground">Nenhum registro de vacinação encontrado.</p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Histórico Veterinário</p>
                                   <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                     {(() => {
                                       const staticItems = [
                                         { id: "prognata", label: "Prognata" },
                                         { id: "aerofagico", label: "Aerofágico" },
                                         { id: "criptorquidico", label: "Criptorquídico" },
                                         { id: "cirurgia_neurectomia", label: "Neurectomia" },
                                         { id: "laminite", label: "Laminite" },
                                         { id: "cirurgia_colica", label: "Cirurgia Cólica" },
                                         { id: "dpco", label: "DPCO" },
                                         { id: "hypp", label: "HYPP" },
                                       ];
                                       
                                       const history = liveLot.animal?.veterinary_history || {};
                                       const customKeys = Object.keys(history).filter(k => 
                                         k !== 'other_info' && 
                                         k !== 'health_photo_url' && 
                                         !staticItems.find(i => i.id === k)
                                       );
                                       
                                       const allItems = [
                                         ...staticItems,
                                         ...customKeys.map(k => ({ id: k, label: k }))
                                       ];

                                       return allItems.map(item => {
                                         const val = history[item.id];
                                         const isSelected = val === true;
                                         const isNo = val === false;

                                      return (
                                           <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg border ${isSelected ? 'bg-emerald-50 border-emerald-200' : isNo ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-muted'}`}>
                                             <span className="text-[10px] font-bold">{item.label}</span>
                                             {isSelected ? (
                                               <BadgeCheck className="h-3 w-3 text-emerald-600" />
                                             ) : isNo ? (
                                               <XCircle className="h-3 w-3 text-red-600" />
                                             ) : (
                                               <div className="h-3 w-3 rounded-full border border-muted" />
                                             )}
                                           </div>
                                         );
                                       });
                                     })()}
                                    </div>
                                  {liveLot.animal?.veterinary_history?.other_info && (
                                    <div className="mt-4 p-3 bg-gold/5 border border-gold/10 rounded-lg">
                                      <p className="text-[10px] font-black uppercase text-gold/60 mb-1">Observações:</p>
                                      <p className="text-xs italic text-muted-foreground">{liveLot.animal.veterinary_history.other_info}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </section>
                          </div>

                          {/* Genealogia */}
                          <section>
                            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gold mb-3">
                              <TreePine className="h-4 w-4" /> Genealogia (Pedigree)
                            </h3>
                            <div className="rounded-xl border border-gold/20 p-4 bg-emerald-deep/5 overflow-x-auto">
                               <div className="min-w-[400px] flex items-center justify-around gap-4 text-xs">
                                 <div className="flex flex-col items-center gap-2">
                                   <div className="px-3 py-1 bg-white border border-gold/30 rounded shadow-sm font-bold text-emerald-deep">{liveLot.animal?.name}</div>
                                 </div>
                                 <div className="h-12 w-px bg-gold/30" />
                                 <div className="flex flex-col gap-4">
                                   <div className="px-2 py-1 bg-white/80 border border-gold/20 rounded shadow-sm font-bold">Pai: {(liveLot.animal?.genealogy as any)?.father || (liveLot.animal?.genealogy as any)?.pai || "A definir"}</div>
                                   <div className="px-2 py-1 bg-white/80 border border-gold/20 rounded shadow-sm font-bold">Mãe: {(liveLot.animal?.genealogy as any)?.mother || (liveLot.animal?.genealogy as any)?.mae || "A definir"}</div>
                                 </div>
                               </div>
                            </div>
                          </section>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

        {/* Chat / Histórico de lances */}
        <aside className="rounded-2xl border border-border bg-card order-2 lg:order-none">
          <div className="border-b border-border p-4 space-y-3">
            {statusMessage && (
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 text-gold">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Aviso do Leiloeiro</span>
                </div>
                <p className="mt-1 text-sm font-bold text-emerald-deep leading-tight">{statusMessage}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Histórico de lances</h3>
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground">
                    {realtimeStatus === "SUBSCRIBED" && !isOffline 
                      ? "Sincronização em tempo real" 
                      : "Modo de atualização segura (polling)"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Sincronizado às {lastSyncAt.toLocaleTimeString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className={`h-2 w-2 rounded-full ${
                isOffline ? "bg-red-500" : 
                realtimeStatus === "SUBSCRIBED" ? "bg-emerald-500 animate-pulse" : 
                "bg-amber-500 animate-pulse"
              }`} />
            </div>
          </div>
          <ul className="max-h-[600px] overflow-auto p-4 text-sm">
              {bids?.map((bid: any, i: number) => (
               <li key={bid.id} className={`flex items-center justify-between rounded-lg p-3 ${i === 0 ? "bg-gold/10 ring-1 ring-gold/30 animate-bid-flash" : "border-b border-border/40"}`}>
                 <div>
                   <div className="font-semibold flex items-center gap-2">
                       <div className="flex flex-col">
                           <span className="text-sm font-bold">
                             {bid.bidder_name}
                           </span>
                         <div className="flex items-center gap-2 mt-0.5">
                           {bid.is_phone_bid ? (
                             <span className="flex items-center gap-1 text-[9px] bg-gold/20 text-gold px-1.5 py-0.5 rounded uppercase font-black">
                               <Phone className="h-2 w-2" /> Telefone
                             </span>
                           ) : bid.bid_type === 'security' ? (
                             <span className="flex items-center gap-1 text-[9px] bg-emerald-deep/20 text-emerald-deep px-1.5 py-0.5 rounded uppercase font-black">
                               <Gavel className="h-2 w-2" /> Presencial
                             </span>
                           ) : (
                             <span className="flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded uppercase font-black">
                               <Users className="h-2 w-2" /> Online
                             </span>
                           )}
                         </div>
                       </div>
                   </div>
                   <div className="text-xs text-muted-foreground">{new Date(bid.created_at).toLocaleTimeString("pt-BR")}</div>
                 </div>
                 <div className={`font-mono font-bold ${i === 0 ? "text-gold" : "text-foreground"}`}>{formatBRL(bid.amount)}</div>
               </li>
             ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
