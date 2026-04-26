import { MessageSquare, Phone } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Users, Gavel, Volume2, Loader2, AlertTriangle } from "lucide-react";
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

        console.log("Evento selecionado para Ao Vivo:", liveEvent.name, "ID:", liveEvent.id);

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
          initialBids,
          debug: {
            eventsCount: events.length,
            firstEventStatus: events[0]?.status,
            pickedEventName: liveEvent?.name
          }
        };
      } catch (err) {
        console.error("Erro fatal no loader ao-vivo:", err);
        return { liveEvent: null };
      }
    },
   component: LivePage,
});

  function LivePage() {
    const loaderData = Route.useLoaderData() as any;
    const initialEvent = loaderData?.liveEvent;
    const initialBids = loaderData?.initialBids;
    console.log("LivePage Render - initialEvent:", initialEvent?.name);
   const { user, profile } = useAuth();
   const [liveEvent, setLiveEvent] = useState(initialEvent);
   const [bids, setBids] = useState(initialBids);
    const [isBidding, setIsBidding] = useState(false);
    const [showConfirmBid, setShowConfirmBid] = useState(false);
    const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
 
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
                setLiveEvent(data as any);
                
                // Handle status messages
                if (payload.new.live_status_message && payload.new.live_status_message !== payload.old?.live_status_message) {
                  setStatusMessage(payload.new.live_status_message);
                  setTimeout(() => setStatusMessage(null), 8000);
                }
                
                // If active lot changed, fetch bids for the new lot
                if (payload.new.active_lot_id !== payload.old?.active_lot_id) {
                  console.log("Lote alterado em tempo real:", payload.new.active_lot_id);
                  const { data: newBids } = await supabase
                    .from("bids")
                    .select("*")
                    .eq("lot_id", payload.new.active_lot_id)
                    .order("created_at", { ascending: false })
                    .limit(10);
                  if (newBids) setBids(newBids);
                  
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

      // Specific bids channel for the active lot
      let bidsChannel: any = null;
      if (liveEvent?.active_lot_id) {
        bidsChannel = supabase
          .channel(`live-bids-${liveEvent.active_lot_id}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "bids", filter: `lot_id=eq.${liveEvent.active_lot_id}` },
            (payload) => {
              setBids((prev: any) => [payload.new, ...prev].slice(0, 10));
            }
          )
          .subscribe();
      }

      return () => {
        supabase.removeChannel(globalChannel);
        if (bidsChannel) supabase.removeChannel(bidsChannel);
      };
    }, [liveEvent?.id, liveEvent?.active_lot_id]);
 
   const liveLot = liveEvent?.active_lot;
 
    const executeBid = async (amount: number) => {
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
          <StatusBadge status="live" />
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{liveEvent.name}</h1>
           <div className="flex flex-col gap-1">
             <p className="text-sm text-muted-foreground italic line-clamp-1">{liveEvent.description || "Transmissão ao vivo do leilão premium."}</p>
             <p className="text-xs text-gold/60 font-bold uppercase tracking-wider">Leiloeiro: {liveEvent.auctioneer_name || "A definir"} · {liveEvent.promoter_company || "A definir"}</p>
           </div>
        </div>
        <div className="flex gap-4 text-sm">
           <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4 text-gold" /> {(liveEvent.viewers || 0).toLocaleString("pt-BR")} assistindo</span>
           <span className="flex items-center gap-1.5 text-muted-foreground"><Gavel className="h-4 w-4 text-gold" /> {liveEvent.active_lot?.bids_count || 0} lances</span>
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
                 <img src={liveLot.animal?.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} alt={liveLot.animal?.name} className="absolute inset-0 h-full w-full object-cover opacity-30" />
                 <Radio className="h-12 w-12 text-gold animate-pulse-live relative z-10" />
                 <p className="mt-3 text-sm font-bold uppercase tracking-wider text-gold relative z-10">Aguardando Transmissão</p>
                 <p className="text-white/80 text-xs relative z-10">O vídeo será exibido assim que o leiloeiro iniciar.</p>
               </div>
             )}
             
             {statusMessage && (
               <div className="absolute bottom-4 left-4 right-4 z-20 animate-in fade-in slide-in-from-bottom-4">
                 <div className="bg-gold/95 backdrop-blur-sm p-3 rounded-lg shadow-xl flex items-center gap-3 border border-emerald-deep/20">
                   <div className="h-8 w-8 rounded-full bg-emerald-deep flex items-center justify-center">
                     <MessageSquare className="h-4 w-4 text-gold" />
                   </div>
                   <p className="text-emerald-deep font-black text-sm uppercase tracking-tight">{statusMessage}</p>
                 </div>
               </div>
             )}
             
             <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur z-10">
               <Volume2 className="h-4 w-4" />
             </div>
           </div>

          {/* Lote em destaque */}
          <div className="rounded-2xl border border-gold/30 bg-card p-6 shadow-gold">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold">Lote em destaque</span>
                 <h2 className="mt-1 text-2xl font-bold">#{String(liveLot.lot_number).padStart(2, "0")} — {liveLot.animal?.name}</h2>
                 <p className="text-sm text-muted-foreground">{liveLot.animal?.breed} · {liveLot.animal?.species}</p>
              </div>
               {liveLot.end_date && (
                 <div className="text-right">
                   <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Encerra em</div>
                    <Countdown endsAt={liveLot.end_date as string} className="font-mono text-2xl font-bold text-live" />
                 </div>
                )}
              </div>

             <div className="mt-6 rounded-xl border border-border bg-secondary p-5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lance atual</div>
               <div className="text-4xl font-bold text-gradient-gold">{formatBRL(currentPrice)}</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                 {[1, 5, 10].map((mult) => (
                   <Button 
                     key={mult} 
                     variant="outline" 
                     className="border-gold/30 hover:bg-gold/10"
                     disabled={isBidding}
                     onClick={() => placeBid(currentPrice + (liveLot.bid_increment * mult))}
                   >
                     +{formatBRL(liveLot.bid_increment * mult)}
                   </Button>
                 ))}
               </div>
               <Button 
                 className="mt-3 w-full bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold" 
                 size="lg"
                 disabled={isBidding}
                 onClick={() => placeBid(currentPrice + liveLot.bid_increment)}
               >
                 {isBidding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Dar lance de {formatBRL(currentPrice + liveLot.bid_increment)}
              </Button>
            </div>
          </div>
        </div>

        {/* Chat / Histórico de lances */}
        <aside className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="font-semibold">Histórico de lances</h3>
            <p className="text-xs text-muted-foreground">Atualização em tempo real</p>
          </div>
          <ul className="max-h-[600px] overflow-auto p-4 text-sm">
              {bids?.map((bid: any, i: number) => (
               <li key={bid.id} className={`flex items-center justify-between rounded-lg p-3 ${i === 0 ? "bg-gold/10 ring-1 ring-gold/30 animate-bid-flash" : "border-b border-border/40"}`}>
                 <div>
                   <div className="font-semibold flex items-center gap-2">
                      {bid.is_phone_bid ? (
                        <span className="flex items-center gap-1 text-[10px] bg-gold/20 text-gold px-1.5 rounded uppercase font-black">
                          <Phone className="h-2 w-2" /> Telefone
                        </span>
                      ) : bid.bid_type === 'security' ? (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-deep/20 text-emerald-deep px-1.5 rounded uppercase font-black">
                          <Gavel className="h-2 w-2" /> Auditório
                        </span>
                      ) : bid.user_id ? (
                        <span>Comprador ...{bid.user_id.slice(-4)}</span>
                      ) : (
                        <span>Licitante</span>
                      )}
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
