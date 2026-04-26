 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { toast } from "sonner";
 import { 
   Play, Square, MessageSquare, Phone, Timer, Gavel, 
   Video, Users, Loader2, AlertTriangle, CheckCircle2 
 } from "lucide-react";
  import { formatBRL, validateLiveLink } from "@/utils/format";
 
 export function LiveAuctionControl() {
   const [events, setEvents] = useState<any[]>([]);
   const [selectedEventId, setSelectedEventId] = useState<string>("");
   const [liveEvent, setLiveEvent] = useState<any>(null);
   const [lots, setLots] = useState<any[]>([]);
   const [activeLot, setActiveLot] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [isActionLoading, setIsActionLoading] = useState(false);
  const [transmissionLink, setTransmissionLink] = useState("");
   
   // Phone bid form
    const [phoneBid, setPhoneBid] = useState({ amount: 0, identifier: "" });
    const [securityBidAmount, setSecurityBidAmount] = useState<number>(0);
 
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
   }, []);
 
   useEffect(() => {
     if (selectedEventId) {
       fetchEventDetails(selectedEventId);
     }
   }, [selectedEventId]);
 
   const fetchEvents = async () => {
     const { data } = await supabase
       .from("events")
       .select("id, name")
       .or("status.eq.live,status.eq.scheduled")
       .order("start_date", { ascending: false });
     setEvents(data || []);
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
     const { error } = await supabase
       .from("events")
       .update({ live_status_message: msg })
       .eq("id", selectedEventId);
     
     if (error) toast.error("Erro ao enviar mensagem");
     else toast.success("Mensagem enviada!");
   };
 
    const updateTransmissionLink = async () => {
      if (!selectedEventId) return;
      
      if (transmissionLink && !validateLiveLink(transmissionLink)) {
        toast.error("Por favor, insira um link válido do YouTube ou Vimeo");
        return;
      }
      
      setIsActionLoading(true);
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
 
    const finalizeLot = async (lotId: string) => {
      if (!confirm("Tem certeza que deseja finalizar este lote?")) return;
      setIsActionLoading(true);
      try {
        await supabase.from("lots").update({ status: 'finished', is_currently_live: false }).eq("id", lotId);
        
        // Check if there are more lots to be auctioned
        const remainingLots = lots.filter(l => l.id !== lotId && l.status !== 'finished');
        
        if (remainingLots.length === 0) {
          await supabase.from("events").update({ active_lot_id: null, status: 'finished' }).eq("id", selectedEventId);
          toast.success("Lote finalizado e evento encerrado!");
        } else {
          await supabase.from("events").update({ active_lot_id: null }).eq("id", selectedEventId);
          toast.success("Lote finalizado!");
        }
        
        fetchEventDetails(selectedEventId);
        setActiveLot(null);
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
 
       toast.success("Lance via telefone registrado!");
       setPhoneBid({ amount: 0, identifier: "" });
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

   return (
     <div className="space-y-6">
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
                <div className="flex items-center gap-2 bg-emerald-deep/5 px-4 py-2 rounded-full border border-gold/20">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-emerald-deep uppercase">{liveEvent.name}</span>
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
                            toast.success("Evento pausado (Agendado)");
                            fetchEventDetails(selectedEventId);
                          }
                          setIsActionLoading(false);
                        }}
                        disabled={isActionLoading}
                      >
                        <Timer className="mr-2 h-4 w-4" /> Pausar / Voltar p/ Agendado
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      onClick={finalizeEvent}
                      disabled={isActionLoading}
                    >
                      <Square className="mr-2 h-4 w-4" /> Encerrar Evento
                    </Button>
                  </div>
                )}
              </div>
           </div>
         </CardContent>
       </Card>
 
        {selectedEventId && liveEvent && (
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
                         : lot.status === 'finished' 
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
                       <div className="mt-4 flex gap-2">
                         {lot.id !== liveEvent.active_lot_id && lot.status !== 'finished' && (
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
                           <Button 
                             size="sm" 
                             variant="destructive" 
                             className="w-full"
                             onClick={() => finalizeLot(lot.id)}
                             disabled={isActionLoading}
                           >
                             <Square className="mr-1 h-3 w-3" /> Finalizar
                           </Button>
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
           <div className="space-y-6">
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
                       <Label className="text-white/80">Valor do Lance</Label>
                       <Input 
                         type="number" 
                         className="bg-white/10 border-white/20 text-white" 
                         placeholder="0,00"
                         value={phoneBid.amount || ""}
                         onChange={(e) => setPhoneBid({...phoneBid, amount: parseFloat(e.target.value)})}
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label className="text-white/80">Identificador (Nome/Tel)</Label>
                       <Input 
                         className="bg-white/10 border-white/20 text-white" 
                         placeholder="Ex: João (WhatsApp)"
                         value={phoneBid.identifier}
                         onChange={(e) => setPhoneBid({...phoneBid, identifier: e.target.value})}
                       />
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
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-10 font-bold"
                      onClick={() => {
                        if (!activeLot) return;
                        const base = activeLot.current_price || activeLot.starting_price;
                        setSecurityBidAmount(base + activeLot.bid_increment);
                      }}
                      disabled={!activeLot}
                    >
                      +{activeLot ? formatBRL(activeLot.bid_increment) : "..."}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-10 font-bold"
                      onClick={() => {
                        if (!activeLot) return;
                        const base = activeLot.current_price || activeLot.starting_price;
                        setSecurityBidAmount(base + (activeLot.bid_increment * 2));
                      }}
                      disabled={!activeLot}
                    >
                      +{(activeLot?.bid_increment || 0) * 2 ? formatBRL(activeLot.bid_increment * 2) : "..."}
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