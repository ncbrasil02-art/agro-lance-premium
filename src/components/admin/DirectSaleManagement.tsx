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
   Search, 
   Package, 
   User, 
   Phone, 
   Mail, 
   MapPin,
    Loader2,
    Filter
 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function DirectSaleManagement() {
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("direct_sales")
        .select("*, animals(name, breed, photos)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar vendas: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from("direct_sales")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Pedido ${status === 'confirmed' ? 'confirmado' : 'cancelado'} com sucesso!`);
      fetchSales();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

   const filteredSales = sales.filter(sale => {
     const matchesSearch = sale.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sale.animals?.name?.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
     return matchesSearch && matchesStatus;
   });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
       <div className="flex flex-1 items-center gap-4 max-w-2xl">
         <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
           <Filter className="h-3 w-3 ml-2 text-muted-foreground" />
           <Select value={statusFilter} onValueChange={setStatusFilter}>
             <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 w-[140px] text-xs">
               <SelectValue placeholder="Status Venda" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Todas as Vendas</SelectItem>
               <SelectItem value="pending">Pendentes</SelectItem>
               <SelectItem value="confirmed">Confirmadas</SelectItem>
               <SelectItem value="cancelled">Canceladas</SelectItem>
             </SelectContent>
           </Select>
         </div>
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar por comprador ou animal..."
             className="pl-10"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
       </div>
        <Button variant="outline" onClick={fetchSales} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Atualizar Lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Venda Direta</CardTitle>
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
                  <TableHead>Comprador</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma solicitação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-xs">
                        {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {sale.animals?.photos?.[0] ? (
                            <OptimizedImage 
                              src={sale.animals.photos[0]} 
                              alt="" 
                              width={64}
                              aspectRatio="square"
                              className="h-8 w-8 rounded" 
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm">{sale.animals?.name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{sale.animals?.breed}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{sale.buyer_name}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Phone className="h-3 w-3" /> {sale.buyer_phone}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Mail className="h-3 w-3" /> {sale.buyer_email}
                          </div>
                          {sale.shipping_details?.address && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {sale.shipping_details.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          sale.status === 'confirmed' ? 'default' : 
                          sale.status === 'cancelled' ? 'destructive' : 'secondary'
                        } className="flex w-fit items-center gap-1">
                          {sale.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                          {sale.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                          {sale.status === 'pending' && <Clock className="h-3 w-3" />}
                          {sale.status === 'pending' ? 'Pendente' : 
                           sale.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {sale.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleUpdateStatus(sale.id, 'confirmed')}
                            >
                              Confirmar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-destructive hover:bg-destructive/5"
                              onClick={() => handleUpdateStatus(sale.id, 'cancelled')}
                            >
                              Cancelar
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