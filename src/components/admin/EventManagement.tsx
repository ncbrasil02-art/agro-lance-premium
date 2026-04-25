 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react";
 import { toast } from "sonner";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
 export function EventManagement() {
   const [events, setEvents] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");
 
   const fetchEvents = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("events")
         .select("*")
         .order("start_date", { ascending: false });
 
       if (error) throw error;
       setEvents(data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar eventos: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     fetchEvents();
   }, []);
 
   const filteredEvents = events.filter(event => 
     event.name?.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   const handleDelete = async (id: string) => {
     if (!confirm("Tem certeza que deseja excluir este evento? Todos os lotes associados também serão afetados.")) return;
     
     try {
       const { error } = await supabase.from("events").delete().eq("id", id);
       if (error) throw error;
       toast.success("Evento excluído com sucesso");
       fetchEvents();
     } catch (error: any) {
       toast.error("Erro ao excluir evento: " + error.message);
     }
   };
 
   const getStatusColor = (status: string) => {
     switch (status) {
       case 'active': return 'text-emerald-500 bg-emerald-500/10';
       case 'scheduled': return 'text-blue-500 bg-blue-500/10';
       case 'finished': return 'text-muted-foreground bg-muted';
       default: return 'text-muted-foreground bg-muted';
     }
   };
 
   const getStatusLabel = (status: string) => {
     switch (status) {
       case 'active': return 'Ao Vivo';
       case 'scheduled': return 'Agendado';
       case 'finished': return 'Finalizado';
       default: return status;
     }
   };
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar eventos..."
             className="pl-10"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
         </div>
         <Button className="bg-gold hover:bg-gold/90 text-emerald-deep">
           <Plus className="mr-2 h-4 w-4" /> Novo Evento
         </Button>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>Eventos de Leilão</CardTitle>
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
                   <TableHead>Evento</TableHead>
                   <TableHead>Data de Início</TableHead>
                   <TableHead>Local/Promotor</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="text-right">Ações</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredEvents.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                       Nenhum evento encontrado.
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredEvents.map((event) => (
                     <TableRow key={event.id}>
                       <TableCell className="font-medium">
                         <div>{event.name}</div>
                         <div className="text-xs text-muted-foreground">{event.event_type === 'online' ? 'Online' : 'Presencial'}</div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-1">
                           <CalendarIcon className="h-3 w-3" />
                           {format(new Date(event.start_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div>{event.location}</div>
                         <div className="text-xs text-muted-foreground">{event.promoter_company}</div>
                       </TableCell>
                       <TableCell>
                         <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(event.status)}`}>
                           {getStatusLabel(event.status)}
                         </span>
                       </TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon">
                             <Pencil className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(event.id)}>
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