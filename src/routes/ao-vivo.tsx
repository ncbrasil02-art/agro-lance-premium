 import { createFileRoute, Link } from "@tanstack/react-router";
 import { Radio, Users, Gavel, Volume2, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Countdown } from "@/components/auctions/countdown";
 import { StatusBadge } from "@/components/auctions/status-badge";
 import { supabase } from "@/integrations/supabase/client";
 import { formatBRL } from "@/utils/format";
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
     const { data: liveEvent, error: eventError } = await supabase
       .from("events")
       .select("*, active_lot:lots(*, animal:animals(*))")
       .eq("status", "live")
       .single();
 
     if (eventError || !liveEvent) return { liveEvent: null };
 
     const { data: bids, error: bidsError } = await supabase
       .from("bids")
       .select("*")
        .eq("lot_id", liveEvent.active_lot_id!)
       .order("created_at", { ascending: false })
       .limit(10);
 
     return { 
       liveEvent: {
         ...liveEvent,
         active_lot: liveEvent.active_lot
       },
       initialBids: bids || []
     };
   },
   component: LivePage,
});

 function LivePage() {
   const { liveEvent: initialEvent, initialBids } = Route.useLoaderData();
   const { user, profile } = useAuth();
   const [liveEvent, setLiveEvent] = useState(initialEvent);
   const [bids, setBids] = useState(initialBids);
   const [isBidding, setIsBidding] = useState(false);
 
   useEffect(() => {
     if (!liveEvent) return;
 
     const eventChannel = supabase
       .channel(`live-event-${liveEvent.id}`)
       .on(
         "postgres_changes",
         { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${liveEvent.id}` },
         async () => {
           const { data } = await supabase
             .from("events")
             .select("*, active_lot:lots(*, animal:animals(*))")
             .eq("id", liveEvent.id)
             .single();
           if (data) setLiveEvent(data);
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
 
   const placeBid = async (amount: number) => {
     if (!user) {
       toast.error("Você precisa estar logado para dar lances.");
       return;
     }
     if (!profile?.is_approved) {
       toast.error("Sua conta ainda não foi aprovada para dar lances.");
       return;
     }
     setIsBidding(true);
     try {
       const { error } = await supabase.from("bids").insert({
        lot_id: (liveLot as any).id,
         user_id: user.id,
         amount,
         bid_type: "online",
       });
       if (error) throw error;
       toast.success("Lance efetuado com sucesso!");
     } catch (error: any) {
       toast.error(error.message || "Erro ao efetuar lance.");
     } finally {
       setIsBidding(false);
     }
   };
 
   const currentPrice = liveLot?.current_price || liveLot?.starting_price || 0;
 
  if (!liveEvent || !liveLot) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Nenhuma transmissão ao vivo no momento</h1>
        <p className="mt-2 text-muted-foreground">Confira o calendário de próximos eventos.</p>
        <Link to="/eventos" className="mt-6 inline-block">
          <Button className="bg-gold-gradient text-emerald-deep">Ver eventos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <StatusBadge status="live" />
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{liveEvent.name}</h1>
           <p className="text-sm text-muted-foreground">Leiloeiro: {liveEvent.auctioneer_name || "A definir"} · {liveEvent.promoter_company || "A definir"}</p>
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
             <img src={liveLot.animal?.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} alt={liveLot.animal?.name} className="h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-emerald-deep via-emerald-deep/40 to-transparent text-center">
              <Radio className="h-12 w-12 text-gold animate-pulse-live" />
              <p className="mt-3 text-sm font-bold uppercase tracking-wider text-gold">Transmissão ao vivo</p>
              <p className="text-white/80 text-xs">Player de vídeo HD será exibido aqui</p>
            </div>
            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur">
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
                   <div className="font-semibold">Comprador ...{bid.user_id.slice(-4)}</div>
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
