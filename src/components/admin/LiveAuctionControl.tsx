import { StatusBadge } from "@/components/auctions/status-badge";
 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { toast } from "sonner";
 import { 
   Play, Square, MessageSquare, Phone, Timer, Gavel, Check, RefreshCw,
    Video, Users, Loader2, AlertTriangle, CheckCircle2, Ban, FastForward, Info
 } from "lucide-react";
  import { formatBRL, validateLiveLink } from "@/utils/format";
  import { TrendingUp, History } from "lucide-react";
 
 export function LiveAuctionControl() {
   const [events, setEvents] = useState<any[]>([]);
   const [selectedEventId, setSelectedEventId] = useState<string>("");
   const [liveEvent, setLiveEvent] = useState<any>(null);
   const [lots, setLots] = useState<any[]>([]);
   const [activeLot, setActiveLot] = useState<any>(null);
    const [bids, setBids] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [transmissionLink, setTransmissionLink] = useState("");
   
    // Phone bid form
    const [phoneBid, setPhoneBid] = useState({ amount: 0, identifier: "", profileId: "" });
    const [securityBidAmount, setSecurityBidAmount] = useState<number>(0);
    const [profiles, setProfiles] = useState<any[]>([]);
     const [searchProfile, setSearchProfile] = useState("");
     const [isAutoAdvancing, setIsAutoAdvancing] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("connected");
  const [pollingRetryCount, setPollingRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
 
   const quickMessages = [
     "Alguém dá mais algum lance?",
     "Dou-lhe uma...",
     "Dou-lhe duas...",
     "Dou-lhe três! Vendido!",
     "Aguardando oferta...",
     "Vou finalizar o lote, ninguém mais?",
     "Oportunidade única neste lote!",
     "Lote em destaque na tela!"
   ];
 
    useEffect(() => {
      fetchEvents();
      fetchProfiles();
      supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));

      // Real-time profiles subscription to keep the dropdown and data fresh
      const profilesChannel = supabase
        .channel("admin-profiles-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            fetchProfiles(); // Simpler to re-fetch for the dropdown to maintain order
          }
        )
        .subscribe((status) => {
          setRealtimeStatus(status);
        });

      return () => {
        supabase.removeChannel(profilesChannel);
      };
    }, []);
 
   useEffect(() => {
     if (selectedEventId) {
       fetchEventDetails(selectedEventId);
     }
   }, [selectedEventId]);
 
  // Real-time subscriptions
  useEffect(() => {
    if (!selectedEventId) return;

    const eventChannel = supabase
      .channel(`admin-event-updates-${selectedEventId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${selectedEventId}` },
          async (payload) => {
            setLiveEvent((prev: any) => prev ? ({ ...prev, ...payload.new }) : payload.new);
          
          if (payload.new.active_lot_id !== payload.old?.active_lot_id) {
            // When lot changes, we need to refresh details to get animal data etc
            fetchEventDetails(selectedEventId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, [selectedEventId]);

    useEffect(() => {
      if (!activeLot?.id) {
        setBids([]);
        return;
      }

      // Fetch initial bids for the active lot
      const fetchInitialBids = async () => {
        const { data } = await supabase
          .from("bids")
          .select("*, profile:profiles(full_name, risk_level, is_blocked)")
          .eq("lot_id", activeLot.id)
          .order("created_at", { ascending: false })
          .limit(10);
        setBids(data || []);
      };
      fetchInitialBids();

      const lotChannel = supabase
        .channel(`admin-lot-realtime-${activeLot.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "lots", filter: `id=eq.${activeLot.id}` },
          (payload) => {
            setActiveLot((prev: any) => {
              if (!prev || prev.id !== payload.new.id) return prev;
              return { ...prev, ...payload.new };
            });
            setLots((prev: any[]) => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l));
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bids", filter: `lot_id=eq.${activeLot.id}` },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              const newBid = payload.new;
              // Fetch profile for the new bid
              const { data: bidWithProfile } = await supabase
                .from("bids")
                .select("*, profile:profiles(full_name, risk_level, is_blocked)")
                .eq("id", newBid.id)
                .single();
              
              if (bidWithProfile) {
                setBids(prev => {
                  if (prev.some(b => b.id === bidWithProfile.id)) return prev;
                  return [bidWithProfile, ...prev].slice(0, 10);
                });
                
                // Update local active lot price immediately
                setActiveLot((prev: any) => {
                  if (!prev || prev.id !== newBid.lot_id) return prev;
                  return {
                    ...prev,
                    current_price: Math.max(prev.current_price || 0, newBid.amount),
                    bids_count: (prev.bids_count || 0) + 1
                  };
                });
              }
            } else if (payload.eventType === "UPDATE") {
              setBids(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(lotChannel);
      };
    }, [activeLot?.id]);

    // Centralized refresh for the admin panel (Narrator view)
    const refreshAdminData = async () => {
      if (!activeLot?.id) return;
      try {
        const { data: latestLot, error: lotError } = await supabase
          .from("lots")
          .select("*")
          .eq("id", activeLot.id)
          .single();
        
        if (lotError) throw lotError;
        
        if (latestLot) {
          setActiveLot((prev: any) => prev ? { ...prev, ...latestLot } : latestLot);
          setLots((prev: any[]) => prev.map(l => l.id === latestLot.id ? { ...l, ...latestLot } : l));
        }

        const { data: latestBids } = await supabase
          .from("bids")
          .select("*, profile:profiles(full_name, risk_level, is_blocked)")
          .eq("lot_id", activeLot.id)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (latestBids) setBids(latestBids);
        setPollingRetryCount(0);
      } catch (err) {
        console.error("Erro na sincronização do narrador:", err);
        setPollingRetryCount(prev => prev + 1);
      }
    };

    // Adaptive polling for the narrator view
    useEffect(() => {
      if (!activeLot?.id) return;
      
      let intervalTime = 30000;
      if (realtimeStatus !== "SUBSCRIBED" && !isOffline) {
        intervalTime = Math.min(2000 * Math.pow(1.5, pollingRetryCount), 10000);
      } else if (isOffline) {
        intervalTime = Math.min(10000 * Math.pow(2, pollingRetryCount), 60000);
      }
      
      const interval = setInterval(refreshAdminData, intervalTime);
      return () => clearInterval(interval);
    }, [activeLot?.id, realtimeStatus, isOffline, pollingRetryCount]);

    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, event_type")
        .eq("event_type", "ao_vivo")
        .in("status", ["live", "scheduled", "em_loteamento", "recebendo_lances", "em_condicional"])
        .order("start_date", { ascending: false });
      setEvents(data || []);
    };

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone, cpf")
        .order("full_name");
      setProfiles(data || []);
    };
 
   const fetchEventDetails = async (eventId: string) => {
     setIsLoading(true);
     try {
       const { data: event } = await supabase
         .from("events")
         .select("*")
         .eq("id", eventId)
         .single();
       
       const { data: eventLots } = await supabase
         .from("lots")
         .select("*, animal:animals(name)")
         .eq("event_id", eventId)
         .order("lot_number", { ascending: true });
 
       setLiveEvent(event);
        setTransmissionLink(event?.transmission_link || "");
       setLots(eventLots || []);
       
        if (event?.active_lot_id) {
          const currentActive = eventLots?.find(l => l.id === event.active_lot_id);
          setActiveLot(currentActive);
        } else {
          // Auto-selection: If event has no active_lot_id, look for first lot with 'active' status
          const firstActive = eventLots?.find(l => l.status === 'active' || l.status === 'live');
          if (firstActive) {
            setActiveLot(firstActive);
            // Sync back to event table to ensure everyone sees this lot
            await supabase.from("events").update({ active_lot_id: firstActive.id }).eq("id", eventId);
          }
        }
     } catch (error) {
       toast.error("Erro ao carregar detalhes do evento");
     } finally {
       setIsLoading(false);
     }
   };
 
    const setLiveStatusMessage = async (msg: string) => {
      if (!selectedEventId) return;
      
      // Update with the message and a fresh updated_at to ensure Realtime triggers
      const { error } = await supabase
        .from("events")
        .update({ 
          live_status_message: msg,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedEventId);
      
      if (error) toast.error("Erro ao enviar mensagem");
      else toast.success(`Mensagem "${msg}" enviada!`);
    };
 
    const updateTransmissionLink = async () => {
      if (!selectedEventId) return;
      
      if (transmissionLink && !validateLiveLink(transmissionLink)) {
        toast.error("Por favor, insira um link válido do YouTube ou Vimeo");
        return;
      }
      
      setIsActionLoading(true);
      try {
        const { error } = await supabase
          .from("events")
          .update({ transmission_link: transmissionLink })
          .eq("id", selectedEventId);
        
        if (error) throw error;
        toast.success("Link de transmissão atualizado!");
        fetchEventDetails(selectedEventId);
      } catch (error: any) {
        toast.error("Erro ao atualizar link: " + error.message);
      } finally {
        setIsActionLoading(false);
      }
    };

   const activateLot = async (lotId: string) => {
     setIsActionLoading(true);
     try {
       // 1. Reset all lots for this event to not live
       await supabase.from("lots").update({ is_currently_live: false }).eq("event_id", selectedEventId);
       
       // 2. Set this lot as live and update active_lot_id in event
       await Promise.all([
         supabase.from("lots").update({ is_currently_live: true, status: 'active' }).eq("id", lotId),
         supabase.from("events").update({ active_lot_id: lotId, status: 'live' }).eq("id", selectedEventId)
       ]);
 
       toast.success("Lote ativado na tela ao vivo!");
       fetchEventDetails(selectedEventId);
     } catch (error) {
       toast.error("Erro ao ativar lote");
     } finally {
       setIsActionLoading(false);
     }
   };
 
     const sellLot = async (lotId: string) => {
       // Find the winner (last bid)
       const { data: lastBid } = await supabase
         .from("bids")
         .select("*, profile:profiles(full_name)")
         .eq("lot_id", lotId)
         .order("created_at", { ascending: false })
         .limit(1)
         .maybeSingle();

       let finalWinnerId = lastBid?.user_id || null;
       
        // If there's no winner, we can't sell
        if (!lastBid) {
          toast.error("Não há lances para este lote.");
          return;
        }

        // If the bid is already linked to a user (not a generic phone bid without profile)
        // we don't need to ask to link it, just a simple confirmation of the sale.
        const isGenericPhoneBid = lastBid.is_phone_bid && !lastBid.user_id;
        const isAdminBid = lastBid.user_id === currentUserId && !lastBid.is_phone_bid;

        // Automatic linking logic (Refined):
        // If the bid is from phone but we have a profile selected in the UI, auto-link it
        if (isGenericPhoneBid && phoneBid.profileId) {
          finalWinnerId = phoneBid.profileId;
          // Also update the bid itself to be linked to this profile for auditing
          await supabase.from("bids").update({ user_id: finalWinnerId }).eq("id", lastBid.id);
          toast.info(`Vinculando arremate automaticamente ao perfil: ${profiles.find(p => p.id === phoneBid.profileId)?.full_name}`);
        } else if (lastBid.user_id) {
          finalWinnerId = lastBid.user_id;
        } else if (isGenericPhoneBid && !phoneBid.profileId) {
          // Still generic, ask if they want to link it first
          if (confirm(`Este arremate foi via TELEFONE (${lastBid.phone_bidder_identifier || 'não identificado'}).\n\nDeseja vinculá-lo a um perfil cadastrado agora?`)) {
            toast.info("Selecione um 'Cadastro Real' na barra lateral e clique em Arrematar novamente.");
            return;
          }
        }

       setIsActionLoading(true);
       try {
        await supabase.from("lots").update({ 
          status: 'sold', 
          is_currently_live: false,
           winner_id: finalWinnerId,
           winner_link_reason: lastBid.is_phone_bid ? 'Vínculo manual (Lance Telefone)' : 'Vínculo automático (Lance Online)',
           last_bid_ip: lastBid.ip_address,
          updated_at: new Date().toISOString()
        }).eq("id", lotId);
         
          await handleAfterLotFinalized(lotId, "Lote ARREMATADO com sucesso!", activeLot?.lot_number);
       } catch (error) {
         toast.error("Erro ao arrematar lote");
       } finally {
         setIsActionLoading(false);
       }
     };

    const passLot = async (lotId: string) => {
      setIsActionLoading(true);
      try {
        await supabase.from("lots").update({ 
          status: 'passed', 
          is_currently_live: false,
          updated_at: new Date().toISOString()
        }).eq("id", lotId);
        await handleAfterLotFinalized(lotId, "Lote finalizado sem venda.", activeLot?.lot_number);
      } catch (error) {
        toast.error("Erro ao finalizar lote");
      } finally {
        setIsActionLoading(false);
      }
    };

    const updateLiveView = async () => {
      if (!selectedEventId) return;
      setIsActionLoading(true);
      try {
        const { error } = await supabase.from("events").update({ 
          updated_at: new Date().toISOString(),
          // Dummy change to ensure realtime trigger even if updated_at was just updated by a database trigger
          live_status_message: liveEvent.live_status_message 
        }).eq("id", selectedEventId);

        if (error) throw error;

        toast.success("Comando de atualização enviado para todos os usuários!");
        await fetchEventDetails(selectedEventId);
      } catch (error) {
        toast.error("Erro ao atualizar tela dos usuários");
      } finally {
        setIsActionLoading(false);
      }
    };

    const handleAfterLotFinalized = async (lotId: string, successMessage: string, lotNumber?: number) => {
      toast.success(successMessage);

      // Broadcast the finalized status to all viewers via the event's status message
      const broadcastMsg = lotNumber ? `LOTE #${lotNumber} FINALIZADO!` : successMessage;
      await supabase.from("events").update({ 
        live_status_message: broadcastMsg,
        updated_at: new Date().toISOString()
      }).eq("id", selectedEventId);
      
       // Give some time (10 seconds) for users to see the "Sold/Passed" status and the final overlay 
      // before we clear the active lot from the screen
      setTimeout(async () => {
        // Clear the status message after the delay
        await supabase.from("events").update({ live_status_message: null }).eq("id", selectedEventId);

        // Check if there are more lots to be auctioned
        const remainingLots = lots.filter(l => l.id !== lotId && l.status !== 'sold' && l.status !== 'passed' && l.status !== 'finished');
        
         // If auto-advance is on, find the next lot
         if (isAutoAdvancing && remainingLots.length > 0) {
           const nextLot = remainingLots.sort((a, b) => a.lot_number - b.lot_number)[0];
           toast.info(`Avançando automaticamente para o Lote #${nextLot.lot_number}...`);
           await activateLot(nextLot.id);
         } else {
           if (remainingLots.length === 0) {
             await supabase.from("events").update({ active_lot_id: null, status: 'finished' }).eq("id", selectedEventId);
           } else {
             await supabase.from("events").update({ active_lot_id: null }).eq("id", selectedEventId);
           }
           fetchEventDetails(selectedEventId);
           setActiveLot(null);
         }
       }, 10000);
    };

    const finalizeLot = async (lotId: string) => {
      // Legacy function fallback or for generic finalization
      if (!confirm("Tem certeza que deseja finalizar este lote?")) return;
      setIsActionLoading(true);
      try {
        await supabase.from("lots").update({ status: 'passed', is_currently_live: false }).eq("id", lotId);
        await handleAfterLotFinalized(lotId, "Lote finalizado!");
      } catch (error) {
        toast.error("Erro ao finalizar lote");
      } finally {
        setIsActionLoading(false);
      }
    };

    const finalizeEvent = async () => {
      if (!confirm("Deseja realmente encerrar este evento? Todos os lotes pendentes serão mantidos como estão.")) return;
      setIsActionLoading(true);
      try {
        await supabase.from("events").update({ status: 'finished', active_lot_id: null }).eq("id", selectedEventId);
        await supabase.from("lots").update({ is_currently_live: false }).eq("event_id", selectedEventId);
        
        toast.success("Evento encerrado com sucesso!");
        fetchEvents();
        setLiveEvent(null);
        setSelectedEventId("");
      } catch (error) {
        toast.error("Erro ao encerrar evento");
      } finally {
        setIsActionLoading(false);
      }
    };
 
   const handlePhoneBid = async () => {
     if (!activeLot || phoneBid.amount <= (activeLot.current_price || activeLot.starting_price)) {
       toast.error("Valor do lance deve ser maior que o atual");
       return;
     }
 
     setIsActionLoading(true);
     try {
       const { data, error } = await supabase.rpc("place_bid_safe", {
         p_lot_id: activeLot.id,
         p_amount: phoneBid.amount,
         p_bid_type: "online", // Using online but marking as phone bid via extra fields if needed or specific type
         p_session_id: "admin-live-phone-bid"
       });
 
       if (error) throw error;
       
       // Also mark as phone bid (requires the bid ID which isn't returned by place_bid_safe easily, 
       // but we can query the latest bid for this lot)
       const { data: latestBid } = await supabase
         .from("bids")
         .select("id")
         .eq("lot_id", activeLot.id)
         .order("created_at", { ascending: false })
         .limit(1)
         .single();
       
       if (latestBid) {
         await supabase.from("bids").update({
           is_phone_bid: true,
           phone_bidder_identifier: phoneBid.identifier
         }).eq("id", latestBid.id);
       }
 
        if (latestBid && phoneBid.profileId) {
          await supabase.from("bids").update({
            user_id: phoneBid.profileId
          }).eq("id", latestBid.id);
        }

        toast.success("Lance via telefone registrado!");
        setPhoneBid({ amount: 0, identifier: "", profileId: "" });
       fetchEventDetails(selectedEventId);
     } catch (error: any) {
       toast.error(error.message);
     } finally {
       setIsActionLoading(false);
     }
   };
 
    const handleSecurityBid = async () => {
      if (!activeLot) {
        toast.error("Nenhum lote ativo");
        return;
      }

      const amount = securityBidAmount || (activeLot.current_price || activeLot.starting_price) + activeLot.bid_increment;
      
      setIsActionLoading(true);
      try {
        const { data, error } = await supabase.rpc("place_bid_safe", {
          p_lot_id: activeLot.id,
          p_amount: amount,
          p_bid_type: "security",
          p_session_id: "admin-security-bid"
        });

        if (error) throw error;
        
        const result = data as any;
        if (result.success) {
          toast.success("Lance de segurança (auditório) efetuado!");
          setSecurityBidAmount(0);
          fetchEventDetails(selectedEventId);
        } else {
          toast.error(result.message);
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsActionLoading(false);
      }
    };

    const statusLegend = [
      { label: 'Loteamento', desc: 'Fase de cadastro. O evento não aceita lances.' },
      { label: 'Aceita pré-lance', desc: 'Aguardando data oficial de início.' },
      { label: 'Recebendo Lances', desc: 'Aberto para lances em todos os lotes (Online).' },
      { label: 'Ao Vivo', desc: 'Evento em tempo real com transmissão e martelo.' },
      { label: 'Condicional', desc: 'Maior lance em negociação com o vendedor.' },
      { label: 'Evento Confirmado', desc: 'Venda confirmada e finalizada.' },
    ];

    return (
      <div className="space-y-6">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-[10px] font-bold border-gold/30 bg-gold/5 text-gold hover:bg-gold/10">
                  <Info className="h-3 w-3" /> LEGENDA DE STATUS
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-gold flex items-center gap-2">
                    <Info className="h-5 w-5" /> Legenda de Status
                  </DialogTitle>
                  <DialogDescription>
                    Entenda como cada status afeta o comportamento do leilão no site.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {statusLegend.map((s) => (
                    <div key={s.label} className="flex flex-col gap-1 pb-3 border-b border-white/5 last:border-0">
                      <span className="text-xs font-black uppercase text-white tracking-tighter italic">{s.label}</span>
                      <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

       <Card className="border-gold/30">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Video className="h-6 w-6 text-gold" /> Painel do Auditório (Ao Vivo)
                </CardTitle>
                <CardDescription>Controle total da transmissão e dos lances em tempo real.</CardDescription>
              </div>
              {selectedEventId && liveEvent && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-emerald-deep/5 px-4 py-2 rounded-full border border-gold/20">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-emerald-deep uppercase">{liveEvent.name}</span>
                  </div>
                  <StatusBadge status={liveEvent.status} urgent={liveEvent.status === 'live'} />
                </div>
              )}
            </div>
          </CardHeader>
         <CardContent>
           <div className="flex flex-col gap-4 md:flex-row md:items-end">
             <div className="flex-1 space-y-2">
               <Label>Selecione o Evento</Label>
               <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                 <SelectTrigger>
                   <SelectValue placeholder="Escolha um evento ativo" />
                 </SelectTrigger>
                 <SelectContent>
                   {events.map(e => (
                     <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => selectedEventId && fetchEventDetails(selectedEventId)}
                  disabled={!selectedEventId || isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Painel"}
                </Button>
                {selectedEventId && liveEvent && (
                  <div className="flex gap-2">
                    {liveEvent.status === 'scheduled' && (
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={async () => {
                          setIsActionLoading(true);
                          const { error } = await supabase.from("events").update({ status: 'live' }).eq("id", selectedEventId);
                          if (error) toast.error(error.message);
                          else {
                            toast.success("Evento agora está AO VIVO!");
                            fetchEventDetails(selectedEventId);
                          }
                          setIsActionLoading(false);
                        }}
                        disabled={isActionLoading}
                      >
                        <Play className="mr-2 h-4 w-4" /> Iniciar Leilão
                      </Button>
                    )}
                    {liveEvent.status === 'live' && (
                      <Button 
                        variant="outline"
                        className="border-amber-500 text-amber-600 hover:bg-amber-50"
                        onClick={async () => {
                          setIsActionLoading(true);
                          const { error } = await supabase.from("events").update({ status: 'scheduled' }).eq("id", selectedEventId);
                          if (error) toast.error(error.message);
                          else {
                            toast.success("Evento pausado (Aceita pré-lance)");
                            fetchEventDetails(selectedEventId);
                          }
                          setIsActionLoading(false);
                        }}
                        disabled={isActionLoading}
                      >
                        <Timer className="mr-2 h-4 w-4" /> Pausar / Voltar p/ Aceita pré-lance
                      </Button>
                    )}
                     <div className="flex gap-2">
                       <Button 
                         variant="outline"
                         className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                         onClick={updateLiveView}
                         disabled={isActionLoading}
                         title="Forçar atualização da tela para todos os usuários"
                       >
                         <RefreshCw className={`mr-2 h-4 w-4 ${isActionLoading ? 'animate-spin' : ''}`} /> Atualizar Usuários
                       </Button>
                       <Button 
                         variant="destructive" 
                         onClick={finalizeEvent}
                         disabled={isActionLoading}
                       >
                         <Square className="mr-2 h-4 w-4" /> Encerrar Evento
                       </Button>
                     </div>
                  </div>
                )}
              </div>
           </div>
         </CardContent>
       </Card>
 
        {selectedEventId && liveEvent && (
          <div className="space-y-6">
            {/* Destaque do Lote Ativo para o Narrador */}
            {activeLot && (
              <Card className="border-gold border-2 bg-emerald-deep shadow-2xl overflow-hidden">
                <div className="bg-gold/10 px-6 py-3 border-b border-gold/30 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gold animate-pulse" />
                    <span className="text-gold font-black uppercase tracking-widest text-sm">Lote no Ar agora</span>
                    <StatusBadge status={activeLot.status} className="h-5 text-[9px] px-2 bg-white/10 text-white border-white/20" />
                  </div>
                   <div className="flex items-center gap-6 text-white/60 text-xs font-bold uppercase">
                     <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                       <span className="text-[9px]">Avanço Automático</span>
                       <input 
                         type="checkbox" 
                         checked={isAutoAdvancing} 
                         onChange={(e) => setIsAutoAdvancing(e.target.checked)}
                         className="accent-gold h-3 w-3"
                       />
                     </div>
                     <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {liveEvent.viewers || 0} assistindo</span>
                     <span className="flex items-center gap-1"><History className="h-3 w-3" /> {activeLot.bids_count || 0} lances</span>
                   </div>
                </div>
                <CardContent className="p-6 md:p-8">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h2 className="text-white/60 text-lg uppercase font-bold mb-1">Lote {activeLot.lot_number}</h2>
                      <h3 className="text-white text-4xl md:text-5xl font-black mb-4 tracking-tight">
                        {activeLot.animal?.name}
                      </h3>
                      <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1">
                        <TrendingUp className="h-4 w-4 text-gold" />
                        <span className="text-white/80 font-medium text-sm">Valor Inicial: {formatBRL(activeLot.starting_price)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                      <span className="text-gold font-black uppercase tracking-widest text-xs mb-2">Lance Atual / No Momento</span>
                      <div className="text-5xl md:text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">
                        {formatBRL(activeLot.current_price || activeLot.starting_price)}
                      </div>
                      <div className="mt-4 flex gap-4">
                         <div className="flex flex-col">
                            <span className="text-[10px] text-white/40 uppercase font-bold">Mín. p/ Próximo</span>
                            <span className="text-gold font-bold">{formatBRL((activeLot.current_price || activeLot.starting_price) + (activeLot.bid_increment || 500))}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          <Card className="border-gold/50 bg-gold/5">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gold font-bold">
                    <Video className="h-4 w-4" /> LINK DA TRANSMISSÃO (YOUTUBE / VIMEO)
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Cole aqui o link do vídeo ao vivo (ex: https://www.youtube.com/watch?v=...)" 
                      value={transmissionLink}
                      onChange={(e) => setTransmissionLink(e.target.value)}
                      className="flex-1 bg-white border-gold/30 focus:border-gold"
                    />
                    <Button 
                      onClick={updateTransmissionLink}
                      disabled={isActionLoading}
                      className="bg-gold text-emerald-deep hover:bg-gold/90 font-bold"
                    >
                      {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ATUALIZAR VÍDEO"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Este link será exibido imediatamente para todos os usuários no "Auditório / Ao Vivo".
                  </p>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/ao-vivo', '_blank')}
                    className="border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Ver Tela do Público
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

       {selectedEventId && liveEvent && (
         <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
           <div className="space-y-6">
             {/* Controle de Lotes */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fila de Lotes</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                   {lots.map((lot) => (
                     <div 
                       key={lot.id} 
                       className={`relative rounded-xl border p-4 transition-all ${
                         lot.id === liveEvent.active_lot_id 
                         ? "border-gold bg-gold/5 ring-1 ring-gold shadow-gold-sm" 
                          : (lot.status === 'sold' || lot.status === 'passed' || lot.status === 'finished')
                         ? "opacity-50 bg-muted" 
                         : "hover:border-gold/50 cursor-pointer"
                       }`}
                     >
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-bold text-muted-foreground">Lote {lot.lot_number}</span>
                         {lot.id === liveEvent.active_lot_id && (
                           <span className="flex items-center gap-1 text-[10px] font-black uppercase text-gold animate-pulse">
                             <div className="h-1.5 w-1.5 rounded-full bg-gold" /> Ao Vivo
                           </span>
                         )}
                       </div>
                       <h4 className="font-bold truncate">{lot.animal?.name}</h4>
                        <div className="mt-4 flex flex-col gap-2">
                          {lot.id !== liveEvent.active_lot_id && lot.status !== 'sold' && lot.status !== 'passed' && lot.status !== 'finished' && (
                            <Button 
                              size="sm" 
                              className="w-full bg-gold/10 text-gold hover:bg-gold/20"
                              onClick={() => activateLot(lot.id)}
                              disabled={isActionLoading}
                            >
                              <Play className="mr-1 h-3 w-3" /> Entrar no Ar
                            </Button>
                          )}
                          {lot.id === liveEvent.active_lot_id && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => sellLot(lot.id)}
                                disabled={isActionLoading}
                              >
                                <Check className="mr-1 h-3 w-3" /> Arrematar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => passLot(lot.id)}
                                disabled={isActionLoading}
                              >
                                <Ban className="mr-1 h-3 w-3" /> Passou
                              </Button>
                            </div>
                          )}
                        </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
 
             {/* Mensagens Rápidas */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Interação com Público (Auditório)</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                   {quickMessages.map((msg, i) => (
                     <Button 
                       key={i} 
                       variant="outline" 
                       size="sm" 
                       className="text-[10px] h-auto py-2 text-wrap"
                       onClick={() => setLiveStatusMessage(msg)}
                     >
                       {msg}
                     </Button>
                   ))}
                 </div>
                 <div className="mt-4 flex gap-2">
                   <Input 
                     placeholder="Mensagem personalizada..." 
                     id="custom-msg"
                     className="flex-1"
                   />
                   <Button 
                     onClick={() => {
                       const val = (document.getElementById('custom-msg') as HTMLInputElement).value;
                       if (val) {
                         setLiveStatusMessage(val);
                         (document.getElementById('custom-msg') as HTMLInputElement).value = '';
                       }
                     }}
                   >
                     Enviar
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </div>
 
           {/* Sidebar de Lance Ativo */}
            <div className="space-y-4">
              <Card className="border-gold/50 bg-emerald-deep text-white shadow-lg overflow-hidden">
                <CardHeader className="pb-2 bg-gold/10 border-b border-gold/20">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-gold flex items-center justify-between">
                    <span>Últimos Lances</span>
                    <div className="h-2 w-2 rounded-full bg-live animate-pulse" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[300px] overflow-y-auto">
                    {bids.length > 0 ? (
                      <div className="divide-y divide-white/10">
                        {bids.map((bid, i) => (
                          <div key={bid.id} className={`p-3 flex items-center justify-between text-xs transition-colors ${i === 0 ? "bg-gold/5" : ""}`}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white">
                                  {bid.bid_type === 'security' 
                                    ? "Auditório/Mesa" 
                                    : (bid.is_phone_bid ? (bid.phone_bidder_identifier || "Telefone") : (bid.profile?.full_name || "Licitante"))}
                                </span>
                                {bid.profile?.risk_level === 'high' && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-white/50">
                                <span>{new Date(bid.created_at).toLocaleTimeString("pt-BR")}</span>
                                <span className="uppercase">{bid.bid_type}</span>
                              </div>
                            </div>
                            <span className={`font-mono font-black ${i === 0 ? "text-gold text-sm" : "text-white/80"}`}>
                              {formatBRL(bid.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-white/20 italic text-xs">
                        Aguardando lances...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gold/50 bg-emerald-deep text-white">
               <CardHeader className="pb-2">
                 <CardTitle className="text-lg text-gold flex items-center gap-2">
                   <Gavel className="h-5 w-5" /> Lance por Telefone
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {activeLot ? (
                   <>
                     <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                       <p className="text-[10px] uppercase text-white/60">Lote Ativo</p>
                       <p className="font-bold">#{activeLot.lot_number} - {activeLot.animal?.name}</p>
                       <p className="text-xl font-black text-gold mt-1">{formatBRL(activeLot.current_price || activeLot.starting_price)}</p>
                     </div>
                     
                     <div className="space-y-2">
                        <Label className="text-white/80 text-xs uppercase font-bold tracking-wider">Valor do Lance</Label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {[500, 1000, 2000, 5000].map((inc) => (
                            <Button
                              key={inc}
                              size="sm"
                              variant="outline"
                              className="bg-white/5 border-white/20 text-white hover:bg-white/20 h-8 text-[10px]"
                              onClick={() => {
                                const current = activeLot.current_price || activeLot.starting_price;
                                setPhoneBid({ ...phoneBid, amount: current + inc });
                              }}
                            >
                              +{formatBRL(inc)}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/5 border-white/20 text-white hover:bg-white/20 h-8 text-[10px]"
                            onClick={() => {
                              const current = activeLot.current_price || activeLot.starting_price;
                              setPhoneBid({ ...phoneBid, amount: current + activeLot.bid_increment });
                            }}
                          >
                            +Inc ({formatBRL(activeLot.bid_increment)})
                          </Button>
                        </div>
                        <Input 
                          type="number" 
                          className="bg-white/10 border-white/20 text-white text-lg font-bold" 
                          placeholder="0,00"
                          value={phoneBid.amount || ""}
                          onChange={(e) => setPhoneBid({...phoneBid, amount: parseFloat(e.target.value)})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white/80 text-xs uppercase font-bold tracking-wider">Identificação (Telefone/Plaqueta)</Label>
                        <div className="grid grid-cols-3 gap-1 mb-2">
                          {["Mesa 1", "Mesa 2", "Tel 1", "Tel 2", "Auditório", "Plaqueta"].map(id => (
                            <Button
                              key={id}
                              size="sm"
                              variant="outline"
                              className="bg-white/5 border-white/20 text-white hover:bg-white/20 h-7 text-[9px] px-1"
                              onClick={() => setPhoneBid({ ...phoneBid, identifier: id })}
                            >
                              {id}
                            </Button>
                          ))}
                        </div>
                        <Input 
                          className="bg-white/10 border-white/20 text-white flex-1" 
                          placeholder="Ex: Plaquetão 45 / João"
                          value={phoneBid.identifier}
                          onChange={(e) => setPhoneBid({...phoneBid, identifier: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white/80 text-xs uppercase font-bold tracking-wider">Vincular a Cadastro Real (Opcional)</Label>
                        <Select 
                          value={phoneBid.profileId} 
                          onValueChange={(val) => setPhoneBid({...phoneBid, profileId: val})}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecione um cliente..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            <div className="p-2 border-b">
                              <Input 
                                placeholder="Filtrar por nome..." 
                                className="h-8"
                                value={searchProfile}
                                onChange={(e) => setSearchProfile(e.target.value)}
                              />
                            </div>
                            {profiles
                              .filter(p => p.full_name?.toLowerCase().includes(searchProfile.toLowerCase()) || p.phone?.includes(searchProfile))
                              .slice(0, 10)
                              .map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.full_name} {p.phone ? `(${p.phone})` : ''}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[9px] text-white/40 italic">Vincular agora facilita a geração de contratos após o leilão.</p>
                      </div>
 
                     <Button 
                       className="w-full bg-gold text-emerald-deep font-bold hover:bg-gold/90"
                       onClick={handlePhoneBid}
                       disabled={isActionLoading || !phoneBid.amount}
                     >
                       {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                       Registrar Lance
                     </Button>
                   </>
                 ) : (
                   <div className="py-8 text-center text-white/40">
                     <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-20" />
                     <p className="text-xs">Nenhum lote ativo na tela ao vivo no momento.</p>
                   </div>
                 )}
               </CardContent>
             </Card>
 
              <Card className="border-gold/50 bg-emerald-deep text-white shadow-gold-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-lg text-gold font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Auditório / Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[10px] text-white/60 uppercase leading-tight">
                    Lances manuais recebidos no local físico ou lances de segurança.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[500, 1000, 2000, 5000].map(inc => (
                      <Button 
                        key={inc}
                        variant="outline" 
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-8 font-bold text-[10px]"
                        onClick={() => {
                          if (!activeLot) return;
                          const base = activeLot.current_price || activeLot.starting_price;
                          setSecurityBidAmount(base + inc);
                        }}
                        disabled={!activeLot}
                      >
                        +{formatBRL(inc)}
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-8 font-bold text-[10px]"
                      onClick={() => {
                        if (!activeLot) return;
                        const base = activeLot.current_price || activeLot.starting_price;
                        setSecurityBidAmount(base + activeLot.bid_increment);
                      }}
                      disabled={!activeLot}
                    >
                      +Inc ({activeLot ? formatBRL(activeLot.bid_increment) : "..."})
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-white/80">Valor do Lance</Label>
                    <Input 
                      type="number" 
                      className="h-10 bg-white/10 border-white/20 text-white text-lg font-bold" 
                      placeholder="0,00"
                      value={securityBidAmount || ""}
                      onChange={(e) => setSecurityBidAmount(parseFloat(e.target.value))}
                    />
                  </div>
                  <Button 
                    className="w-full h-12 bg-gold text-emerald-deep font-black text-base hover:bg-gold/90 transition-all active:scale-95"
                    onClick={handleSecurityBid}
                    disabled={isActionLoading || !activeLot}
                  >
                    {isActionLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Gavel className="mr-2 h-5 w-5" />}
                    {securityBidAmount ? `CONFIRMAR ${formatBRL(securityBidAmount)}` : "CONFIRMAR LANCE"}
                  </Button>
                </CardContent>
              </Card>

             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-bold flex items-center gap-2">
                   <Users className="h-4 w-4" /> Público On-line
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-3xl font-black text-emerald-deep">
                   {liveEvent.viewers || 0}
                 </div>
                 <p className="text-xs text-muted-foreground">Pessoas assistindo agora</p>
               </CardContent>
             </Card>
           </div>
         </div>
       )}
     </div>
   );
 }