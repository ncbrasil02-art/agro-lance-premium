  import { useRealtimeLots } from "@/hooks/useRealtimeEvent";
  import { useRealtimeFallback } from "@/hooks/useRealtimeFallback";
import { Textarea } from "@/components/ui/textarea";
 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, Calendar as CalendarIcon, PlusCircle, Filter, Send, Play, Info, HelpCircle, Eye, MessageSquare, FileText, Trash, Users, Gavel, UserPlus, ListOrdered, Check, AlertCircle, Printer, Wand2 } from "lucide-react";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { toast } from "sonner";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
import { validateLiveLink, formatBRL } from "@/utils/format";
import { generateSlug } from "@/utils/slug";
import { SerpPreview } from "./SerpPreview";
import { SeoAnalysis } from "./SeoAnalysis";
import { RichResultsPreview } from "./RichResultsPreview";
import { SocialPreview } from "./SocialPreview";
 
  export function EventManagement({ onManageLots }: { onManageLots?: (id: string) => void }) {
    const [events, setEvents] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAiFixing, setIsAiFixing] = useState(false);
   const [statusFilter, setStatusFilter] = useState("all");
   const [pendingWinnerLots, setPendingWinnerLots] = useState<any[]>([]);
   const [isPendingLoading, setIsPendingLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
     const [editingEvent, setEditingEvent] = useState<any>(null);
     const [viewingEventDetails, setViewingEventDetails] = useState<any>(null);
     const [eventLots, setEventLots] = useState<any[]>([]);
     const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [selectedLotForBids, setSelectedLotForBids] = useState<any>(null);
  const [lotBids, setLotBids] = useState<any[]>([]);
  const [isBidsLoading, setIsBidsLoading] = useState(false);
  const [selectedLotForWinner, setSelectedLotForWinner] = useState<any>(null);
  const [searchWinnerQuery, setSearchWinnerQuery] = useState("");
  const [isAssigningWinner, setIsAssigningWinner] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);

   const handleAutoFix = async () => {
     if (!formData.name) {
       toast.error("Preencha ao menos o nome para usar a IA");
       return;
     }
     setIsAiFixing(true);
     try {
       const { data: aiFix, error: aiError } = await supabase.functions.invoke('seo-fixer', {
         body: { type: 'Evento', title: formData.name, content: formData.description }
       });
       if (aiError) throw aiError;
       setFormData({
         ...formData,
         seo_title: aiFix.seo_title,
         seo_description: aiFix.seo_description,
         og_title: aiFix.og_title,
         og_description: aiFix.og_description
       });
       toast.success("SEO otimizado com IA!");
     } catch (error: any) {
       toast.error("Erro ao otimizar: " + error.message);
     } finally {
       setIsAiFixing(false);
     }
   };

  const fetchLotBids = async (lotId: string) => {
    setIsBidsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bids")
        .select("*, profile:profiles!bids_user_id_fkey(full_name, phone, cpf)")
        .eq("lot_id", lotId)
        .order("amount", { ascending: false });
      if (error) throw error;
      setLotBids(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar lances: " + error.message);
    } finally {
      setIsBidsLoading(false);
    }
  };

  const handleAssignWinner = async (profileId: string) => {
    if (!selectedLotForWinner) return;
    setIsAssigningWinner(true);
    try {
      const { error } = await supabase
        .from("lots")
        .update({ 
          winner_id: profileId,
          status: 'sold',
          winner_link_reason: 'Atribuição manual via painel de eventos'
        })
        .eq("id", selectedLotForWinner.id);
      
      if (error) throw error;
      
      toast.success("Ganhador atribuído com sucesso!");
      setSelectedLotForWinner(null);
      if (viewingEventDetails) fetchEventLots(viewingEventDetails.id);
    } catch (error: any) {
      toast.error("Erro ao atribuir ganhador: " + error.message);
    } finally {
      setIsAssigningWinner(false);
    }
  };

  const handleFinalizeLot = async (lot: any) => {
    if (!confirm(`Deseja finalizar a venda do Lote ${lot.lot_number}? O maior lance atual será o vencedor.`)) return;
    
    try {
      // Find the highest bid
      const { data: bids } = await supabase
        .from("bids")
        .select("*")
        .eq("lot_id", lot.id)
        .order("amount", { ascending: false })
        .limit(1);
      
      const highestBid = bids?.[0];
      if (!highestBid) {
        toast.error("Este lote não possui lances para ser finalizado.");
        return;
      }

      const { error } = await supabase
        .from("lots")
        .update({ 
          status: 'sold', 
          winner_id: highestBid.user_id,
          current_price: highestBid.amount
        })
        .eq("id", lot.id);
      
      if (error) throw error;
      toast.success("Lote finalizado com sucesso!");
      if (viewingEventDetails) fetchEventLots(viewingEventDetails.id);
    } catch (error: any) {
      toast.error("Erro ao finalizar lote: " + error.message);
    }
  };

  useEffect(() => {
    if (searchWinnerQuery.length > 2) {
      const search = async () => {
           const { data } = await supabase
           .from("profiles")
           .select("id, full_name, phone, cpf")
           .or(`full_name.ilike.%${searchWinnerQuery}%,cpf.ilike.%${searchWinnerQuery}%`)
           .limit(10);
        setFilteredProfiles(data || []);
      };
      search();
    } else if (searchWinnerQuery.length === 0) {
      setFilteredProfiles([]);
    }
  }, [searchWinnerQuery]);

     const fetchEventLots = async (eventId: string) => {
       setIsDetailsLoading(true);
       try {
          const { data, error } = await supabase
            .from("lots")
            .select(`
              *,
              animal:animals(name, internal_code),
              winner:profiles!lots_winner_id_fkey(id, full_name, phone, cpf)
            `)
            .eq("event_id", eventId)
            .order("lot_number", { ascending: true });
 
         if (error) throw error;
         setEventLots(data || []);
       } catch (error: any) {
         toast.error("Erro ao carregar lotes do evento: " + error.message);
       } finally {
         setIsDetailsLoading(false);
       }
     };
 
     const handleDeleteBid = async (bidId: string, lotId: string) => {
       if (!confirm("Tem certeza que deseja EXCLUIR este lance?")) return;
       try {
         const { data, error } = await supabase.rpc("delete_bid_safe", {
           p_bid_id: bidId
         });
         if (error) throw error;
         const result = data as { success: boolean; message: string };
         if (result.success) {
           toast.success(result.message);
           if (viewingEventDetails) fetchEventLots(viewingEventDetails.id);
         } else {
           toast.error(result.message);
         }
       } catch (error: any) {
         toast.error("Erro ao excluir lance: " + error.message);
       }
     };
 
    
    const [requestFormData, setRequestFormData] = useState({
      name: "",
      whatsapp: "",
      category: "",
      location: "",
      additional_info: ""
    });
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
        auctioneer_name: "",
          seller_id: "none",
          seller_name: "",
          commission_rate: 0,
          regulation: "",
          viewers: 0,
          slug: "",
          seo_title: "",
          seo_description: "",
          og_title: "",
          og_description: "",
          og_image_url: ""
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
         auctioneer_name: "",
          seller_id: "none",
          seller_name: "",
          commission_rate: 0,
          regulation: "",
          viewers: 0,
          slug: "",
          seo_title: "",
          seo_description: "",
          og_title: "",
          og_description: "",
          og_image_url: ""
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
         auctioneer_name: event.auctioneer_name || "",
            seller_id: event.seller_id || "none",
            seller_name: event.seller_name || "",
            commission_rate: event.commission_rate || 0,
            regulation: event.regulation || "",
            viewers: event.viewers || 0,
            slug: event.slug || "",
            seo_title: event.seo_title || "",
          seo_description: event.seo_description || "",
          og_title: event.og_title || "",
          og_description: event.og_description || "",
          og_image_url: event.og_image_url || ""
        });
       setIsDialogOpen(true);
     };
 
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*, sellers!events_seller_id_fkey(name)");

        if (error) throw error;
        
        // Custom sorting: Live first, then Scheduled, then Finished
        // Within each status, sort by start_date descending
        const sortedData = (data || []).sort((a: any, b: any) => {
          const statusPriority: Record<string, number> = { 'live': 1, 'scheduled': 2, 'finished': 3 };
          const pA = statusPriority[a.status as string] || 99;
          const pB = statusPriority[b.status as string] || 99;
          
          if (pA !== pB) return pA - pB;
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });

        setEvents(sortedData);

        if (error) {
          console.error("Error fetching events:", error);
          throw error;
        }
        console.log("Events loaded:", data?.length || 0);
        setEvents(data || []);
      } catch (error: any) {
        toast.error("Erro ao carregar eventos: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSellers = async () => {
      try {
        const { data, error } = await supabase.from("sellers").select("id, name");
        if (error) throw error;
        setSellers(data || []);
      } catch (error: any) {
        console.error("Error fetching sellers:", error);
      }
    };
 
     useEffect(() => {
       fetchEvents();
       fetchSellers();
       fetchPendingWinnerLots();
     }, []);

     const fetchPendingWinnerLots = async () => {
       setIsPendingLoading(true);
       try {
         const { data, error } = await supabase
           .from("lots")
           .select(`
             *,
             animal:animals(name, internal_code),
             event:events(name)
           `)
           .eq("status", "sold")
           .is("winner_id", null)
           .order("updated_at", { ascending: false });
         if (error) throw error;
         setPendingWinnerLots(data || []);
       } catch (error: any) {
         console.error("Erro ao carregar pendências:", error);
       } finally {
         setIsPendingLoading(false);
       }
     };

    // Real-time updates for the events list and current details
     useRealtimeLots(() => {
       fetchEvents();
       fetchPendingWinnerLots();
       if (viewingEventDetails) {
         fetchEventLots(viewingEventDetails.id);
       }
     });

      const [rtStatus, setRtStatus] = useState<string>("INITIAL");

      useEffect(() => {
        const channel = supabase
          .channel('admin-events-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
            fetchEvents();
          })
          .subscribe((newStatus) => {
            setRtStatus(newStatus);
          });
  
        return () => {
          supabase.removeChannel(channel);
        };
      }, []);

      useRealtimeFallback({
        status: rtStatus,
        onUpdate: fetchEvents,
        label: "Gestão de Eventos (Admin)",
        pollInterval: 60000,
        initialPollInterval: 30000
      });
 
    const handleSave = async () => {
      if (!formData.name || !formData.start_date) {
        toast.error("Preencha o nome e a data de início");
        return;
      }

      if (formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
        toast.error("A data de término deve ser posterior à data de início");
        return;
      }
      
      if (formData.transmission_link && !validateLiveLink(formData.transmission_link)) {
        toast.error("Por favor, insira um link válido do YouTube ou Vimeo");
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
               auctioneer_name: formData.auctioneer_name,
                seller_id: formData.seller_id === "none" ? null : (formData.seller_id || null),
                 seller_name: formData.seller_name,
                  regulation: formData.regulation,
                  viewers: formData.viewers,
                  seo_title: formData.seo_title,
                  seo_description: formData.seo_description
              })
             .eq("id", editingEvent.id);
          if (error) throw error;
          toast.success("Evento atualizado com sucesso");
        } else {
          let slug = formData.slug?.trim();
          if (!slug) {
            const baseSlug = generateSlug(formData.name);
            slug = `${baseSlug}-${Math.floor(Math.random() * 1000000)}`;
          } else {
            slug = generateSlug(slug);
          }
          
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
            seller_id: formData.seller_id === "none" ? null : (formData.seller_id || null),
             seller_name: formData.seller_name,
              slug: slug,
              regulation: formData.regulation,
              viewers: formData.viewers,
              seo_title: formData.seo_title,
              seo_description: formData.seo_description
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
 
    const filteredEvents = events.filter(event => {
      const matchesSearch = event.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (statusFilter === "all") return matchesSearch;
      if (statusFilter === "live") return matchesSearch && event.status === "live";
      if (statusFilter === "finished") return matchesSearch && event.status === "finished";
      if (statusFilter === "loteamento") return matchesSearch && event.status === "em_loteamento";
      if (statusFilter === "recebendo_lances") return matchesSearch && event.status === "recebendo_lances";
       if (statusFilter === "condicional") return matchesSearch && event.status === "em_condicional";
       if (statusFilter === "adiado") return matchesSearch && event.status === "evento_adiado";
       if (statusFilter === "incondicional") return matchesSearch && event.status === "incondicional";
      if (statusFilter === "pre-bidding") return matchesSearch && event.status === "scheduled" && event.allows_pre_bidding;
      if (statusFilter === "scheduled") return matchesSearch && event.status === "scheduled" && !event.allows_pre_bidding;
      
      return matchesSearch;
    });
 
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
        case 'em_loteamento': return 'text-amber-500 bg-amber-500/10';
        case 'recebendo_lances': return 'text-purple-500 bg-purple-500/10';
        case 'em_condicional': return 'text-orange-500 bg-orange-500/10';
        case 'evento_adiado': return 'text-red-500 bg-red-500/10';
         case 'finished': return 'text-emerald-700 bg-emerald-100 border border-emerald-200 shadow-sm';
        default: return 'text-muted-foreground bg-muted';
      }
   };
 
   const getStatusLabel = (status: string) => {
      switch (status) {
        case 'live': return 'Ao Vivo';
        case 'scheduled': return 'Aceita pré-lance';
        case 'em_loteamento': return 'Em Loteamento';
        case 'recebendo_lances': return 'Recebendo Lances';
        case 'em_condicional': return 'Em Condicional';
        case 'evento_adiado': return 'Evento Adiado';
        case 'finished': return 'Finalizado';
        default: return status;
      }
   };
    const handleSendRequest = async () => {
      if (!requestFormData.name || !requestFormData.whatsapp) {
        toast.error("Por favor, preencha nome e WhatsApp");
        return;
      }
      
      try {
        const { error } = await supabase.from("event_requests").insert(requestFormData);
        if (error) throw error;
        toast.success("Pedido enviado com sucesso! Entraremos em contato em breve.");
        setIsRequestDialogOpen(false);
        setRequestFormData({ name: "", whatsapp: "", category: "", location: "", additional_info: "" });
      } catch (error: any) {
        toast.error("Erro ao enviar pedido: " + error.message);
      }
    };

    const statusDescriptions = [
      { id: 'em_loteamento', label: 'Em Loteamento', color: 'text-orange-600 bg-orange-600/10 font-black', desc: 'Fase inicial de cadastro de animais. O evento não fica aberto para lances no site.' },
      { id: 'scheduled', label: 'Aceita pré-lance', color: 'text-blue-500 bg-blue-500/10', desc: 'O evento está pronto e aguardando a data de início oficial.' },
      { id: 'recebendo_lances', label: 'Recebendo Lances', color: 'text-purple-500 bg-purple-500/10', desc: 'Evento aberto e aceitando lances em todos os lotes simultaneamente.' },
      { id: 'live', label: 'Ao Vivo', color: 'text-emerald-500 bg-emerald-500/10', desc: 'Evento acontecendo em tempo real com transmissão ao vivo e lances simultâneos.' },
      { id: 'em_condicional', label: 'Em Condicional', color: 'text-orange-500 bg-orange-500/10', desc: 'O maior lance não atingiu o preço de reserva e está em negociação.' },
      { id: 'incondicional', label: 'Evento Confirmado', color: 'text-emerald-600 bg-emerald-600/10', desc: 'A venda foi confirmada e o martelo batido sem restrições.' },
      { id: 'evento_adiado', label: 'Evento Adiado', color: 'text-red-500 bg-red-500/10', desc: 'O evento foi postergado para uma nova data/horário.' },
      { id: 'finished', label: 'Finalizado', color: 'text-emerald-700 bg-emerald-700/10 border-emerald-700/20 font-black', desc: 'O leilão encerrou completamente e todos os lotes foram processados.' },
    ];

    return (
      <div className="space-y-6">
          {/* Status Legend */}
          <Card className="border-gold/20 bg-gold/5">
            <CardHeader className="py-3 px-6 border-b border-gold/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gold" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gold">Legenda de Status dos Eventos</CardTitle>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Guia de Referência</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statusDescriptions.map((status) => (
                  <div key={status.id} className="space-y-1 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {status.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-6">
             <div className="flex flex-wrap items-center gap-2">
               <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading}>
                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Lista"}
               </Button>
               <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
                 <Filter className="h-3 w-3 ml-2 text-muted-foreground" />
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 w-[180px] text-xs">
                     <SelectValue placeholder="Filtrar Status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos os Status</SelectItem>
                     <SelectItem value="live">Ao Vivo</SelectItem>
                      <SelectItem value="loteamento">Loteamento</SelectItem>
                      <SelectItem value="recebendo_lances">Recebendo Lances</SelectItem>
                      <SelectItem value="condicional">Em Condicional</SelectItem>
                       <SelectItem value="adiado">Evento Adiado</SelectItem>
                       <SelectItem value="incondicional">Evento Confirmado</SelectItem>
                     <SelectItem value="scheduled">Aceita pré-lance</SelectItem>
                     <SelectItem value="finished">Encerrados</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
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
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
             <DialogHeader>
                <DialogTitle>{editingEvent ? "Editar Evento" : "Criar Novo Evento"}</DialogTitle>
               <DialogDescription>
                  Defina as configurações do leilão.
               </DialogDescription>
             </DialogHeader>
              <Tabs defaultValue="basico" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-6 mb-6">
                  <TabsTrigger value="basico">Básico</TabsTrigger>
                  <TabsTrigger value="agenda">Agenda</TabsTrigger>
                  <TabsTrigger value="transmissao">Transmissão</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                   <TabsTrigger value="social">Social</TabsTrigger>
                   <TabsTrigger value="rich">Rich Results</TabsTrigger>
                 </TabsList>
                <TabsContent value="seo" className="space-y-4 animate-in fade-in slide-in-from-left-2">
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug (URL amigável)</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="slug"
                        value={formData.slug} 
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                        placeholder="exemplo-de-link-seo"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFormData({ ...formData, slug: generateSlug(formData.name) })}
                        type="button"
                      >
                        Gerar da Nome
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seo_title">SEO Title (Título da Aba)</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] uppercase font-bold text-emerald-600 gap-1"
                        onClick={handleAutoFix}
                        disabled={isAiFixing}
                        type="button"
                      >
                        {isAiFixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                        Auto-completar com IA
                      </Button>
                    </div>
                    <Input 
                      id="seo_title"
                      value={formData.seo_title} 
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })} 
                      placeholder="Título para buscadores"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea 
                      id="seo_description"
                      className="min-h-[100px]"
                      value={formData.seo_description} 
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })} 
                      placeholder="Meta descrição para o Google"
                    />
                  </div>

                   <div className="pt-4 border-t">
                     <SeoAnalysis 
                       title={formData.seo_title || formData.name}
                       description={formData.seo_description || formData.description}
                       image={formData.banner_url}
                      ogTitle={formData.og_title}
                      ogDescription={formData.og_description}
                     />
                     <div className="mt-6">
                       <SerpPreview 
                         title={formData.seo_title || formData.name}
                         description={formData.seo_description || formData.description}
                         slug={formData.slug}
                         basePath="/eventos"
                       />
                     </div>
                   </div>
                </TabsContent>
                <TabsContent value="social" className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="og_title">Título Open Graph (Opcional)</Label>
                      <Input 
                        id="og_title"
                        value={formData.og_title} 
                        onChange={(e) => setFormData({ ...formData, og_title: e.target.value })} 
                        placeholder="Override do título para redes sociais"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="og_description">Descrição Open Graph (Opcional)</Label>
                      <Textarea 
                        id="og_description"
                        value={formData.og_description} 
                        onChange={(e) => setFormData({ ...formData, og_description: e.target.value })} 
                        placeholder="Override da descrição para redes sociais"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="og_image_url">Imagem Open Graph (Opcional)</Label>
                      <Input 
                        id="og_image_url"
                        value={formData.og_image_url} 
                        onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })} 
                        placeholder="URL da imagem específica para compartilhamento"
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <SocialPreview 
                      title={formData.og_title || formData.seo_title || formData.name}
                      description={formData.og_description || formData.seo_description || formData.description}
                      image={formData.og_image_url || formData.banner_url}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="rich" className="space-y-4 pt-4">
                  <RichResultsPreview 
                    type="event"
                    title={formData.og_title || formData.seo_title || formData.name}
                    data={{
                      startDate: formData.start_date,
                      location: formData.location || "Arena Digital"
                    }}
                  />
                </TabsContent>

                <TabsContent value="basico" className="space-y-4 animate-in fade-in slide-in-from-left-2">
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
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="regulation">Regulamento do Evento</Label>
                    <Textarea 
                      id="regulation"
                      value={formData.regulation} 
                      onChange={(e) => setFormData({ ...formData, regulation: e.target.value })} 
                      placeholder="Insira as regras e condições do leilão..."
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select onValueChange={(v) => setFormData({ ...formData, event_type: v })} value={formData.event_type}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="online">Online</SelectItem>
                           <SelectItem value="ao_vivo">Ao Vivo</SelectItem>
                           <SelectItem value="presencial">Presencial</SelectItem>
                           <SelectItem value="hibrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                     <div className="flex items-center gap-2">
                       <Label htmlFor="status">Status do Evento</Label>
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                           </TooltipTrigger>
                           <TooltipContent className="max-w-[300px] p-3 space-y-2">
                             <p className="font-bold text-xs uppercase border-b pb-1 mb-1">Guia Rápido de Status</p>
                             <div className="space-y-2 text-[11px]">
                               <p><strong>Loteamento:</strong> Cadastro interno. Não visível para lances.</p>
                               <p><strong>Aceita pré-lance:</strong> Pronto para o site. Aceita pré-lance se configurado.</p>
                               <p><strong>Recebendo Lances:</strong> Aberto para lances (Leilão Online).</p>
                               <p><strong>Ao Vivo:</strong> Acontecendo agora com transmissão.</p>
                               <p><strong>Condicional:</strong> Em negociação após o fim.</p>
                               <p><strong>Evento Confirmado:</strong> Venda batida e confirmada.</p>
                             </div>
                           </TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     </div>
                      <Select onValueChange={(v) => setFormData({ ...formData, status: v })} value={formData.status}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="em_loteamento">Em Loteamento</SelectItem>
                          <SelectItem value="recebendo_lances">Recebendo Lances</SelectItem>
                           <SelectItem value="em_condicional">Em Condicional</SelectItem>
                            <SelectItem value="incondicional">Evento Confirmado</SelectItem>
                           <SelectItem value="evento_adiado">Evento Adiado</SelectItem>
                           <SelectItem value="scheduled">Aceita pré-lance</SelectItem>
                          <SelectItem value="live">Ao Vivo</SelectItem>
                          <SelectItem value="finished">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="seller_id">Vendedor (Perfil)</Label>
                      <Select onValueChange={(v) => setFormData({ ...formData, seller_id: v })} value={formData.seller_id}>
                        <SelectTrigger><SelectValue placeholder="Selecione um vendedor" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (Usar nome manual)</SelectItem>
                          {sellers.map(seller => (
                            <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="seller_name">Nome do Vendedor (Manual)</Label>
                      <Input value={formData.seller_name} onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })} placeholder="Ex: João da Silva" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="agenda" className="space-y-4 animate-in fade-in slide-in-from-left-2">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="location">Localização</Label>
                      <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Ex: São Paulo - SP" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="viewers" className="flex items-center gap-1">
                        Visualizações Base
                      </Label>
                      <Input 
                        type="number" 
                        value={formData.viewers} 
                        onChange={(e) => setFormData({ ...formData, viewers: parseInt(e.target.value) })} 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="pre_bidding" 
                        checked={formData.allows_pre_bidding} 
                        onChange={(e) => setFormData({...formData, allows_pre_bidding: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                      />
                      <Label htmlFor="pre_bidding" className="cursor-pointer">Permitir Lances Antecipados</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="countdown" 
                        checked={formData.show_countdown} 
                        onChange={(e) => setFormData({...formData, show_countdown: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
                      />
                      <Label htmlFor="countdown" className="cursor-pointer">Mostrar Contagem Regressiva</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transmissao" className="space-y-4 animate-in fade-in slide-in-from-left-2">
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
                        className="flex-1 border-dashed h-24 flex-col gap-2" 
                        onClick={() => document.getElementById('banner-upload')?.click()}
                      >
                        <PlusCircle className="h-6 w-6" /> 
                        {formData.banner_url ? "Trocar Banner" : "Upload Banner"}
                      </Button>
                    </div>
                    {formData.banner_url && (
                      <p className="text-[10px] text-emerald-500 font-medium">✓ Imagem carregada com sucesso</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="transmission">Link da Transmissão (YouTube/Vimeo)</Label>
                    <Input value={formData.transmission_link} onChange={(e) => setFormData({ ...formData, transmission_link: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="promoter">Empresa Promotora</Label>
                      <Input value={formData.promoter_company} onChange={(e) => setFormData({ ...formData, promoter_company: e.target.value })} placeholder="Fazenda / Empresa" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="auctioneer">Leiloeiro</Label>
                      <Input value={formData.auctioneer_name} onChange={(e) => setFormData({ ...formData, auctioneer_name: e.target.value })} placeholder="Nome do Leiloeiro" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-gold text-emerald-deep" onClick={handleSave}>
                  {editingEvent ? "Salvar Alterações" : "Criar Evento"}
               </Button>
             </DialogFooter>
            </DialogContent>
          </Dialog>

         <Tabs defaultValue="eventos" className="w-full">
           <TabsList className="mb-4">
             <TabsTrigger value="eventos" className="gap-2">
               <CalendarIcon className="h-4 w-4" /> Eventos
             </TabsTrigger>
             <TabsTrigger value="pendencias" className="gap-2 relative">
               <AlertCircle className="h-4 w-4" /> Pendências
               {pendingWinnerLots.length > 0 && (
                 <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                   {pendingWinnerLots.length}
                 </span>
               )}
             </TabsTrigger>
           </TabsList>

           <TabsContent value="eventos">
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
                    <TableHead>Data</TableHead>
                    <TableHead>Local/Promotor/Vendedor</TableHead>
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
                          <div className="text-xs text-muted-foreground">{event.event_type === 'online' ? 'Online' : 'Ao Vivo'}</div>
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
                          <div className="text-[10px] text-gold font-medium">{event.seller?.name || event.seller_name || ''}</div>
                       </TableCell>
                       <TableCell>
                         <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(event.status)}`}>
                           {getStatusLabel(event.status)}
                         </span>
                       </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {event.status === 'scheduled' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                                onClick={async () => {
                                  if (!confirm("Deseja colocar este evento AO VIVO agora?")) return;
                                  // Get the first lot of this event to auto-select it
                                  const { data: eventLots } = await supabase
                                    .from("lots")
                                    .select("id")
                                    .eq("event_id", event.id)
                                    .order("lot_number", { ascending: true })
                                    .limit(1);

                                  const updateData: any = { status: 'live' };
                                  if (eventLots && eventLots.length > 0) {
                                    updateData.active_lot_id = eventLots[0].id;
                                    // Also mark the lot as active
                                    await supabase.from("lots").update({ status: 'active' }).eq("id", eventLots[0].id);
                                  }

                                  const { error } = await supabase.from("events").update(updateData).eq("id", event.id);
                                  
                                  if (error) toast.error("Erro ao ativar: " + error.message);
                                  else {
                                    toast.success(eventLots?.length ? "Evento AO VIVO com primeiro lote ativo!" : "Evento está AO VIVO!");
                                    fetchEvents();
                                  }
                                }}
                              >
                                <Play className="mr-1 h-3 w-3" /> Abrir Auditório
                              </Button>
                            )}
                            {event.status === 'live' && (
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
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button 
                                       variant="outline" 
                                       size="sm" 
                                       className="h-8 px-2"
                                       onClick={() => onManageLots(event.id)}
                                     >
                                       <Plus className="mr-1 h-3 w-3" /> Lotes
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>Gerenciar e alocar lotes para este evento</TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             )}
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button 
                                     variant="ghost" 
                                     size="icon" 
                                     className="text-emerald-deep"
                                     onClick={() => {
                                       setViewingEventDetails(event);
                                       fetchEventLots(event.id);
                                     }}
                                   >
                                     <Eye className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>Ver detalhes e arrematantes</TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                                     <Pencil className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>Editar configurações do evento</TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                            {['draft', 'cancelled', 'scheduled', 'em_loteamento'].includes(event.status) ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(event.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Excluir evento permanentemente</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center h-9 w-9 text-muted-foreground opacity-50 cursor-not-allowed">
                                      <Trash2 className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Eventos iniciados/finalizados não podem ser excluídos.</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
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
           </TabsContent>

           <TabsContent value="pendencias">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Gavel className="h-5 w-5 text-gold" />
                   Arremates Pendentes de Vínculo
                 </CardTitle>
                 <CardDescription>
                   Lotes vendidos via auditório ou telefone que ainda não foram vinculados a um cadastro do site.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {isPendingLoading ? (
                   <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
                 ) : pendingWinnerLots.length === 0 ? (
                   <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                     Nenhum arremate pendente.
                   </div>
                 ) : (
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Lote</TableHead>
                         <TableHead>Evento</TableHead>
                         <TableHead>Animal</TableHead>
                         <TableHead>Valor</TableHead>
                         <TableHead className="text-right">Ação</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {pendingWinnerLots.map((lot) => (
                         <TableRow key={lot.id}>
                           <TableCell className="font-bold">#{lot.lot_number}</TableCell>
                           <TableCell className="text-xs">{lot.event?.name}</TableCell>
                           <TableCell className="font-medium uppercase">{lot.animal?.name}</TableCell>
                           <TableCell className="font-bold text-emerald-deep">{formatBRL(lot.current_price)}</TableCell>
                           <TableCell className="text-right">
                             <Button size="sm" onClick={() => setSelectedLotForWinner(lot)}>
                               <UserPlus className="mr-2 h-4 w-4" /> Atribuir Ganhador
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
 
        <Dialog open={!!viewingEventDetails} onOpenChange={(open) => !open && setViewingEventDetails(null)}>
           <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 <Eye className="h-5 w-5 text-emerald-deep" />
                 Detalhamento do Evento: {viewingEventDetails?.name}
               </DialogTitle>
               <DialogDescription>
                 Acompanhe todos os lotes, arrematantes e valores finais deste leilão.
               </DialogDescription>
             </DialogHeader>
 
             <div className="mt-4 space-y-4">
               {isDetailsLoading ? (
                 <div className="flex justify-center py-12">
                   <Loader2 className="h-8 w-8 animate-spin text-gold" />
                 </div>
               ) : eventLots.length === 0 ? (
                 <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                   Nenhum lote cadastrado para este evento.
                 </div>
               ) : (
                 <div className="border rounded-xl overflow-hidden bg-card">
                   <Table>
                     <TableHeader className="bg-muted/50">
                       <TableRow>
                         <TableHead className="w-[80px]">Lote</TableHead>
                         <TableHead>Animal</TableHead>
                         <TableHead>Arrematante</TableHead>
                         <TableHead>Valor / Lances</TableHead>
                         <TableHead className="text-right">Ações</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {eventLots.map((lot) => (
                         <TableRow key={lot.id} className="hover:bg-muted/30">
                           <TableCell className="font-bold text-lg text-emerald-deep">
                             #{String(lot.lot_number).padStart(2, '0')}
                           </TableCell>
                           <TableCell>
                             <div className="font-bold uppercase italic">{lot.animal?.name}</div>
                             <div className="text-[10px] text-muted-foreground">CÓD: {lot.animal?.internal_code}</div>
                           </TableCell>
                           <TableCell>
                             {lot.winner ? (
                               <div className="space-y-1">
                                 <div className="font-bold text-emerald-600 flex items-center gap-1">
                                   <Users className="h-3 w-3" />
                                   {lot.winner.full_name}
                                 </div>
                                 <div className="text-[10px] text-muted-foreground">CPF: {lot.winner.cpf || '---'}</div>
                                 <a 
                                   href={`https://wa.me/55${lot.winner.phone?.replace(/\D/g, '')}`} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                 >
                                   <MessageSquare className="h-3 w-3" />
                                   WhatsApp: {lot.winner.phone}
                                 </a>
                               </div>
                             ) : (
                               <span className="text-xs text-muted-foreground italic">Sem arrematante</span>
                             )}
                           </TableCell>
                           <TableCell>
                             <div className="flex flex-col">
                               <span className="font-black text-emerald-deep">
                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lot.current_price || 0)}
                               </span>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-6 px-0 text-[10px] text-muted-foreground hover:text-emerald-600 flex items-center gap-1"
                                 onClick={() => { setSelectedLotForBids(lot); fetchLotBids(lot.id); }}
                               >
                                 <ListOrdered className="h-3 w-3" /> Ver {lot.bids_count || 0} lances
                               </Button>
                             </div>
                           </TableCell>
                           <TableCell className="text-right">
                             <div className="flex justify-end gap-1">
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedLotForBids(lot); fetchLotBids(lot.id); }}>
                                       <ListOrdered className="h-4 w-4" />
                                     </Button>
                                   </TooltipTrigger>
                                   <TooltipContent>Histórico de Lances</TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>

                               {lot.status !== 'sold' && (
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleFinalizeLot(lot)}>
                                         <Check className="h-4 w-4" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>Finalizar Arremate</TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               )}

                               {!lot.winner_id && (
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button variant="ghost" size="icon" className="h-8 w-8 text-gold" onClick={() => setSelectedLotForWinner(lot)}>
                                         <UserPlus className="h-4 w-4" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>Vincular Ganhador</TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               )}

                               {lot.winner && (
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button 
                                         variant="ghost" 
                                         size="icon" 
                                         className="h-8 w-8 text-blue-500"
                                         onClick={() => window.open(`https://wa.me/55${lot.winner.phone?.replace(/\D/g, '')}`, '_blank')}
                                       >
                                         <MessageSquare className="h-4 w-4" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>WhatsApp do Ganhador</TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               )}

                               <Dialog>
                                 <DialogTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600">
                                     <FileText className="h-4 w-4" />
                                   </Button>
                                 </DialogTrigger>
                                 <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 text-black">
                                   <div className="p-8 space-y-8">
                                     <div className="text-center border-b-2 border-emerald-900 pb-6 mb-8">
                                       <h1 className="text-3xl font-black uppercase text-emerald-900 leading-none">Premium Agro Leilões</h1>
                                       <p className="text-sm text-gray-500 uppercase font-bold mt-2">Documento Oficial de Arremate — Admin</p>
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                       <div className="space-y-4">
                                         <h3 className="text-xs font-black uppercase tracking-widest text-gold border-b pb-1">Dados do Arrematante</h3>
                                         <div className="space-y-1 text-sm">
                                            <p><span className="text-gray-500">Nome:</span> <span className="font-bold">{lot.winner?.full_name || "Auditório"}</span></p>
                                            <p><span className="text-gray-500">CPF/CNPJ:</span> <span className="font-bold">{lot.winner?.cpf || "---"}</span></p>
                                           <p><span className="text-gray-500">Telefone:</span> <span className="font-bold">{lot.winner?.phone || "---"}</span></p>
                                         </div>
                                       </div>
                                       <div className="space-y-4">
                                         <h3 className="text-xs font-black uppercase tracking-widest text-gold border-b pb-1">Dados do Lote</h3>
                                         <div className="space-y-1 text-sm">
                                           <p><span className="text-gray-500">Evento:</span> <span className="font-bold">{viewingEventDetails?.name}</span></p>
                                           <p><span className="text-gray-500">Lote:</span> <span className="font-bold">#{lot.lot_number}</span></p>
                                           <p><span className="text-gray-500">Animal:</span> <span className="font-bold">{lot.animal?.name}</span></p>
                                         </div>
                                       </div>
                                     </div>

                                     <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                       <div className="flex justify-between items-center">
                                          <div className="uppercase font-black text-emerald-900">Valor do Arremate</div>
                                          <div className="text-3xl font-black text-emerald-600">{formatBRL(lot.current_price)}</div>
                                       </div>
                                     </div>

                                     <div className="pt-10">
                                       <p className="text-xs leading-relaxed text-gray-500 italic">
                                         Este documento serve como registro administrativo do arremate. 
                                         O arremate foi realizado em {new Date(lot.updated_at).toLocaleString('pt-BR')}.
                                       </p>
                                     </div>

                                     <div className="flex justify-between items-end pt-20">
                                        <div className="w-48 border-t border-black text-center pt-2 text-[10px] uppercase font-bold">Premium Agro</div>
                                        <div className="w-48 border-t border-black text-center pt-2 text-[10px] uppercase font-bold">Arrematante</div>
                                     </div>
                                     
                                     <Button className="w-full bg-emerald-900 text-white print:hidden mt-10" onClick={() => window.print()}>
                                       <Printer className="mr-2 h-4 w-4" /> Imprimir Termo de Venda
                                     </Button>
                                   </div>
                                 </DialogContent>
                               </Dialog>
                             </div>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               )}
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setViewingEventDetails(null)}>Fechar</Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

         <Dialog open={!!selectedLotForBids} onOpenChange={(open) => !open && setSelectedLotForBids(null)}>
           <DialogContent className="max-w-xl">
             <DialogHeader>
               <DialogTitle>Histórico de Lances: Lote #{selectedLotForBids?.lot_number}</DialogTitle>
             </DialogHeader>
             <div className="mt-4">
               {isBidsLoading ? (
                 <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
               ) : lotBids.length === 0 ? (
                 <p className="text-center py-8 text-muted-foreground">Nenhum lance recebido.</p>
               ) : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {lotBids.map((bid) => (
                        <TableRow key={bid.id} className={bid.is_winning ? "bg-emerald-50" : ""}>
                          <TableCell>
                            <div className="font-bold">{bid.profile?.full_name || bid.bidder_name || 'Usuário'}</div>
                            <div className="text-[10px] text-muted-foreground">{bid.bid_type}</div>
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">{formatBRL(bid.amount)}</TableCell>
                          <TableCell className="text-xs">{format(new Date(bid.created_at), "dd/MM HH:mm")}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteBid(bid.id, selectedLotForBids.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               )}
             </div>
           </DialogContent>
         </Dialog>

         <Dialog open={!!selectedLotForWinner} onOpenChange={(open) => !open && setSelectedLotForWinner(null)}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Atribuir Ganhador: Lote #{selectedLotForWinner?.lot_number}</DialogTitle>
               <DialogDescription>Pesquise o cadastro para vincular a este arremate.</DialogDescription>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Nome, CPF ou E-mail..." 
                   className="pl-9"
                   value={searchWinnerQuery}
                   onChange={(e) => setSearchWinnerQuery(e.target.value)}
                 />
               </div>
               <div className="space-y-2 max-h-[300px] overflow-y-auto">
                 {filteredProfiles.map((p) => (
                   <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                     <div>
                       <p className="font-bold text-sm">{p.full_name}</p>
                       <p className="text-[10px] text-muted-foreground">CPF: {p.cpf || '---'} | Tel: {p.phone || '---'}</p>
                     </div>
                     <Button size="sm" onClick={() => handleAssignWinner(p.id)} disabled={isAssigningWinner}>
                       {isAssigningWinner ? <Loader2 className="h-4 w-4 animate-spin" /> : "Selecionar"}
                     </Button>
                   </div>
                 ))}
                 {searchWinnerQuery.length > 2 && filteredProfiles.length === 0 && (
                   <p className="text-center text-xs text-muted-foreground py-4">Nenhum cadastro encontrado.</p>
                 )}
               </div>
             </div>
           </DialogContent>
         </Dialog>
       </div>
     );
   }