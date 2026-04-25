import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Loader2, Calendar as CalendarIcon, PlusCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { toast } from "sonner";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
  export function EventManagement({ 
    onManageLots, 
    onNavigate,
    searchQuery,
    onSearchChange
  }: { 
    onManageLots?: (id: string) => void; 
    onNavigate?: () => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
  }) {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
     const [formData, setFormData] = useState({
       name: "",
       description: "",
        start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        end_date: format(new Date(Date.now() + 4 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss"),
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
        end_date: format(new Date(Date.now() + 4 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss"),
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
        end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm:ss") : format(new Date(Date.now() + 4 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss"),
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
 
   const ITEMS_PER_PAGE = 8;
   const [currentPage, setCurrentPage] = useState(1);

   useEffect(() => {
     setCurrentPage(1);
   }, [searchQuery]);

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
        toast.error("Preencha o nome e a data de início");
        return;
      }

      if (formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
        toast.error("A data de término deve ser posterior à data de início");
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
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
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
            end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
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

   const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
   const paginatedEvents = filteredEvents.slice(
     (currentPage - 1) * ITEMS_PER_PAGE,
     currentPage * ITEMS_PER_PAGE
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
              onChange={(e) => onSearchChange(e.target.value)}
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
              <div className="grid gap-6 py-4">
                {/* Fixed Image Preview */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-white/5 bg-black/40 group">
                  <img 
                    src={formData.banner_url || "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80"} 
                    alt="Banner Preview" 
                    className={`h-full w-full object-cover transition-all duration-700 ${!formData.banner_url ? 'opacity-20 grayscale' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-1">Flyer do Evento</p>
                      <p className="text-sm font-bold text-white uppercase italic">{formData.name || "Nome do Evento"}</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 bg-white/10 hover:bg-gold hover:text-emerald-deep text-white text-[10px] font-bold rounded-lg border border-white/10 backdrop-blur-md"
                      onClick={() => document.getElementById('banner-upload')?.click()}
                    >
                      <PlusCircle className="mr-2 h-3.5 w-3.5" /> Upload Flyer
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Evento</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Grande Leilão Elite 2024" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição do Evento</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Fale um pouco sobre o evento, linhagens, etc."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner">Imagem de Destaque (Banner)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="banner-upload" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const toastId = toast.loading("Enviando banner...");
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random()}.${fileExt}`;
                        const { data, error } = await supabase.storage.from('banners').upload(fileName, file);
                        if (error) {
                          toast.error(`Erro no upload: ${error.message}`);
                        } else {
                          const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(data.path);
                          setFormData({ ...formData, banner_url: publicUrl });
                          toast.success("Banner enviado!");
                        }
                        toast.dismiss(toastId);
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 border-dashed" 
                      onClick={() => document.getElementById('banner-upload')?.click()}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> 
                      {formData.banner_url ? "Trocar Banner" : "Upload Banner"}
                    </Button>
                  </div>
                  {formData.banner_url && (
                    <p className="text-[10px] text-emerald-500 font-medium">✓ Imagem carregada com sucesso</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">Esta imagem aparece na página inicial e no topo do evento.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data/Hora Início</Label>
                    <Input 
                      type="datetime-local" 
                      step="1"
                      value={formData.start_date} 
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">Data/Hora Fim</Label>
                    <Input 
                      type="datetime-local" 
                      step="1"
                      value={formData.end_date} 
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">O leilão iniciará e encerrará automaticamente nestas datas. Certifique-se de definir também os segundos.</p>
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
              <>
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
                    {paginatedEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum evento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEvents.map((event) => (
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
                          <div className="flex justify-end gap-1 md:gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              asChild
                              title="Visualizar Página Pública"
                            >
                              <Link 
                                to="/eventos/$eventSlug" 
                                params={{ eventSlug: event.slug || "" }} 
                                target="_blank"
                              >
                                <Eye className="h-4 w-4 text-gold" />
                              </Link>
                            </Button>
                            {event.status !== 'finished' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                                onClick={async () => {
                                  if (!confirm("Deseja finalizar este evento agora? Todos os lotes serão marcados como encerrados.")) return;
                                  const { error } = await supabase.from("events").update({ status: 'finished', end_date: new Date().toISOString() }).eq("id", event.id);
                                  if (error) toast.error("Erro ao finalizar: " + error.message);
                                  else {
                                    toast.success("Evento finalizado!");
                                    fetchEvents();
                                  }
                                }}
                              >
                                Finalizar
                              </Button>
                            )}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} até {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)} de {filteredEvents.length} registros
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-xs font-medium">Página {currentPage} de {totalPages}</div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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