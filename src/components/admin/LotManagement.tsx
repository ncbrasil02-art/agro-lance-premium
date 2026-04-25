import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Loader2, Link as LinkIcon, PlusCircle, Eye, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
  import { toast } from "sonner";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 
  export function LotManagement({ 
    initialEventId = "all", 
    onEventChange,
    onNavigateToAnimals,
    onNavigateToEvents,
    searchQuery,
    onSearchChange,
    currentPage,
    onPageChange,
    sortColumn,
    sortDirection,
    onSortChange
  }: { 
    initialEventId?: string; 
    onEventChange?: (id: string) => void;
    onNavigateToAnimals?: () => void;
    onNavigateToEvents?: () => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    currentPage: number;
    onPageChange: (val: number) => void;
    sortColumn: string;
    sortDirection: "asc" | "desc";
    onSortChange: (col: string, dir: "asc" | "desc") => void;
  }) {
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const [isLoading, setIsLoading] = useState(true);
  const [lots, setLots] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [availableAnimals, setAvailableAnimals] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [editingLot, setEditingLot] = useState<any>(null);
  const ITEMS_PER_PAGE = 8;
      
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
    try {
      const [eventsRes, animalsRes] = await Promise.all([
        supabase.from("events").select("id, name").order("name"),
        supabase.from("animals").select("id, name, internal_code, photos").order("name"),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (animalsRes.error) throw animalsRes.error;

      setEvents(eventsRes.data || []);
      setAvailableAnimals(animalsRes.data || []);

      let query = supabase
        .from("lots")
        .select("*, event:events!event_id(name), animal:animals(name, internal_code, photos)", { count: "exact" });

      if (selectedEventId !== "all") {
        query = query.eq("event_id", selectedEventId);
      }

      if (searchQuery) {
        query = query.ilike("animal.name", `%${searchQuery}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order(sortColumn, { ascending: sortDirection === "asc" })
        .range(from, to);

      if (error) throw error;
      setLots(data || []);
      setTotalCount(count || 0);

      if (initialEventId !== "all") {
        setFormData(prev => ({ ...prev, event_id: initialEventId }));
      }
    } catch (error: any) {
      toast.error("Erro ao carregar lotes: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedEventId(initialEventId);
  }, [initialEventId]);

  useEffect(() => {
    fetchData();
    setSelectedIds([]);
  }, [currentPage, searchQuery, selectedEventId, sortColumn, sortDirection]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      onSortChange(column, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(column, "asc");
    }
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp className="ml-2 h-3 w-3" /> : <ChevronDown className="ml-2 h-3 w-3" />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(lots.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Deseja remover permanentemente os ${selectedIds.length} lotes selecionados? Os animais ficarão disponíveis novamente.`)) return;
    
    try {
      const { error } = await supabase.from("lots").delete().in("id", selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} lotes removidos com sucesso`);
      setSelectedIds([]);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao remover em lote: " + error.message);
    }
  };


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
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative">
           {selectedIds.length > 0 && (
             <div className="absolute inset-0 bg-emerald-deep/95 z-20 rounded-lg flex items-center px-4 animate-in fade-in slide-in-from-top-2 border border-gold/30">
               <div className="flex items-center gap-3">
                 <span className="text-xs font-black text-white uppercase tracking-widest">{selectedIds.length} selecionados</span>
                 <div className="h-4 w-px bg-white/20" />
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-8 text-destructive hover:bg-destructive/10 text-[10px] font-bold"
                   onClick={handleBulkDelete}
                 >
                   <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir em Lote
                 </Button>
               </div>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="ml-auto text-white/60 hover:text-white text-[10px] font-bold"
                 onClick={() => setSelectedIds([])}
               >
                 Cancelar
               </Button>
             </div>
           )}
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
                onChange={(e) => onSearchChange(e.target.value)}
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
              <div className="grid gap-6 py-4">
                {/* Fixed Image Preview of Animal */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-white/5 bg-black/40 group">
                  <img 
                    src={(editingLot?.animal?.id === formData.animal_id ? editingLot.animal : availableAnimals.find(a => a.id === formData.animal_id))?.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} 
                    alt="Animal Preview" 
                    className={`h-full w-full object-cover transition-all duration-700 ${!formData.animal_id ? 'opacity-20 grayscale' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-1">Visualização do Lote</p>
                      <p className="text-sm font-bold text-white uppercase italic">
                        {(editingLot?.animal?.id === formData.animal_id ? editingLot.animal : availableAnimals.find(a => a.id === formData.animal_id))?.name || "Selecione um animal"}
                      </p>
                    </div>
                  </div>
                </div>

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
                            {onNavigateToEvents ? (
                              <Button variant="link" className="text-[10px] p-0 h-auto text-gold" onClick={() => { setIsDialogOpen(false); onNavigateToEvents(); }}>
                                Crie um evento na aba "Eventos" primeiro.
                              </Button>
                            ) : (
                              "Crie um evento na aba \"Eventos\" primeiro."
                            )}
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
                     {onNavigateToAnimals && (
                       <Button 
                         variant="link" 
                         className="h-auto p-0 text-[10px] text-gold" 
                         onClick={() => {
                           setIsDialogOpen(false);
                           onNavigateToAnimals();
                         }}
                       >
                         Cadastrar Novo Animal
                       </Button>
                     )}
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
              <>
                <Table>
                  <TableHeader className="bg-muted/50 select-none">
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={lots.length > 0 && selectedIds.length === lots.length}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                      </TableHead>
                      <TableHead className="w-[80px] cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('lot_number')}>
                        <div className="flex items-center">Nº Lote <SortIndicator column="lot_number" /></div>
                      </TableHead>
                      <TableHead>Animal</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('is_featured')}>
                        <div className="flex items-center">Destaque <SortIndicator column="is_featured" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('starting_price')}>
                        <div className="flex items-center">Preço <SortIndicator column="starting_price" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('bids_count')}>
                        <div className="flex items-center">Lances <SortIndicator column="bids_count" /></div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum lote encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lots.map((lot: any) => (
                        <TableRow key={lot.id} className={selectedIds.includes(lot.id) ? "bg-gold/5" : ""}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedIds.includes(lot.id)}
                              onCheckedChange={(checked) => handleSelectOne(lot.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell className="font-bold">{lot.lot_number}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lot.animal?.photos?.[0] && (
                                <img src={lot.animal.photos[0]} alt="" className="h-6 w-6 rounded-md object-cover border border-white/10" />
                              )}
                              <div>
                                <div className="font-medium line-clamp-1">{lot.animal?.name}</div>
                                <div className="text-[10px] text-muted-foreground">{lot.animal?.internal_code}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate text-xs">{lot.event?.name}</TableCell>
                          <TableCell>
                            {lot.is_featured ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gold/10 text-gold border border-gold/20 uppercase">Sim</span>
                            ) : (
                              <span className="text-muted-foreground text-[10px] uppercase">Não</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lot.starting_price)}
                          </TableCell>
                          <TableCell className="text-center">{lot.bids_count || 0}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              lot.status === 'active' ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground bg-muted'
                            }`}>
                              {lot.status === 'active' ? 'Ativo' : 'Pausado'}
                            </span>
                          </TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-1 md:gap-2">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             asChild
                             title="Visualizar Lote"
                           >
                             <Link 
                               to="/lotes/$lotId" 
                               params={{ lotId: lot.id }} 
                               target="_blank"
                             >
                               <Eye className="h-4 w-4 text-gold" />
                             </Link>
                           </Button>
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

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t gap-4">
                  <div className="text-xs text-muted-foreground order-2 sm:order-1">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} até {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount} registros
                  </div>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-xs font-medium">Página {currentPage} de {totalPages}</div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
       </Card>
     </div>
   );
 }