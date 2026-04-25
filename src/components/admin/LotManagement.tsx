 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, Link as LinkIcon, PlusCircle } from "lucide-react";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
      const [searchQuery, setSearchQuery] = useState("");
      const [editingLot, setEditingLot] = useState<any>(null);
      
      const [formData, setFormData] = useState({
        event_id: "",
        animal_id: "",
        lot_number: 1,
        starting_price: 0,
        bid_increment: 1000,
        status: "active",
        allows_pre_bidding: true,
        is_featured: false,
        payment_methods: ""
      });

      const fetchData = async () => {
        setIsLoading(true);
        console.log("Fetching lots, events and animals...");
        try {
          const [lotsRes, eventsRes, animalsRes] = await Promise.all([
            supabase
              .from("lots")
              .select("*, event:events!event_id(name), animal:animals(name, internal_code)")
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
          payment_methods: ""
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
          payment_methods: lot.payment_methods?.join(", ") || ""
        });
        setIsDialogOpen(true);
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
                payment_methods: formData.payment_methods ? formData.payment_methods.split(",").map(s => s.trim()).filter(Boolean) : []
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
     return matchesSearch && matchesEvent;
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
         <div className="flex flex-1 gap-4 max-w-2xl">
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
            <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
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
                   <Select onValueChange={(v) => setFormData({ ...formData, animal_id: v })} value={formData.animal_id}>
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
                   <Label htmlFor="increment">Incremento (R$)</Label>
                   <Input 
                     type="number" 
                      value={formData.bid_increment} 
                      onChange={(e) => setFormData({ ...formData, bid_increment: parseFloat(e.target.value) })} 
                   />
                 </div>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="price">Preço Inicial (R$)</Label>
                 <Input 
                   type="number" 
                    value={formData.starting_price} 
                    onChange={(e) => setFormData({ ...formData, starting_price: parseFloat(e.target.value) })} 
                 />
               </div>
                <div className="grid gap-2">
                  <Label htmlFor="payments">Condições de Pagamento / Parcelamento</Label>
                  <Input 
                    value={formData.payment_methods} 
                    onChange={(e) => setFormData({ ...formData, payment_methods: e.target.value })} 
                    placeholder="Ex: 30 parcelas (2+2+26), À vista com 10% desc"
                  />
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
                    <Label htmlFor="pre_bidding_lot">Lances Antecipados</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="is_featured" 
                      checked={formData.is_featured} 
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <Label htmlFor="is_featured">Lote em Destaque</Label>
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
                 <TableRow>
                   <TableHead className="w-[80px]">Nº Lote</TableHead>
                   <TableHead>Animal</TableHead>
                   <TableHead>Evento</TableHead>
                    <TableHead>Destaque</TableHead>
                    <TableHead>Preço Inicial</TableHead>
                   <TableHead>Lances</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="text-right">Ações</TableHead>
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
                    filteredLots.map((lot) => (
                      <TableRow key={lot.id}>
                        <TableCell className="font-bold">{lot.lot_number}</TableCell>
                        <TableCell>
                          {lot.is_featured ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                              Sim
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[10px] uppercase">Não</span>
                          )}
                        </TableCell>
                       <TableCell>
                         <div className="font-medium">{lot.animal?.name}</div>
                         <div className="text-xs text-muted-foreground">{lot.animal?.internal_code}</div>
                       </TableCell>
                       <TableCell>{lot.event?.name}</TableCell>
                       <TableCell>
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lot.starting_price)}
                       </TableCell>
                       <TableCell>{lot.bids_count || 0}</TableCell>
                       <TableCell>
                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                           lot.status === 'active' ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground bg-muted'
                         }`}>
                           {lot.status === 'active' ? 'Ativo' : 'Pausado'}
                         </span>
                       </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(lot)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(lot.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }