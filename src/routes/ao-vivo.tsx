import { MessageSquare, Phone, Info, FileText, Syringe, TreePine, Expand, ChevronLeft, ChevronRight, Eye, Radio, Users, Gavel, Volume2, Loader2, AlertTriangle, BadgeCheck, Ban, RefreshCw } from "lucide-react";
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
  import { supabase } from "@/integrations/supabase/client";
  import { formatBRL } from "@/utils/format";
  import { eventSchema, lotSchema } from "@/lib/schemas";
  import { z } from "zod";
 import { useEffect, useState } from "react";
 import { toast } from "sonner";
 import { useAuth } from "@/components/auth/auth-provider";

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
            .select("*, profile:profiles(id, full_name)")
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
   const { user, profile } = useAuth();
   const [liveEvent, setLiveEvent] = useState(initialEvent);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("connected");
  const [lastSyncAt, setLastSyncAt] = useState<Date>(new Date());
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [pollingRetryCount, setPollingRetryCount] = useState(0);
   const [reconnectTrigger, setReconnectTrigger] = useState(0);
   const [isFavorite, setIsFavorite] = useState(false);
   const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

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
    // Increment viewer count when page loads
    useEffect(() => {
      if (liveEvent?.id) {
        supabase.rpc("increment_viewer_count", {
          p_entity_id: liveEvent.id,
          p_entity_type: 'event'
        }).then(() => console.log("Viewer count incremented"));
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
      const globalChannel = supabase
        .channel("global-events-status")
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
                .select("*, active_lot:lots!active_lot_id(*, animal:animals(*))")
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
                    const { data: newBids } = await supabase
                      .from("bids")
                      .select("*, profile:profiles(id, full_name)")
                      .eq("lot_id", payload.new.active_lot_id)
                      .order("created_at", { ascending: false })
                      .limit(10);
                    
                    if (newBids) {
                      setBids(newBids);
                      // Extract profiles from bids and update cache
                      const newProfiles: Record<string, any> = {};
                      newBids.forEach((bid: any) => {
                        if (bid.profile) {
                          newProfiles[bid.profile.id] = bid.profile;
                        }
                      });
                      setBidderProfiles(prev => ({ ...prev, ...newProfiles }));
                    }
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
        lotChannel = supabase
          .channel(`lot-updates-${liveEvent.active_lot_id}`)
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
        bidsChannel = supabase
          .channel(`live-bids-${liveEvent.active_lot_id}`)
          .on(
            "postgres_changes",
            { 
              event: "*", 
              schema: "public", 
              table: "bids", 
              filter: `lot_id=eq.${liveEvent.active_lot_id}` 
            },
            async (payload) => {
              console.log("Bid change detected:", payload.eventType, payload.new);
              
              if (payload.eventType === "INSERT") {
                const newBid = payload.new;
                setBids((prev: any[]) => {
                  // Prevent duplicates just in case
                  if (prev.some((b: any) => b.id === newBid.id)) return prev;
                  return [newBid, ...prev].slice(0, 10);
                });

                // Update active lot price and bid count immediately
                setLiveEvent((prev: any) => {
                  if (!prev || !prev.active_lot || prev.active_lot.id !== newBid.lot_id) return prev;
                  // Only update if the new bid is actually higher (standard case)
                  const isNewer = newBid.amount > (prev.active_lot.current_price || 0);
                  return {
                    ...prev,
                    active_lot: {
                      ...prev.active_lot,
                      current_price: isNewer ? newBid.amount : prev.active_lot.current_price,
                      bids_count: (prev.active_lot.bids_count || 0) + 1
                    }
                  };
                });
                
                // Only fetch profile if not in cache
                if (newBid.user_id) {
                  setBidderProfiles(currentCache => {
                    if (!currentCache[newBid.user_id]) {
                      // Profile not in cache, fetch it
                      supabase
                        .from("profiles")
                        .select("id, full_name")
                        .eq("id", newBid.user_id)
                        .single()
                        .then(({ data }) => {
                          if (data) {
                            setBidderProfiles(prev => ({ ...prev, [data.id]: data }));
                          }
                        });
                    }
                    return currentCache;
                  });
                }
              } else if (payload.eventType === "UPDATE") {
                const updatedBid = payload.new;
                setBids((prev: any[]) => 
                  prev.map((b: any) => b.id === updatedBid.id ? { ...b, ...updatedBid } : b)
                );
                
                // If user_id was added in update, fetch profile
                if (updatedBid.user_id && !bidderProfiles[updatedBid.user_id]) {
                  const { data } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .eq("id", updatedBid.user_id)
                    .single();
                  if (data) {
                    setBidderProfiles(prev => ({ ...prev, [data.id]: data }));
                  }
                }
              }
            }
          )
          .subscribe((status) => {
            console.log("Bid channel status:", status);
            setRealtimeStatus(status);
          });
      }

      // Real-time profiles subscription to update names in the history
      const profilesChannel = supabase
        .channel("live-profiles-sync")
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
              .select("*, profile:profiles(id, full_name)")
              .eq("lot_id", activeLotId)
              .order("created_at", { ascending: false })
              .limit(10);
            
            if (latestBids) {
              setBids(latestBids);
              const newProfiles: Record<string, any> = {};
              latestBids.forEach((bid: any) => {
                if (bid.profile) newProfiles[bid.profile.id] = bid.profile;
              });
              setBidderProfiles(prev => ({ ...prev, ...newProfiles }));
            }
          }
          setLastSyncAt(new Date());
          setPollingRetryCount(0); // Reset retry count on success
        }
      } catch (err) {
        console.error("Erro ao sincronizar dados:", err);
        setPollingRetryCount(prev => prev + 1);
      }
    };

    // Periodically refresh event data with exponential backoff if realtime fails or offline
    useEffect(() => {
      if (!liveEvent?.id) return;
      
      let intervalTime = 30000; // Sincronização padrão (30s)

      if (realtimeStatus !== "SUBSCRIBED" && !isOffline) {
        // Online mas sem Realtime: Polling agressivo para não perder lances
        // Começa em 2s e aumenta levemente se houver erros (backoff suave)
        intervalTime = Math.min(2000 * Math.pow(1.5, pollingRetryCount), 10000);
      } else if (isOffline) {
        // Modo Offline: Backoff pesado para economizar recursos
        intervalTime = Math.min(10000 * Math.pow(2, pollingRetryCount), 60000);
      }
      
      console.log(`Setting refresh interval to ${intervalTime}ms (retry count: ${pollingRetryCount}, status: ${realtimeStatus})`);
      const interval = setInterval(refreshAllData, intervalTime);

      if (syncTrigger > 0) {
        refreshAllData();
      }

      return () => clearInterval(interval);
    }, [liveEvent?.id, liveEvent?.active_lot_id, realtimeStatus, isOffline, syncTrigger, pollingRetryCount]);

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

        const result = data as { success: boolean; message: string };
        if (result.success) {
          toast.success(result.message);
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
      if (liveLot?.status === 'sold' || liveLot?.status === 'passed') {
        toast.error("Lote finalizado. Lances encerrados.");
        return;
      }

      if (!user) {
        toast.error("Você precisa estar logado para dar lances.");
        return;
      }
      if (!profile?.is_approved) {
        toast.error("Sua conta ainda não foi aprovada para dar lances.");
        return;
      }
      if (profile?.is_blocked) {
        toast.error("Sua conta está bloqueada para dar lances.", {
          description: profile.block_reason || "Entre em contato com o suporte."
        });
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
         <div className="flex flex-wrap gap-4 text-sm">
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

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Player + Lote em destaque */}
        <div className="space-y-6">
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

          {/* Lote em destaque - Otimizado */}
          <div className="overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-gold transition-all duration-500">
            <div className="grid md:grid-cols-[1fr_1.2fr]">
               {/* Lado Esquerdo: Foto Grande */}
               <div className="relative aspect-square md:aspect-auto h-full group">
                 <OptimizedImage 
                   src={liveLot.animal?.photos?.[activePhotoIndex] || ""} 
                   alt={liveLot.animal?.name || "Animal"} 
                   width={1000}
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

                <div className="absolute bottom-4 left-4 flex gap-2">
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm hover:bg-gold hover:text-white transition-all shadow-lg font-bold">
                         <Expand className="mr-2 h-3.5 w-3.5" /> VER GALERIA
                       </Button>
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
                        <span className="text-[10px] text-muted-foreground font-mono">REG: {liveLot.animal.registration_number}</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-emerald-deep tracking-tighter leading-none">{liveLot.animal?.name}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{liveLot.animal?.breed} · {liveLot.animal?.species}</p>
                  </div>
                  {liveLot.end_date && (
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Encerra em</div>
                      <Countdown endsAt={liveLot.end_date as string} className="font-mono text-xl font-black text-live" />
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 space-y-4">
                  <div className="rounded-2xl bg-emerald-deep/5 border border-emerald-deep/10 p-5 relative overflow-hidden group/price">
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

                  <div className="grid grid-cols-[1fr_auto] gap-2">
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
                                  <span className="font-bold uppercase">{liveLot.animal?.sex === 'male' ? 'Macho' : 'Fêmea'}</span>
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

                            {/* Saúde / Vacinação */}
                            <section>
                              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gold mb-3">
                                <Syringe className="h-4 w-4" /> Saúde e Vacinação
                              </h3>
                              {liveLot.animal?.vaccination_records ? (
                                <div className="bg-emerald-deep/5 rounded-lg p-3 space-y-2">
                                   {Array.isArray(liveLot.animal.vaccination_records) ? (
                                     liveLot.animal.vaccination_records.map((v: any, i: number) => (
                                       <div key={i} className="flex items-center gap-2 text-xs">
                                         <BadgeCheck className="h-3 w-3 text-emerald-600" />
                                         <span className="font-medium">{v.vaccine || v.name}</span>
                                         <span className="text-muted-foreground ml-auto">{v.date}</span>
                                       </div>
                                     ))
                                   ) : (
                                     <p className="text-xs text-muted-foreground">Registros disponíveis no catálogo físico.</p>
                                   )}
                                </div>
                              ) : (
                                <div className="text-center py-4 border-2 border-dashed border-border rounded-lg">
                                   <p className="text-xs text-muted-foreground">Nenhum registro de vacinação cadastrado.</p>
                                </div>
                              )}
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
                                   <div className="px-2 py-1 bg-white/80 border border-gold/20 rounded shadow-sm font-bold">Pai: {(liveLot.animal?.genealogy as any)?.father || "A definir"}</div>
                                   <div className="px-2 py-1 bg-white/80 border border-gold/20 rounded shadow-sm font-bold">Mãe: {(liveLot.animal?.genealogy as any)?.mother || "A definir"}</div>
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
            </div>
          </div>
        </div>

        {/* Chat / Histórico de lances */}
        <aside className="rounded-2xl border border-border bg-card">
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
                           {bid.is_phone_bid ? (
                             bid.phone_bidder_identifier || "Telefone"
                           ) : bid.bid_type === 'security' ? (
                             "Lance do Auditório"
                           ) : bidderProfiles[bid.user_id]?.full_name ? (
                             bidderProfiles[bid.user_id].full_name
                           ) : bid.user_id ? (
                             `Comprador ...${bid.user_id.slice(-4)}`
                           ) : (
                             "Licitante"
                           )}
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
