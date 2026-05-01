 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { toast } from "sonner";
 import { Loader2, Search, Filter, ArrowRight, ExternalLink } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 
 export function TransactionManagement() {
   const [transactions, setTransactions] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
 
   useEffect(() => {
     fetchTransactions();
   }, []);
 
   const fetchTransactions = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("transactions")
         .select(`
           *,
           lot:lots(title),
           buyer:profiles!buyer_id(full_name, email),
           seller:profiles!seller_id(full_name),
           gateway:payment_gateways(label)
         `)
         .order("created_at", { ascending: false });
       
       if (error) throw error;
       setTransactions(data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar transações: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   const getStatusBadge = (status: string) => {
     const colors: Record<string, string> = {
       pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
       paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
       cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
       refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20"
     };
     return <Badge className={colors[status] || ""}>{status.toUpperCase()}</Badge>;
   };
 
   const filteredTransactions = transactions.filter(t => 
     t.buyer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.lot?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.gateway_reference?.toLowerCase().includes(searchTerm.toLowerCase())
   );
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="text-xl font-bold uppercase">Gestão de Transações</CardTitle>
             <CardDescription>Acompanhe o status dos pagamentos e recebimentos.</CardDescription>
           </div>
           <div className="flex gap-2">
             <div className="relative">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Buscar comprador, lote..." 
                 className="pl-8 w-[300px]"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <Button variant="outline" size="icon" onClick={fetchTransactions}>
               <Filter className="h-4 w-4" />
             </Button>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="flex justify-center p-12">
             <Loader2 className="h-8 w-8 animate-spin text-gold" />
           </div>
         ) : (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>DATA</TableHead>
                 <TableHead>COMPRADOR</TableHead>
                 <TableHead>LOTE</TableHead>
                 <TableHead>VALOR</TableHead>
                 <TableHead>GATEWAY</TableHead>
                 <TableHead>STATUS</TableHead>
                 <TableHead>AÇÕES</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredTransactions.map((t) => (
                 <TableRow key={t.id}>
                   <TableCell className="text-xs">
                     {new Date(t.created_at).toLocaleDateString()}
                   </TableCell>
                   <TableCell>
                     <p className="font-bold text-xs uppercase">{t.buyer?.full_name}</p>
                     <p className="text-[10px] text-muted-foreground">{t.buyer?.email}</p>
                   </TableCell>
                   <TableCell className="text-xs uppercase font-medium">{t.lot?.title}</TableCell>
                   <TableCell className="font-mono text-xs">
                     R$ {t.final_price?.toLocaleString()}
                   </TableCell>
                   <TableCell>
                     <Badge variant="outline" className="text-[10px] uppercase">
                       {t.gateway?.label || t.payment_method || 'PENDENTE'}
                     </Badge>
                   </TableCell>
                   <TableCell>{getStatusBadge(t.payment_status || 'pending')}</TableCell>
                   <TableCell>
                     <div className="flex gap-2">
                       {t.checkout_url && (
                         <Button size="sm" variant="ghost" asChild title="Ver no Gateway">
                           <a href={t.checkout_url} target="_blank" rel="noopener noreferrer">
                             <ExternalLink className="h-4 w-4" />
                           </a>
                         </Button>
                       )}
                       <Button size="sm" variant="ghost" title="Detalhes">
                         <ArrowRight className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
               {filteredTransactions.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">
                     Nenhuma transação encontrada.
                   </TableCell>
                 </TableRow>
               )}
             </TableBody>
           </Table>
         )}
       </CardContent>
     </Card>
   );
 }