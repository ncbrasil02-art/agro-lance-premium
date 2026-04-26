 import { MessageSquare, Phone } from "lucide-react";
   const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
     // Search for an event that is explicitly live OR scheduled but whose time has already arrived
     const { data: events, error: eventError } = await supabase
        .from("events")
        .select("*, active_lot:lots!active_lot_id(*, animal:animals(*))")
        .or("status.eq.live,status.eq.scheduled")
        .order("start_date", { ascending: true });

     if (eventError || !events || events.length === 0) return { liveEvent: null };

     const now = new Date();
     const liveEvent = events.find(e => {
       if (e.status === 'live') return true;
       const start = new Date(e.start_date);
       const end = e.end_date ? new Date(e.end_date) : null;
       return now >= start && (!end || now < end);
     });

     if (!liveEvent) return { liveEvent: null };
 
     const { data: bids, error: bidsError } = await supabase
       .from("bids")
       .select("*")
        .eq("lot_id", liveEvent.active_lot_id!)
       .order("created_at", { ascending: false })
       .limit(10);
 
      try {
        const validatedEvent = eventSchema.parse(liveEvent);
        return { 
          liveEvent: validatedEvent,
          initialBids: bids || []
        };
      } catch (e) {
        console.error("Erro de validação do evento ao vivo:", e);
        return { liveEvent: null };
      }
   },
   component: LivePage,
});

 function LivePage() {
   const { liveEvent: initialEvent, initialBids } = Route.useLoaderData();
   const { user, profile } = useAuth();
   const [liveEvent, setLiveEvent] = useState(initialEvent);
   const [bids, setBids] = useState(initialBids);
    const [isBidding, setIsBidding] = useState(false);
    const [showConfirmBid, setShowConfirmBid] = useState(false);
    const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
 
   useEffect(() => {
     if (!liveEvent) return;
 
     const eventChannel = supabase
       .channel(`live-event-${liveEvent.id}`)
       .on(
         "postgres_changes",
         { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${liveEvent.id}` },
         async (payload) => {
            const { data } = await supabase
              .from("events")
              .select("*, active_lot:lots!active_lot_id(*, animal:animals(*))")
              .eq("id", liveEvent.id)
             .single();
             if (data) {
               setLiveEvent(data as any);
               if (payload.new.live_status_message && payload.new.live_status_message !== payload.old?.live_status_message) {
                 setStatusMessage(payload.new.live_status_message);
                 setTimeout(() => setStatusMessage(null), 8000);
               }
             }
         }
       )
       .subscribe();
 
     const bidsChannel = supabase
       .channel(`live-bids-${liveEvent.active_lot_id}`)
       .on(
         "postgres_changes",
         { event: "INSERT", schema: "public", table: "bids", filter: `lot_id=eq.${liveEvent.active_lot_id}` },
         (payload) => {
           setBids((prev: any) => [payload.new, ...prev].slice(0, 10));
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(eventChannel);
       supabase.removeChannel(bidsChannel);
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
         <h1 className="text-3xl font-bold">Nenhum evento ao vivo no momento</h1>
         <p className="mt-2 text-muted-foreground">Confira o calendário de próximos eventos.</p>
         <Link to="/eventos" className="mt-6 inline-block">
           <Button className="bg-gold-gradient text-emerald-deep">Ver eventos</Button>
         </Link>
       </div>
     );
   }
 
   if (!liveLot) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
         <h1 className="text-3xl font-bold">{liveEvent.name}</h1>
         <div className="mt-8 relative aspect-video max-w-4xl mx-auto overflow-hidden rounded-2xl border border-gold/30 bg-emerald-deep shadow-elegant flex flex-col items-center justify-center">
           {liveEvent.transmission_link ? (
             <iframe
               className="h-full w-full border-0"
               src={liveEvent.transmission_link.replace("watch?v=", "embed/")}
               title="Aguardando Próximo Lote"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
             />
           ) : (
             <>
               <Loader2 className="h-12 w-12 text-gold animate-spin mb-4" />
               <p className="text-gold font-bold uppercase tracking-widest">Aguardando próximo lote...</p>
               <p className="text-white/60 text-sm mt-2">O leiloeiro está preparando a próxima oferta.</p>
             </>
           )}
         </div>
         <p className="mt-8 text-muted-foreground">Fique atento! A transmissão continua enquanto preparamos o próximo animal.</p>
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
                 src={liveEvent.transmission_link.replace("watch?v=", "embed/")}
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
                      ) : (
                        <span>Comprador ...{bid.user_id.slice(-4)}</span>
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
