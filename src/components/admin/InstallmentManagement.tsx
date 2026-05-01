 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { toast } from "sonner";
 import { Loader2, Search, Filter, ExternalLink, CheckCircle, XCircle, FileText, User, Calendar, Printer, Save, Edit2, RefreshCw, MessageCircle, Send } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { formatBRL } from "@/utils/format";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { CarnetGenerator } from "@/components/payment/CarnetGenerator";
 
 export function InstallmentManagement() {
   const [installments, setInstallments] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [editingId, setEditingId] = useState<string | null>(null);
   const [newDueDate, setNewDueDate] = useState("");
   const [selectedCarnet, setSelectedCarnet] = useState<any>(null);
   const [siteInfo, setSiteInfo] = useState<any>(null);
   const [isReconciling, setIsReconciling] = useState(false);
 
   useEffect(() => {
     fetchInstallments();
     fetchSiteInfo();
   }, []);
 
   const fetchSiteInfo = async () => {
     const { data } = await supabase.from("site_settings").select("*").single();
     setSiteInfo(data);
   };
 
   const fetchInstallments = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("installments")
         .select(`*, buyer:profiles!buyer_id(full_name, email, cpf), transaction:transactions(*, lot:lots(*, animal:animals(*)))`)
         .order("due_date", { ascending: true });
       
       if (error) throw error;
       setInstallments(data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar parcelas: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleReconciliation = async () => {
     setIsReconciling(true);
     try {
       const { data, error } = await supabase.functions.invoke('reconcile-payments');
       
       if (error) throw error;
       
       toast.success(`Reconciliação concluída! ${data.updated} parcelas atualizadas.`);
       fetchInstallments();
     } catch (error: any) {
       toast.error("Erro na reconciliação: " + error.message);
     } finally {
       setIsReconciling(false);
     }
   };
 
   const handleDueDateUpdate = async (id: string) => {
     try {
       const { error } = await supabase
         .from("installments")
         .update({ due_date: new Date(newDueDate).toISOString() })
         .eq("id", id);
       
       if (error) throw error;
       
       setInstallments(prev => prev.map(inst => 
         inst.id === id ? { ...inst, due_date: new Date(newDueDate).toISOString() } : inst
       ));
       setEditingId(null);
       toast.success("Vencimento atualizado!");
     } catch (error: any) {
       toast.error("Erro ao atualizar vencimento: " + error.message);
     }
   };
 
   const handlePrintCarnet = (inst: any) => {
     const lotInstallments = installments
       .filter(i => i.transaction_id === inst.transaction_id)
       .map(i => ({
         ...i,
         due_date: new Date(i.due_date)
       }));
     
     setSelectedCarnet({
       lot: inst.transaction?.lot,
       installments: lotInstallments,
       profile: inst.buyer
     });
   };
 
   const handleActualPrint = () => {
     const printWindow = window.open('', '_blank');
     if (!printWindow) return;
     const content = document.getElementById('admin-printable-carnet')?.innerHTML;
     printWindow.document.write(`
       <html>
         <head>
           <title>Reimpressão de Carnê</title>
           <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
           <style>@media print { body { margin: 0; padding: 0; } .no-print { display: none; } }</style>
         </head>
         <body onload="window.print(); window.close();">${content}</body>
       </html>
     `);
     printWindow.document.close();
   };
 
   const handleWhatsAppNotify = (inst: any) => {
     const message = `Olá ${inst.buyer?.full_name}, informamos que realizamos a baixa da parcela ${inst.installment_number} no valor de ${formatBRL(inst.amount)}. Obrigado pela confiança!`;
     const phone = inst.buyer?.phone?.replace(/\D/g, '');
     if (phone) {
       window.open(`https://wa.me/${phone.startsWith('55') ? '' : '55'}${phone}?text=${encodeURIComponent(message)}`, '_blank');
     } else {
       toast.error("Comprador sem telefone cadastrado.");
     }
   };
 
   const handleManualNotify = async (inst: any) => {
     try {
       const { error } = await supabase
         .from("notifications")
         .insert({
           user_id: inst.buyer_id,
           title: "Baixa de Parcela Efetuada",
           message: `A baixa da parcela ${inst.installment_number} foi realizada manualmente pelo administrador.`,
           link: "/painel"
         });
       
       if (error) throw error;
       toast.success("Notificação enviada ao comprador!");
     } catch (error: any) {
       toast.error("Erro ao enviar notificação: " + error.message);
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
              <Button 
                variant="default" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" 
                onClick={handleReconciliation}
                disabled={isReconciling}
              >
                {isReconciling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                RECONCILIAR
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
                 <TableRow key={inst.id} className="group">
                   <TableCell className="text-xs font-mono">
                     {editingId === inst.id ? (
                       <div className="flex items-center gap-1">
                         <Input 
                           type="date" 
                           className="h-7 text-[10px] w-32" 
                           value={newDueDate} 
                           onChange={(e) => setNewDueDate(e.target.value)}
                         />
                         <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDueDateUpdate(inst.id)}>
                           <Save className="h-3 w-3" />
                         </Button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2">
                         {new Date(inst.due_date).toLocaleDateString('pt-BR')}
                         <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => {
                           setEditingId(inst.id);
                           setNewDueDate(new Date(inst.due_date).toISOString().split('T')[0]);
                         }}>
                           <Edit2 className="h-3 w-3" />
                         </Button>
                       </div>
                     )}
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
                       <Dialog>
                         <DialogTrigger asChild>
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-8 w-8 p-0"
                             onClick={() => handlePrintCarnet(inst)}
                             title="Reimprimir Carnê"
                           >
                             <Printer className="h-4 w-4" />
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                           <DialogHeader>
                             <div className="flex justify-between items-center pr-8">
                               <DialogTitle>Reimpressão de Carnê</DialogTitle>
                               <Button onClick={handleActualPrint} className="bg-gold text-emerald-deep font-bold gap-2">
                                 <Printer className="h-4 w-4" /> IMPRIMIR AGORA
                               </Button>
                             </div>
                           </DialogHeader>
                           <div id="admin-printable-carnet">
                             {selectedCarnet && (
                               <CarnetGenerator 
                                 lot={selectedCarnet.lot}
                                 installments={selectedCarnet.installments}
                                 profile={selectedCarnet.profile}
                                 siteInfo={siteInfo}
                                 pixKey="Ver painel" 
                               />
                             )}
                           </div>
                         </DialogContent>
                       </Dialog>
                        <div className="flex gap-1">
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleWhatsAppNotify(inst)}
                            title="Notificar via WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            onClick={() => handleManualNotify(inst)}
                            title="Notificar no Painel"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
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