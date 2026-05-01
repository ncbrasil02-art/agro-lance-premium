 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { toast } from "sonner";
 import { Loader2, Search, Filter, ExternalLink, CheckCircle, XCircle, FileText, User } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { formatBRL } from "@/utils/format";
 
 export function InstallmentManagement() {
   const [installments, setInstallments] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
 
   useEffect(() => {
     fetchInstallments();
   }, []);
 
   const fetchInstallments = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("installments")
         .select(`
           *,
           buyer:profiles!buyer_id(full_name, email)
         `)
         .order("due_date", { ascending: true });
       
       if (error) throw error;
       setInstallments(data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar parcelas: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleStatusUpdate = async (id: string, newStatus: string) => {
     try {
       const { error } = await supabase
         .from("installments")
         .update({ 
           status: newStatus,
           paid_at: newStatus === 'paid' ? new Date().toISOString() : null
         })
         .eq("id", id);
       
       if (error) throw error;
       
       setInstallments(prev => prev.map(inst => 
         inst.id === id ? { ...inst, status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null } : inst
       ));
       
       toast.success(`Parcela marcada como ${newStatus === 'paid' ? 'PAGA' : 'PENDENTE'}!`);
     } catch (error: any) {
       toast.error("Erro ao atualizar status: " + error.message);
     }
   };
 
   const getStatusBadge = (status: string) => {
     const colors: Record<string, string> = {
       pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
       paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
       overdue: "bg-red-500/10 text-red-500 border-red-500/20",
       rejected: "bg-gray-500/10 text-gray-500 border-gray-500/20"
     };
     return <Badge className={colors[status] || ""}>{status?.toUpperCase() || 'PENDENTE'}</Badge>;
   };
 
   const filteredInstallments = installments.filter(inst => {
     const matchesSearch = inst.buyer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
     return matchesSearch && matchesStatus;
   });
 
   return (
     <Card>
       <CardHeader>
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <CardTitle className="text-xl font-bold uppercase flex items-center gap-2">
               <FileText className="h-5 w-5 text-gold" /> Gestão de Boletas (Carnê)
             </CardTitle>
             <CardDescription>Confirme pagamentos e gerencie as parcelas dos clientes.</CardDescription>
           </div>
           <div className="flex gap-2">
             <div className="relative">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Buscar comprador..." 
                 className="pl-8 w-[200px]"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <select 
               className="bg-background border rounded px-2 text-xs"
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
             >
               <option value="all">Todos Status</option>
               <option value="pending">Pendentes</option>
               <option value="paid">Pagos</option>
               <option value="overdue">Atrasados</option>
             </select>
             <Button variant="outline" size="icon" onClick={fetchInstallments}>
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
                 <TableHead>VENCIMENTO</TableHead>
                 <TableHead>PAGADOR</TableHead>
                 <TableHead>PARCELA</TableHead>
                 <TableHead>VALOR</TableHead>
                 <TableHead>COMPROVANTE</TableHead>
                 <TableHead>STATUS</TableHead>
                 <TableHead className="text-right">AÇÕES</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredInstallments.map((inst) => (
                 <TableRow key={inst.id}>
                   <TableCell className="text-xs font-mono">
                     {new Date(inst.due_date).toLocaleDateString('pt-BR')}
                   </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-2">
                       <User className="h-3 w-3 text-muted-foreground" />
                       <div>
                         <p className="font-bold text-xs uppercase leading-none">{inst.buyer?.full_name}</p>
                         <p className="text-[10px] text-muted-foreground">{inst.buyer?.email}</p>
                       </div>
                     </div>
                   </TableCell>
                   <TableCell className="text-xs font-bold">
                     {inst.installment_number}
                   </TableCell>
                   <TableCell className="font-mono text-xs font-bold text-emerald-700">
                     {formatBRL(inst.amount)}
                   </TableCell>
                   <TableCell>
                     {inst.proof_url ? (
                       <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" asChild>
                         <a href={inst.proof_url} target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="h-3 w-3" /> VER ANEXO
                         </a>
                       </Button>
                     ) : (
                       <span className="text-[10px] text-muted-foreground uppercase">Sem anexo</span>
                     )}
                   </TableCell>
                   <TableCell>{getStatusBadge(inst.status)}</TableCell>
                   <TableCell className="text-right">
                     <div className="flex justify-end gap-1">
                       {inst.status !== 'paid' && (
                         <Button 
                           size="sm" 
                           variant="outline" 
                           className="h-8 w-8 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                           onClick={() => handleStatusUpdate(inst.id, 'paid')}
                           title="Confirmar Pagamento (Baixa)"
                         >
                           <CheckCircle className="h-4 w-4" />
                         </Button>
                       )}
                       {inst.status === 'paid' && (
                         <Button 
                           size="sm" 
                           variant="outline" 
                           className="h-8 w-8 p-0 text-amber-600 border-amber-200 hover:bg-amber-50"
                           onClick={() => handleStatusUpdate(inst.id, 'pending')}
                           title="Reverter para Pendente"
                         >
                           <XCircle className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
               {filteredInstallments.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">
                     Nenhuma parcela encontrada.
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