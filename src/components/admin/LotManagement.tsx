 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, Link as LinkIcon, PlusCircle } from "lucide-react";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
   const [isAllocating, setIsAllocating] = useState(false);
   const [newLot, setNewLot] = useState({
     event_id: "",
     animal_id: "",
     lot_number: 1,
     starting_price: 0,
     bid_increment: 1000,
     status: "active"
   });
   const [availableAnimals, setAvailableAnimals] = useState<any[]>([]);
 
   const fetchAvailableAnimals = async () => {
     const { data, error } = await supabase
       .from("animals")
       .select("id, name, internal_code");
     
     if (!error) setAvailableAnimals(data || []);
   };
 
   const handleAllocate = async () => {
     if (!newLot.event_id || !newLot.animal_id || !newLot.lot_number) {
       toast.error("Preencha todos os campos obrigatórios");
       return;
     }
 
     try {
       const { error } = await supabase.from("lots").insert({
         event_id: newLot.event_id,
         animal_id: newLot.animal_id,
         lot_number: newLot.lot_number,
         starting_price: newLot.starting_price,
         current_price: newLot.starting_price,
         bid_increment: newLot.bid_increment,
         status: newLot.status,
         end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 1 week
       });
 
       if (error) throw error;
       toast.success("Lote alocado com sucesso");
       setIsAllocating(false);
       fetchData();
     } catch (error: any) {
       toast.error("Erro ao alocar lote: " + error.message);
     }
   };
 
 import { toast } from "sonner";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 
 export function LotManagement() {
   const [lots, setLots] = useState<any[]>([]);
   const [events, setEvents] = useState<any[]>([]);
   const [selectedEventId, setSelectedEventId] = useState<string>("all");
   const [isLoading, setIsLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");
 
   const fetchData = async () => {
     setIsLoading(true);
     try {
       const [lotsRes, eventsRes] = await Promise.all([
         supabase
           .from("lots")
           .select("*, event:events(name), animal:animals(name, internal_code)")
           .order("lot_number", { ascending: true }),
         supabase
           .from("events")
           .select("id, name")
           .order("name")
       ]);
 
       if (lotsRes.error) throw lotsRes.error;
       if (eventsRes.error) throw eventsRes.error;
 
       setLots(lotsRes.data || []);
       setEvents(eventsRes.data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar dados: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     fetchData();
   }, []);
 
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
           <Select value={selectedEventId} onValueChange={setSelectedEventId}>
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
         <Dialog open={isAllocating} onOpenChange={(open) => {
           setIsAllocating(open);
           if (open) fetchAvailableAnimals();
         }}>
           <DialogTrigger asChild>
             <Button className="bg-gold hover:bg-gold/90 text-emerald-deep">
               <PlusCircle className="mr-2 h-4 w-4" /> Alocar Lote
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>Alocar Animal em Evento</DialogTitle>
               <DialogDescription>
                 Selecione um animal e um evento para criar um novo lote.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="event">Evento</Label>
                 <Select onValueChange={(v) => setNewLot({ ...newLot, event_id: v })}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o evento" />
                   </SelectTrigger>
                   <SelectContent>
                     {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="animal">Animal</Label>
                 <Select onValueChange={(v) => setNewLot({ ...newLot, animal_id: v })}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione o animal" />
                   </SelectTrigger>
                   <SelectContent>
                     {availableAnimals.map(a => (
                       <SelectItem key={a.id} value={a.id}>{a.name} ({a.internal_code})</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="number">Nº Lote</Label>
                   <Input 
                     type="number" 
                     value={newLot.lot_number} 
                     onChange={(e) => setNewLot({ ...newLot, lot_number: parseInt(e.target.value) })} 
                   />
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="increment">Incremento (R$)</Label>
                   <Input 
                     type="number" 
                     value={newLot.bid_increment} 
                     onChange={(e) => setNewLot({ ...newLot, bid_increment: parseFloat(e.target.value) })} 
                   />
                 </div>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="price">Preço Inicial (R$)</Label>
                 <Input 
                   type="number" 
                   value={newLot.starting_price} 
                   onChange={(e) => setNewLot({ ...newLot, starting_price: parseFloat(e.target.value) })} 
                 />
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsAllocating(false)}>Cancelar</Button>
               <Button className="bg-gold text-emerald-deep" onClick={handleAllocate}>
                 Confirmar Alocação
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
                           <Button variant="ghost" size="icon">
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