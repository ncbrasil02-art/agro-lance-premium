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
 import { toast } from "sonner";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
  export function EventManagement({ onManageLots }: { onManageLots?: (id: string) => void }) {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
     const [formData, setFormData] = useState({
       name: "",
       description: "",
       start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
       location: "",
        status: "scheduled",
       event_type: "online",
       allows_pre_bidding: true,
       show_countdown: true,
       transmission_link: "",
       banner_url: "",
       promoter_company: "",
       auctioneer_name: ""
     });

     const resetForm = () => {
       setEditingEvent(null);
       setFormData({
         name: "",
         description: "",
       start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
         location: "",
         status: "scheduled",
         event_type: "online",
         allows_pre_bidding: true,
         show_countdown: true,
         transmission_link: "",
         banner_url: "",
         promoter_company: "",
         auctioneer_name: ""
       });
     };

     const handleEdit = (event: any) => {
       setEditingEvent(event);
       setFormData({
         name: event.name || "",
         description: event.description || "",
         start_date: event.start_date ? format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm:ss") : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
         location: event.location || "",
         status: event.status || "scheduled",
         event_type: event.event_type || "online",
         allows_pre_bidding: event.allows_pre_bidding !== false,
         show_countdown: event.show_countdown !== false,
         transmission_link: event.transmission_link || "",
         banner_url: event.banner_url || "",
         promoter_company: event.promoter_company || "",
         auctioneer_name: event.auctioneer_name || ""
       });
       setIsDialogOpen(true);
     };
 
    const fetchEvents = async () => {
      setIsLoading(true);
      console.log("Fetching events...");
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("start_date", { ascending: false });

        if (error) {
          console.error("Error fetching events:", error);
          throw error;
        }
        console.log("Events loaded:", data?.length || 0);
        setEvents(data || []);
      } catch (error: any) {
        console.error("Catch error fetching events:", error);
        toast.error("Erro ao carregar eventos: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
 
   useEffect(() => {
     fetchEvents();
   }, []);
 
    const handleSave = async () => {
      if (!formData.name || !formData.start_date) {
       toast.error("Preencha o nome e a data");
       return;
     }
 
      console.log("Saving event...", formData);
      try {
         if (editingEvent) {
           const { error } = await supabase
             .from("events")
             .update({
               name: formData.name,
               description: formData.description,
               start_date: new Date(formData.start_date).toISOString(),
               location: formData.location,
               status: formData.status,
               event_type: formData.event_type,
               allows_pre_bidding: formData.allows_pre_bidding,
               show_countdown: formData.show_countdown,
               transmission_link: formData.transmission_link,
               banner_url: formData.banner_url,
               promoter_company: formData.promoter_company,
               auctioneer_name: formData.auctioneer_name
             })
             .eq("id", editingEvent.id);
          if (error) throw error;
          toast.success("Evento atualizado com sucesso");
        } else {
          const baseSlug = formData.name.toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/ /g, "-").replace(/[^\w-]+/g, "");
          const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
          
          const { error } = await supabase.from("events").insert({
            name: formData.name,
            description: formData.description,
            start_date: new Date(formData.start_date).toISOString(),
            location: formData.location,
            status: formData.status,
            event_type: formData.event_type,
            allows_pre_bidding: formData.allows_pre_bidding,
            show_countdown: formData.show_countdown,
            transmission_link: formData.transmission_link,
            banner_url: formData.banner_url,
            promoter_company: formData.promoter_company,
            auctioneer_name: formData.auctioneer_name,
            slug: slug
          });
          if (error) throw error;
          toast.success("Evento criado com sucesso");
        }
 
        setIsDialogOpen(false);
        resetForm();
       fetchEvents();
     } catch (error: any) {
        toast.error("Erro ao salvar evento: " + error.message);
     }
   };
 
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
        case 'live': return 'text-emerald-500 bg-emerald-500/10';
        case 'scheduled': return 'text-blue-500 bg-blue-500/10';
        case 'finished': return 'text-muted-foreground bg-muted';
        default: return 'text-muted-foreground bg-muted';
      }
   };
 
   const getStatusLabel = (status: string) => {
      switch (status) {
        case 'live': return 'Ao Vivo';
        case 'scheduled': return 'Agendado';
        case 'finished': return 'Finalizado';
        default: return status;
      }
   };
   return (
     <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Lista"}
            </Button>
          </div>
         <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar eventos..."
             className="pl-10"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
         </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
           <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold/90 text-emerald-deep" onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
               <PlusCircle className="mr-2 h-4 w-4" /> Novo Evento
             </Button>
           </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
             <DialogHeader>
                <DialogTitle>{editingEvent ? "Editar Evento" : "Criar Novo Evento"}</DialogTitle>
               <DialogDescription>
                  Defina as configurações do leilão.
               </DialogDescription>
             </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Evento</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Grande Leilão Elite 2024" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner">URL da Imagem de Destaque (Banner)</Label>
                  <Input value={formData.banner_url} onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })} placeholder="https://imagem-do-evento.jpg" />
                  <p className="text-[10px] text-muted-foreground">Esta imagem aparece na página inicial e no topo do evento.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Data e Hora de Início (Clique para selecionar)</Label>
                  <Input 
                    type="datetime-local" 
                    step="1"
                    value={formData.start_date} 
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                  />
                  <p className="text-[10px] text-muted-foreground">O leilão iniciará automaticamente nesta data/hora. Certifique-se de definir também os segundos para maior precisão.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="promoter">Empresa Promotora</Label>
                    <Input value={formData.promoter_company} onChange={(e) => setFormData({ ...formData, promoter_company: e.target.value })} placeholder="Nome da Fazenda/Empresa" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="auctioneer">Leiloeiro</Label>
                    <Input value={formData.auctioneer_name} onChange={(e) => setFormData({ ...formData, auctioneer_name: e.target.value })} placeholder="Nome do Leiloeiro" />
                  </div>
                </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="type">Tipo</Label>
                    <Select onValueChange={(v) => setFormData({ ...formData, event_type: v })} value={formData.event_type}>
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
                    <Select onValueChange={(v) => setFormData({ ...formData, status: v })} value={formData.status}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="scheduled">Agendado</SelectItem>
                         <SelectItem value="live">Ao Vivo</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Ex: São Paulo - SP" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="transmission">Link da Transmissão (YouTube/Vimeo)</Label>
                  <Input value={formData.transmission_link} onChange={(e) => setFormData({ ...formData, transmission_link: e.target.value })} placeholder="https://..." />
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="pre_bidding" 
                      checked={formData.allows_pre_bidding} 
                      onChange={(e) => setFormData({...formData, allows_pre_bidding: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <Label htmlFor="pre_bidding">Lances Antecipados</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="countdown" 
                      checked={formData.show_countdown} 
                      onChange={(e) => setFormData({...formData, show_countdown: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                    />
                    <Label htmlFor="countdown">Mostrar Contagem</Label>
                  </div>
                </div>
             </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-gold text-emerald-deep" onClick={handleSave}>
                  {editingEvent ? "Salvar Alterações" : "Criar Evento"}
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
                            {onManageLots && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2"
                                onClick={() => onManageLots(event.id)}
                              >
                                <Plus className="mr-1 h-3 w-3" /> Lotes
                              </Button>
                            )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
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