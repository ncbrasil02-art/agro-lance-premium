import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
   CheckCircle2,
   XCircle,
   Clock,
   AlertCircle,
   Search, 
   Package, 
   User, 
   Phone, 
   Mail, 
   Loader2,
   Filter
 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";

export function OfferManagement() {
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("*, animal:animals(name, breed, photos), profiles:profiles(full_name, phone, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar propostas: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    const uniqueId = `admin-offers-realtime-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(uniqueId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'offers' 
      }, () => {
        fetchOffers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

   const handleUpdateStatus = async (offer: any, status: 'approved' | 'rejected' | 'under_review') => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;

    try {
       const { error } = await supabase
         .from("offers")
         .update({ status })
         .eq("id", offer.id);

      if (error) throw error;

       // Create notification for the user
        const isRevision = offer.status === 'under_review';
        const statusLabel = status === 'approved' ? 'APROVADA' : status === 'rejected' ? 'REJEITADA' : 'EM ANÁLISE';
        
        let title = `Sua proposta foi ${statusLabel.toLowerCase()}`;
        if (isRevision && (status === 'approved' || status === 'rejected')) {
          title = `Decisão sobre sua revisão: ${statusLabel}`;
        }

        const content = `A proposta de ${formatBRL(offer.amount)} para o animal ${offer.animal?.name} foi alterada para o status: ${statusLabel}.${isRevision ? ' Esta decisão foi tomada após a sua solicitação de revisão.' : ''}`;

        await supabase.from("messages").insert({
          sender_id: user.id,
          recipient_id: offer.user_id,
          title: title,
          content: content,
          is_read: false
        });

        await supabase.from("notifications").insert({
          user_id: offer.user_id,
          title: title,
          message: content,
          is_read: false,
          link: "/painel"
        });

        // Call Edge Function for email notification
        await supabase.functions.invoke('user-notifications', {
          body: {
            userId: offer.user_id,
            userEmail: offer.profiles?.email,
            type: 'offer_status_update',
            data: {
              amount: offer.amount,
              itemName: offer.animal?.name || 'item',
              status: status
            }
          }
        });

       toast.success(`Proposta ${statusLabel.toLowerCase()} com sucesso! O usuário foi notificado.`);
      fetchOffers();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.animal?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-4 max-w-2xl">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
            <Filter className="h-3 w-3 ml-2 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 w-[160px] text-xs">
                <SelectValue placeholder="Status Proposta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Propostas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                 <SelectItem value="approved">Aprovadas</SelectItem>
                 <SelectItem value="under_review">Em Análise</SelectItem>
                 <SelectItem value="rejected">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por proponente, animal ou mensagem..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button variant="outline" onClick={fetchOffers} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Atualizar Lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Propostas de Compra (Lotes/Venda Direta)</CardTitle>
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
                  <TableHead>Data</TableHead>
                  <TableHead>Animal</TableHead>
                  <TableHead>Proponente</TableHead>
                  <TableHead>Valor Ofertado</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma proposta encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOffers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell className="text-xs">
                        {new Date(offer.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           {offer.animal?.photos?.[0] ? (
                             <OptimizedImage 
                               src={offer.animal.photos[0]} 
                               alt="" 
                               width={96}
                               aspectRatio="landscape"
                               className="h-8 w-11 rounded" 
                             />
                           ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm">{offer.animal?.name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{offer.animal?.breed}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{offer.profiles?.full_name}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Phone className="h-3 w-3" /> {offer.profiles?.phone}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Mail className="h-3 w-3" /> {offer.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-sm text-emerald-600">
                        {formatBRL(offer.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={offer.description}>
                          {offer.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                           offer.status === 'approved' ? 'default' :
                           offer.status === 'rejected' ? 'destructive' :
                           offer.status === 'under_review' ? 'outline' : 'secondary'
                        } className="flex w-fit items-center gap-1">
                           {offer.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                           {offer.status === 'rejected' && <XCircle className="h-3 w-3" />}
                           {offer.status === 'under_review' && <AlertCircle className="h-3 w-3" />}
                           {offer.status === 'pending' && <Clock className="h-3 w-3" />}
                           {offer.status === 'pending' ? 'Pendente' :
                            offer.status === 'approved' ? 'Aprovada' :
                            offer.status === 'under_review' ? 'Em Análise' : 'Rejeitada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(offer.status === 'pending' || offer.status === 'under_review') && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                               onClick={() => handleUpdateStatus(offer, 'approved')}
                            >
                              Aprovar
                            </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
                               onClick={() => handleUpdateStatus(offer, 'under_review')}
                             >
                               Analisar
                             </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               className="h-8 text-destructive hover:bg-destructive/5"
                               onClick={() => handleUpdateStatus(offer, 'rejected')}
                             >
                               Rejeitar
                             </Button>
                          </div>
                        )}
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