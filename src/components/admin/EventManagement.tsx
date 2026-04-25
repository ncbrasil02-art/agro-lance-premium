 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, Calendar as CalendarIcon, PlusCircle } from "lucide-react";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
   export function EventManagement() {
     const [isCreating, setIsCreating] = useState(false);
     const [newEvent, setNewEvent] = useState({
       name: "",
       description: "",
       start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
       location: "",
       status: "scheduled",
       event_type: "online"
     });
 
     const handleCreate = async () => {
       if (!newEvent.name || !newEvent.start_date) {
         toast.error("Preencha o nome e a data");
         return;
       }
 
       try {
         const { error } = await supabase.from("events").insert({
           name: newEvent.name,
           description: newEvent.description,
           start_date: new Date(newEvent.start_date).toISOString(),
           location: newEvent.location,
           status: newEvent.status,
           event_type: newEvent.event_type,
           slug: newEvent.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")
         });
 
         if (error) throw error;
         toast.success("Evento criado com sucesso");
         setIsCreating(false);
         fetchEvents();
       } catch (error: any) {
         toast.error("Erro ao criar evento: " + error.message);
       }
     };
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
         <Dialog open={isCreating} onOpenChange={setIsCreating}>
           <DialogTrigger asChild>
             <Button className="bg-gold hover:bg-gold/90 text-emerald-deep">
               <PlusCircle className="mr-2 h-4 w-4" /> Novo Evento
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>Criar Novo Evento</DialogTitle>
               <DialogDescription>
                 Defina as configurações básicas do leilão.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="name">Nome do Evento</Label>
                 <Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="date">Data e Hora de Início</Label>
                 <Input 
                   type="datetime-local" 
                   value={newEvent.start_date} 
                   onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })} 
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="type">Tipo</Label>
                   <Select onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })} defaultValue={newEvent.event_type}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="online">Online</SelectItem>
                       <SelectItem value="presencial">Presencial</SelectItem>
                       <SelectItem value="hibrido">Híbrido</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="status">Status Inicial</Label>
                   <Select onValueChange={(v) => setNewEvent({ ...newEvent, status: v })} defaultValue={newEvent.status}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="scheduled">Agendado</SelectItem>
                       <SelectItem value="active">Ao Vivo (Ativo)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="location">Localização</Label>
                 <Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Ex: São Paulo - SP" />
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
               <Button className="bg-gold text-emerald-deep" onClick={handleCreate}>
                 Criar Evento
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
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