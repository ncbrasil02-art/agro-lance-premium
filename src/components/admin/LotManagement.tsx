 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
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
         <Button className="bg-gold hover:bg-gold/90 text-emerald-deep">
           <LinkIcon className="mr-2 h-4 w-4" /> Alocar Lote
         </Button>
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