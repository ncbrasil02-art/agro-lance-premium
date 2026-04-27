   import { useRealtimeLots } from "@/hooks/useRealtimeEvent";
 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Loader2, Link as LinkIcon, PlusCircle, Zap, ShieldCheck, AlertTriangle, Filter, HelpCircle, Info, History, ChevronDown, ChevronRight, Printer, MessageSquare, Play, PauseCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
 import { Label } from "@/components/ui/label";
  import { toast } from "sonner";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 
    export function LotManagement({ 
      initialEventId = "all", 
      onEventChange 
    }: { 
      initialEventId?: string; 
      onEventChange?: (id: string) => void;
    }) {
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const [isLoading, setIsLoading] = useState(true);
      const [lots, setLots] = useState<any[]>([]);
      const [events, setEvents] = useState<any[]>([]);
      const [availableAnimals, setAvailableAnimals] = useState<any[]>([]);
       const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
       const [statusFilter, setStatusFilter] = useState<string>("all");
      const [searchQuery, setSearchQuery] = useState("");
      const [editingLot, setEditingLot] = useState<any>(null);
      const [expandedLotId, setExpandedLotId] = useState<string | null>(null);
      const [selectedLotBids, setSelectedLotBids] = useState<any[]>([]);
      const [selectedLotOffers, setSelectedLotOffers] = useState<any[]>([]);
      const [isBidsDialogOpen, setIsBidsDialogOpen] = useState(false);
      const [isBidsLoading, setIsBidsLoading] = useState(false);
      
      const [formData, setFormData] = useState({
        event_id: "",
        animal_id: "",
        lot_number: 1,
        starting_price: 0,
        bid_increment: 1000,
         status: "active",
         allows_pre_bidding: true,
         is_featured: false,
         payment_methods: "",
         viewers: 0
       });

      const fetchData = async () => {
        setIsLoading(true);
        console.log("Fetching lots, events and animals...");
        try {
          const [lotsRes, eventsRes, animalsRes] = await Promise.all([
            supabase
              .from("lots")
               .select("*, event:events!event_id(name, end_date), animal:animals(name, internal_code)")
              .order("is_featured", { ascending: false })
              .order("lot_number", { ascending: true }),
            supabase
              .from("events")
              .select("id, name")
              .order("name"),
            supabase
              .from("animals")
              .select("id, name, internal_code")
              .order("name")
          ]);
    
          if (lotsRes.error) {
            console.error("Error fetching lots:", lotsRes.error);
            throw lotsRes.error;
          }
          if (eventsRes.error) {
            console.error("Error fetching events for lots:", eventsRes.error);
            throw eventsRes.error;
          }
          if (animalsRes.error) {
            console.error("Error fetching animals for lots:", animalsRes.error);
            throw animalsRes.error;
          }
    
          console.log("Data loaded for Lots tab:", {
            lots: lotsRes.data?.length || 0,
            events: eventsRes.data?.length || 0,
            animals: animalsRes.data?.length || 0
          });

          setLots(lotsRes.data || []);
          setEvents(eventsRes.data || []);
          setAvailableAnimals(animalsRes.data || []);
          
          if (initialEventId !== "all") {
            setFormData(prev => ({ ...prev, event_id: initialEventId }));
          }
        } catch (error: any) {
          console.error("Catch error in fetchData (Lots):", error);
          toast.error("Erro ao carregar dados: " + error.message);
        } finally {
          setIsLoading(false);
        }
      };

       useEffect(() => {
         setSelectedEventId(initialEventId);
         fetchData();
       }, [initialEventId]);
 
        useRealtimeLots(() => {
          fetchData();
          if (expandedLotId) {
            fetchLotBids(expandedLotId, true);
            fetchLotOffers(expandedLotId);
          }
        });

       const resetForm = () => {
         setEditingLot(null);
         setFormData({
           event_id: initialEventId !== "all" ? initialEventId : "",
           animal_id: "",
           lot_number: 1,
           starting_price: 0,
           bid_increment: 1000,
           status: "active",
           allows_pre_bidding: true,
           is_featured: false,
           payment_methods: "",
           viewers: 0
         });
       };

      const handleEdit = (lot: any) => {
        setEditingLot(lot);
        setFormData({
          event_id: lot.event_id || "",
          animal_id: lot.animal_id || "",
          lot_number: lot.lot_number || 1,
          starting_price: lot.starting_price || 0,
          bid_increment: lot.bid_increment || 1000,
           status: lot.status || "active",
           allows_pre_bidding: lot.allows_pre_bidding !== false,
           is_featured: lot.is_featured || false,
           payment_methods: lot.payment_methods?.join(", ") || "",
           viewers: lot.viewers || 0
         });
        setIsDialogOpen(true);
      };
   
      const fetchLotBids = async (lotId: string, silent = false) => {
          if (!silent) {
            setIsBidsLoading(true);
            setIsBidsDialogOpen(true);
          }
         try {
           const { data, error } = await supabase
             .from("bids")
             .select(`
               *,
               profile:profiles(full_name)
             `)
             .eq("lot_id", lotId)
             .order("created_at", { ascending: false });

            if (error) throw error;
            setSelectedLotBids(data || []);
            return data || [];
         } catch (error: any) {
           toast.error("Erro ao carregar lances: " + error.message);
          } finally {
            if (!silent) setIsBidsLoading(false);
          }
        };

        const fetchLotOffers = async (lotId: string) => {
          try {
            const { data, error } = await supabase
              .from("offers")
              .select(`
                *,
                profile:profiles(full_name)
              `)
              .eq("lot_id", lotId)
              .order("created_at", { ascending: false });

            if (error) throw error;
            setSelectedLotOffers(data || []);
          } catch (error: any) {
            console.error("Error fetching offers:", error);
          }
        };

        const toggleExpand = (lotId: string) => {
          if (expandedLotId === lotId) {
            setExpandedLotId(null);
            setSelectedLotBids([]);
            setSelectedLotOffers([]);
          } else {
            setExpandedLotId(lotId);
            fetchLotBids(lotId, true);
            fetchLotOffers(lotId);
          }
        };

        const handlePrintPlaqueta = (lot: any) => {
          const printWindow = window.open('', '_blank');
          if (!printWindow) return;

          const html = `
            <html>
              <head>
                <title>Plaqueta do Lote ${lot.lot_number}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                  .plaque { border: 10px solid #c5a059; padding: 40px; border-radius: 20px; }
                  .lot-number { font-size: 120px; font-weight: bold; margin: 0; color: #064e3b; }
                  .animal-name { font-size: 48px; margin: 20px 0; text-transform: uppercase; }
                  .event-name { font-size: 24px; color: #666; }
                  .footer { margin-top: 50px; border-top: 2px solid #eee; padding-top: 20px; }
                </style>
              </head>
              <body>
                <div class="plaque">
                  <div class="event-name">${lot.event?.name}</div>
                  <div class="lot-number">LOTE ${String(lot.lot_number).padStart(2, '0')}</div>
                  <div class="animal-name">${lot.animal?.name}</div>
                  <div class="footer">AGRO NC BRASIL</div>
                </div>
                <script>window.print(); window.close();</script>
              </body>
            </html>
          `;
          printWindow.document.write(html);
          printWindow.document.close();
        };

        const handleTogglePause = async (lot: any) => {
          const newStatus = lot.status === 'paused' ? 'active' : 'paused';
          try {
            const { error } = await supabase
              .from("lots")
              .update({ status: newStatus })
              .eq("id", lot.id);
            
            if (error) throw error;
            toast.success(newStatus === 'paused' ? "Lote pausado com sucesso" : "Lote reativado com sucesso");
            fetchData();
          } catch (error: any) {
            toast.error("Erro ao alterar status: " + error.message);
          }
       };

        const handleDeleteBid = async (bid: any) => {
          if (!confirm(`Tem certeza que deseja EXCLUIR o lance de R$ ${bid.amount} de ${bid.profile?.full_name || 'Usuário'}?`)) return;
          
          try {
            const { data, error } = await supabase.rpc("delete_bid_safe", {
              p_bid_id: bid.id
            });

            if (error) throw error;
            
            const result = data as { success: boolean; message: string };
            if (result.success) {
              toast.success(result.message);
              fetchLotBids(bid.lot_id);
              fetchData(); // Refresh main list to update current price
            } else {
              toast.error(result.message);
            }
          } catch (error: any) {
            toast.error("Erro ao excluir lance: " + error.message);
          }
        };

       const handleSave = async () => {
        if (!formData.event_id || !formData.animal_id || !formData.lot_number) {
         toast.error("Preencha todos os campos obrigatórios");
         return;
       }
   
       try {
          if (editingLot) {
            const { error } = await supabase
              .from("lots")
              .update({
                event_id: formData.event_id,
                animal_id: formData.animal_id,
                lot_number: formData.lot_number,
                starting_price: formData.starting_price,
                bid_increment: formData.bid_increment,
                 status: formData.status,
                 allows_pre_bidding: formData.allows_pre_bidding,
                 is_featured: formData.is_featured,
                 payment_methods: formData.payment_methods ? formData.payment_methods.split(",").map(s => s.trim()).filter(Boolean) : [],
                 viewers: formData.viewers
               })
              .eq("id", editingLot.id);
            if (error) throw error;
            toast.success("Lote atualizado com sucesso");
          } else {
            const { error } = await supabase.from("lots").insert({
              event_id: formData.event_id,
              animal_id: formData.animal_id,
              lot_number: formData.lot_number,
              starting_price: formData.starting_price,
              current_price: formData.starting_price,
              bid_increment: formData.bid_increment,
               status: formData.status,
               allows_pre_bidding: formData.allows_pre_bidding,
               is_featured: formData.is_featured,
               payment_methods: formData.payment_methods ? formData.payment_methods.split(",").map(s => s.trim()).filter(Boolean) : [],
               viewers: formData.viewers,
               end_date: null // Lotes agora seguem a data de término do evento por padrão
             });
            if (error) throw error;
            toast.success("Lote alocado com sucesso");
          }
   
          setIsDialogOpen(false);
          resetForm();
          fetchData();
       } catch (error: any) {
          toast.error("Erro ao salvar lote: " + error.message);
       }
     };

     const handleEventSelectChange = (val: string) => {
       setSelectedEventId(val);
       if (onEventChange) onEventChange(val);
     };
 
    const filteredLots = lots.filter(lot => {
      const matchesSearch = lot.animal?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           lot.lot_number?.toString().includes(searchQuery);
      const matchesEvent = selectedEventId === "all" || lot.event_id === selectedEventId;
      const matchesStatus = statusFilter === "all" || lot.status === statusFilter;
      return matchesSearch && matchesEvent && matchesStatus;
    });
 
   const handleDelete = async (id: string) => {
     if (!confirm("Tem certeza que deseja remover este lote? O animal voltará a ficar disponível para outros eventos.")) return;
     
     try {
       const { error } = await supabase.from("lots").delete().eq("id", id);
       if (error) throw error;
       toast.success("Lote removido com sucesso");
       fetchData();
     } catch (error: any) {
       toast.error("Erro ao remover lote: " + error.message);
     }
   };
 
   return (
     <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
            </Button>
          </div>
          <div className="flex flex-1 gap-4 max-w-3xl flex-wrap">
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
              <Filter className="h-3 w-3 ml-2 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 w-[130px] text-xs">
                  <SelectValue placeholder="Status Lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">No Ar / Ativo</SelectItem>
                  <SelectItem value="sold">Arrematados</SelectItem>
                  <SelectItem value="passed">Não Vendidos (Passou)</SelectItem>
                  <SelectItem value="upcoming">Aceita pré-lance</SelectItem>
                </SelectContent>
              </Select>
            </div>
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input
               placeholder="Buscar por animal ou número..."
               className="pl-10"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
            <Select value={selectedEventId} onValueChange={handleEventSelectChange}>
             <SelectTrigger className="w-[200px]">
               <SelectValue placeholder="Filtrar por Evento" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todos os Eventos</SelectItem>
               {events.map(event => (
                 <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
           <Dialog open={isDialogOpen} onOpenChange={(open) => {
             setIsDialogOpen(open);
             if (!open) resetForm();
             if (open) fetchData(); // Refresca os dados ao abrir o diálogo
           }}>
           <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold/90 text-emerald-deep" onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
               <PlusCircle className="mr-2 h-4 w-4" /> Alocar Lote
             </Button>
           </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
             <DialogHeader>
                <DialogTitle>{editingLot ? "Editar Lote" : "Alocar Animal em Evento"}</DialogTitle>
               <DialogDescription>
                  Defina as regras do animal neste evento.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="event">Evento</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, event_id: v })} value={formData.event_id}>
                    <SelectTrigger>
                       <SelectValue placeholder={isLoading ? "Carregando eventos..." : "Selecione o evento"} />
                    </SelectTrigger>
                     <SelectContent>
                       {isLoading ? (
                         <div className="p-2 text-xs text-center text-muted-foreground flex items-center justify-center">
                           <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Carregando...
                         </div>
                       ) : events.length === 0 ? (
                         <div className="p-2 text-xs text-center text-muted-foreground">
                           Nenhum evento cadastrado. <br/> 
                           Crie um evento na aba "Eventos" primeiro.
                         </div>
                       ) : (
                         events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)
                       )}
                     </SelectContent>
                  </Select>
               </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animal">Animal</Label>
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-[10px] text-gold" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        // This is tricky as we need to switch tabs in the parent.
                        // For now, let's just use a hint.
                      }}
                    >
                      Cadastrar Novo Animal
                    </Button>
                  </div>
                   <Select 
                     onValueChange={async (v) => {
                       const animal = availableAnimals.find(a => a.id === v);
                       let increment = formData.bid_increment;
                       if (animal) {
                         const { data: animalData } = await supabase.from("animals").select("default_bid_increment").eq("id", v).single();
                         if (animalData?.default_bid_increment) {
                           increment = animalData.default_bid_increment;
                         }
                       }
                       setFormData({ ...formData, animal_id: v, bid_increment: increment });
                     }} 
                     value={formData.animal_id}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder={isLoading ? "Carregando animais..." : "Selecione o animal"} />
                     </SelectTrigger>
                     <SelectContent>
                       {isLoading ? (
                         <div className="p-2 text-xs text-center text-muted-foreground flex items-center justify-center">
                           <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Carregando...
                         </div>
                       ) : availableAnimals.length === 0 ? (
                         <div className="p-2 text-xs text-center text-muted-foreground">Nenhum animal disponível</div>
                       ) : (
                         (editingLot ? [editingLot.animal, ...availableAnimals] : availableAnimals).filter(Boolean).map((a: any) => (
                           <SelectItem key={a.id} value={a.id}>{a.name} ({a.internal_code || 'S/C'})</SelectItem>
                         ))
                       )}
                     </SelectContent>
                   </Select>
                </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="number">Nº Lote</Label>
                   <Input 
                     type="number" 
                      value={formData.lot_number} 
                      onChange={(e) => setFormData({ ...formData, lot_number: parseInt(e.target.value) })} 
                   />
                 </div>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="increment">Incremento (R$)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Valor mínimo adicionado ao preço atual a cada novo lance.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input 
                      type="number" 
                       value={formData.bid_increment} 
                       onChange={(e) => setFormData({ ...formData, bid_increment: parseFloat(e.target.value) })} 
                    />
                  </div>
               </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="price">Preço Inicial (R$)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Valor de abertura do leilão para este lote.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        value={formData.starting_price} 
                        onChange={(e) => setFormData({ ...formData, starting_price: parseFloat(e.target.value) })} 
                      />
                    </div>
                    <div className="w-[120px]">
                      <Label htmlFor="viewers" className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Views Base
                      </Label>
                      <Input 
                        id="viewers"
                        type="number" 
                        value={formData.viewers} 
                        onChange={(e) => setFormData({ ...formData, viewers: parseInt(e.target.value) })} 
                        className="h-10 mt-1"
                      />
                    </div>
                  </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                     <Label htmlFor="payments">Condições de Pagamento</Label>
                     <Input 
                       value={formData.payment_methods} 
                       onChange={(e) => setFormData({ ...formData, payment_methods: e.target.value })} 
                       placeholder="Ex: 30 parcelas (2+2+26)"
                     />
                   </div>
                   <div className="grid gap-2">
                     <Label htmlFor="viewers">Visualizações Iniciais</Label>
                     <Input 
                       type="number"
                       value={formData.viewers} 
                       onChange={(e) => setFormData({ ...formData, viewers: parseInt(e.target.value) || 0 })} 
                     />
                   </div>
                 </div>
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="pre_bidding_lot" 
                      checked={formData.allows_pre_bidding} 
                      onChange={(e) => setFormData({...formData, allows_pre_bidding: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <Label htmlFor="pre_bidding_lot" className="flex items-center gap-1 cursor-pointer">
                      Lances Antecipados
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Permite que licitantes deem lances antes do início oficial do evento.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="is_featured" 
                      checked={formData.is_featured} 
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <Label htmlFor="is_featured" className="flex items-center gap-1 cursor-pointer">
                      Lote em Destaque
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Dá prioridade visual ao lote na lista principal.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                  </div>
                </div>
             </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-gold text-emerald-deep" onClick={handleSave}>
                  {editingLot ? "Salvar Alterações" : "Confirmar Alocação"}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>Lotes por Evento</CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="flex justify-center py-8">
               <Loader2 className="h-8 w-8 animate-spin text-gold" />
             </div>
           ) : (
             <Table>
               <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[70px] font-bold">Nº</TableHead>
                    <TableHead className="font-bold">Animal</TableHead>
                    <TableHead className="font-bold">Evento</TableHead>
                    <TableHead className="font-bold">Destaque</TableHead>
                    <TableHead className="font-bold">Valores</TableHead>
                    <TableHead className="font-bold">Lances</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Ações de Gestão</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredLots.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                       Nenhum lote encontrado.
                     </TableCell>
                   </TableRow>
                 ) : (
                     filteredLots.map((lot) => {
                       const endsAt = lot.event?.end_date ? new Date(lot.event.end_date).getTime() : null;
                       const now = Date.now();
                       const isUrgent = endsAt && (endsAt - now > 0) && (endsAt - now < 600000);
                       const hasNoBids = (lot.bids_count || 0) === 0;
                       const currentPrice = lot.current_price || lot.starting_price || 0;
                       const isPriceLow = currentPrice <= lot.starting_price;

                        return (
                          <>
                          <TableRow 
                            className={`${lot.status === 'active' ? 'bg-emerald-50/30' : lot.status === 'paused' ? 'bg-amber-50/30' : ''} ${isUrgent ? 'animate-neon border-live/30' : ''} cursor-pointer hover:bg-muted/50`}
                            onClick={() => toggleExpand(lot.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(lot.id)}>
                                {expandedLotId === lot.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            </TableCell>
                            <TableCell className="font-bold">
                             <div className="flex flex-col">
                               <span>{String(lot.lot_number).padStart(2, '0')}</span>
                               {lot.is_featured && <Zap className="h-3 w-3 text-gold fill-gold" />}
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="font-bold text-sm uppercase">{lot.animal?.name}</div>
                             <div className="text-[10px] text-muted-foreground font-mono">{lot.animal?.internal_code || 'S/C'}</div>
                           </TableCell>
                           <TableCell>
                             <div className="text-xs font-medium truncate max-w-[120px]">{lot.event?.name}</div>
                           </TableCell>
                           <TableCell>
                             {lot.is_featured ? (
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-gold/20 text-gold border border-gold/30 uppercase">
                                 Destaque
                               </span>
                             ) : (
                               <span className="text-muted-foreground text-[10px] uppercase font-bold opacity-30">Normal</span>
                             )}
                           </TableCell>
                           <TableCell>
                             <div className="flex flex-col">
                               <span className="text-[10px] text-muted-foreground uppercase font-bold">Atual</span>
                               <span className="font-black text-sm text-emerald-deep">
                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPrice)}
                               </span>
                               <span className="text-[9px] text-muted-foreground italic">Início: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lot.starting_price)}</span>
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="flex flex-col items-center">
                               <span className={`text-sm font-black ${hasNoBids ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                                 {lot.bids_count || 0}
                               </span>
                               {hasNoBids && <AlertTriangle className="h-3 w-3 text-destructive" />}
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="flex flex-col gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-center ${
                                   lot.status === 'active' ? 'text-emerald-bright bg-emerald-bright/10 border border-emerald-bright/20' : 
                                   lot.status === 'paused' ? 'text-amber-600 bg-amber-50 border border-amber-200' :
                                  lot.status === 'sold' ? 'text-gold bg-gold/10 border border-gold/20' :
                                  lot.status === 'passed' ? 'text-destructive bg-destructive/10 border border-destructive/20' :
                                  'text-muted-foreground bg-muted border border-border'
                                }`}>
                                   {lot.status === 'active' ? 'No Ar' : 
                                    lot.status === 'paused' ? 'Pausado' :
                                   lot.status === 'sold' ? 'Arrematado' :
                                   lot.status === 'passed' ? 'Passou' : 
                                   lot.status === 'upcoming' ? 'Aceita pré-lance' : 'Finalizado'}
                                </span>
                                 {lot.status === 'sold' && (
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="h-8 gap-1 border-emerald-500/50 hover:bg-emerald-50 text-emerald-600 text-[10px] font-bold"
                                     onClick={async () => {
                                       if (!confirm("Atenção: Para que este animal volte ao catálogo de vendas, é necessário reverter o lote arrematado. Deseja reverter este lote agora?")) return;
                                       setIsLoading(true);
                                       try {
                                         const { error } = await supabase.rpc("revert_sold_lot", {
                                           p_lot_id: lot.id
                                         });
                                         if (error) throw error;
                                         toast.success("Lote revertido com sucesso! O animal voltou ao catálogo.");
                                         fetchData();
                                       } catch (error: any) {
                                         toast.error("Erro ao reverter lote: " + error.message);
                                       } finally {
                                         setIsLoading(false);
                                       }
                                     }}
                                   >
                                     <History className="h-3 w-3" /> Reverter Lote
                                   </Button>
                                 )}
                                 {lot.status === 'passed' && (
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="h-8 gap-1 border-emerald-500/50 hover:bg-emerald-50 text-emerald-600 text-[10px] font-bold"
                                     onClick={async () => {
                                       if (!confirm("Deseja REATIVAR este lote que não foi vendido?")) return;
                                       setIsLoading(true);
                                       try {
                                         const { error } = await supabase
                                           .from("lots")
                                           .update({ status: 'active' })
                                           .eq("id", lot.id);
                                         if (error) throw error;
                                         toast.success("Lote reativado com sucesso!");
                                         fetchData();
                                       } catch (error: any) {
                                         toast.error("Erro ao reativar lote: " + error.message);
                                       } finally {
                                         setIsLoading(false);
                                       }
                                     }}
                                   >
                                     <History className="h-3 w-3" /> Reativar
                                   </Button>
                                 )}
                               {isUrgent && (
                                 <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-center bg-live/10 text-live border border-live/20 animate-blink-fast">
                                   Encerrando!
                                 </span>
                               )}
                             </div>
                           </TableCell>
                           <TableCell className="text-right">
                               <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                {(lot.status === 'active' || lot.status === 'paused') && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={`h-8 gap-1 ${lot.status === 'active' ? 'border-amber-500/50 text-amber-600' : 'border-emerald-500/50 text-emerald-600'} text-[10px] font-bold`}
                                    onClick={() => handleTogglePause(lot)}
                                  >
                                    {lot.status === 'active' ? <PauseCircle className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                    {lot.status === 'active' ? 'Pausar' : 'Ativar'}
                                  </Button>
                                )}
                                {lot.status === 'active' && (
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                     <Button 
                                       variant="outline" 
                                       size="sm" 
                                       className="h-8 gap-1 border-gold/50 hover:bg-gold/10 text-gold text-[10px] font-bold"
                                     >
                                       <ShieldCheck className="h-3 w-3" /> Segurança
                                     </Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                     <AlertDialogHeader>
                                       <AlertDialogTitle>Confirmar Lance de Segurança</AlertDialogTitle>
                                       <AlertDialogDescription className="space-y-3">
                                         <p>
                                           Deseja realmente efetuar um lance de segurança no valor de <strong className="text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPrice + (lot.bid_increment || 1000))}</strong> para este lote?
                                         </p>
                                         <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-2">
                                           <p className="font-bold flex items-center gap-1">
                                             <Info className="h-3 w-3" /> O que é um Lance de Segurança?
                                           </p>
                                           <p>
                                             Este é um recurso administrativo para:
                                           </p>
                                           <ul className="list-disc pl-4 space-y-1">
                                             <li>Registrar lances feitos via telefone ou presencial.</li>
                                             <li>Garantir o movimento do leilão em lotes sem ofertas.</li>
                                             <li>Corrigir sequências de lances manualmente.</li>
                                           </ul>
                                           <p className="italic">
                                             * O lance será registrado em nome do sistema e atualizará o preço atual do lote.
                                           </p>
                                         </div>
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                       <AlertDialogAction 
                                         className="bg-gold text-emerald-deep hover:bg-gold/90"
                                         onClick={async () => {
                                           const bidAmount = currentPrice + (lot.bid_increment || 1000);
                                           setIsLoading(true);
                                           try {
                                             const { data, error } = await supabase.rpc('place_bid_safe', {
                                               p_lot_id: lot.id,
                                               p_amount: bidAmount,
                                               p_bid_type: 'online',
                                               p_session_id: 'admin-safety-bid'
                                             });

                                             if (error) throw error;
                                             const result = data as { success: boolean, message: string };
                                             if (result.success) {
                                               toast.success(`Lance de Segurança efetuado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bidAmount)}`);
                                               fetchData();
                                             } else {
                                               toast.error("Não foi possível realizar o lance", {
                                                 description: result.message,
                                                 duration: 5000
                                               });
                                             }
                                           } catch (error: any) {
                                             toast.error("Erro no lance: " + error.message);
                                           } finally {
                                             setIsLoading(false);
                                           }
                                         }}
                                       >
                                         Confirmar
                                       </AlertDialogAction>
                                     </AlertDialogFooter>
                                   </AlertDialogContent>
                                 </AlertDialog>
                               )}
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-gold" onClick={() => fetchLotBids(lot.id)}>
                                       <History className="h-3.5 w-3.5" />
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>Histórico de Lances / Reverter</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(lot)}>
                                       <Pencil className="h-3.5 w-3.5" />
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>Editar Lote</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(lot.id)}>
                                       <Trash2 className="h-3.5 w-3.5" />
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>Excluir Lote</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             </div>
                           </TableCell>
                          </TableRow>
                          {expandedLotId === lot.id && (
                            <TableRow className="bg-muted/30 border-t-0">
                              <TableCell colSpan={9} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-bold flex items-center gap-2">
                                        <History className="h-4 w-4 text-emerald-600" />
                                        Lances em Tempo Real
                                      </h4>
                              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => fetchLotBids(lot.id)}>
                                        Atualizar
                                      </Button>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto border rounded-md bg-white">
                                      <Table>
                                        <TableHeader className="bg-muted/50 sticky top-0">
                                          <TableRow>
                                            <TableHead className="h-8 text-[10px]">Licitante</TableHead>
                                            <TableHead className="h-8 text-[10px]">Valor</TableHead>
                                            <TableHead className="h-8 text-[10px]">Hora</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {selectedLotBids.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-[10px] py-4">Sem lances</TableCell></TableRow>
                                          ) : (
                                            selectedLotBids.map(bid => (
                                              <TableRow key={bid.id}>
                                                <TableCell className="py-1 text-[10px]">{bid.profile?.full_name || 'Auditório'}</TableCell>
                                                <TableCell className="py-1 text-[10px] font-bold text-emerald-600">
                                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bid.amount)}
                                                </TableCell>
                                                <TableCell className="py-1 text-[10px] text-muted-foreground">
                                                  {new Date(bid.created_at).toLocaleTimeString('pt-BR')}
                                                </TableCell>
                                              </TableRow>
                                            ))
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-bold flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-gold" />
                                        Ofertas Informais
                                      </h4>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto border rounded-md bg-white">
                                      <Table>
                                        <TableHeader className="bg-muted/50 sticky top-0">
                                          <TableRow>
                                            <TableHead className="h-8 text-[10px]">Usuário</TableHead>
                                            <TableHead className="h-8 text-[10px]">Oferta</TableHead>
                                            <TableHead className="h-8 text-[10px]">Ações</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {selectedLotOffers.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-[10px] py-4">Sem ofertas</TableCell></TableRow>
                                          ) : (
                                            selectedLotOffers.map(offer => (
                                              <TableRow key={offer.id}>
                                                <TableCell className="py-1 text-[10px]">{offer.profile?.full_name}</TableCell>
                                                <TableCell className="py-1 text-[10px]">
                                                  <div className="font-bold text-emerald-600">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(offer.amount)}
                                                  </div>
                                                  <div className="text-[9px] text-muted-foreground line-clamp-1">{offer.description}</div>
                                                </TableCell>
                                                <TableCell className="py-1 text-[10px]">
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 text-emerald-600">
                                                    <ShieldCheck className="h-3 w-3" />
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            ))
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        className="flex-1 gap-2 border-emerald-600/50 text-emerald-700 hover:bg-emerald-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePrintPlaqueta(lot);
                                        }}
                                      >
                                        <Printer className="h-4 w-4" /> Imprimir Plaqueta
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(lot.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" /> Retirar do Evento
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          </>
                        );
                      })
                    )}
                </TableBody>
              </Table>
           )}
         </CardContent>
       </Card>

       <Dialog open={isBidsDialogOpen} onOpenChange={setIsBidsDialogOpen}>
         <DialogContent className="sm:max-w-[600px]">
           <DialogHeader>
             <DialogTitle>Histórico de Lances</DialogTitle>
             <DialogDescription>
               Visualize e gerencie os lances efetuados para este lote.
             </DialogDescription>
           </DialogHeader>
           <div className="py-4">
             {isBidsLoading ? (
               <div className="flex justify-center py-8">
                 <Loader2 className="h-8 w-8 animate-spin text-gold" />
               </div>
             ) : (
               <div className="max-h-[400px] overflow-y-auto rounded-md border">
                 <Table>
                   <TableHeader className="bg-muted/50 sticky top-0 z-10">
                     <TableRow>
                       <TableHead>Licitante</TableHead>
                       <TableHead>Valor</TableHead>
                       <TableHead>Data/Hora</TableHead>
                       <TableHead className="text-right">Ações</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {selectedLotBids.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                           Nenhum lance efetuado ainda.
                         </TableCell>
                       </TableRow>
                     ) : (
                       selectedLotBids.map((bid) => (
                         <TableRow key={bid.id}>
                           <TableCell className="font-medium">{bid.profile?.full_name || "Usuário"}</TableCell>
                           <TableCell className="font-bold text-emerald-600">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bid.amount)}
                           </TableCell>
                           <TableCell className="text-xs text-muted-foreground">
                             {new Date(bid.created_at).toLocaleString('pt-BR')}
                           </TableCell>
                           <TableCell className="text-right">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                               onClick={() => handleDeleteBid(bid)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </div>
             )}
           </div>
           <DialogFooter>
             <Button onClick={() => setIsBidsDialogOpen(false)}>Fechar</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 }