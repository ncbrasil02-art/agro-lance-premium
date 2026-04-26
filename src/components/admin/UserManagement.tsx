 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Search, CheckCircle, XCircle, Loader2, Info, UserCheck, Shield, Clock, History, Download, ShieldAlert, ShieldCheck as ShieldCheckIcon } from "lucide-react";
 import { toast } from "sonner";
 import { Badge } from "@/components/ui/badge";
 import { useAuth } from "@/components/auth/auth-provider";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 
 export function UserManagement() {
   const [selectedUserLogs, setSelectedUserLogs] = useState<any[]>([]);
   const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
   const [isLoadingLogs, setIsLoadingLogs] = useState(false);
 
   const fetchUserLogs = async (userId: string) => {
     setIsLoadingLogs(true);
     setIsLogsDialogOpen(true);
     try {
       const { data, error } = await supabase
         .from("audit_logs")
         .select(`
           *,
           admin:profiles!user_id(full_name)
         `)
         .eq("entity_id", userId)
         .eq("entity_type", "profile")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setSelectedUserLogs(data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar logs: " + error.message);
     } finally {
       setIsLoadingLogs(false);
     }
   };
 
   const exportToCSV = () => {
     const headers = ["Nome", "CPF", "Telefone", "Papel", "Aprovado", "Data Cadastro"];
     const data = filteredUsers.map(user => [
       user.full_name,
       user.cpf,
       user.phone,
       user.role === 'admin' ? 'Administrador' : 'Licitante',
       user.is_approved ? 'Sim' : 'Não',
       format(new Date(user.created_at), "dd/MM/yyyy HH:mm")
     ]);
 
     const csvContent = [
       headers.join(","),
       ...data.map(row => row.join(","))
     ].join("\n");
 
     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
     const link = document.createElement("a");
     const url = URL.createObjectURL(blob);
     link.setAttribute("href", url);
     link.setAttribute("download", `licitantes_${format(new Date(), "yyyy-MM-dd")}.csv`);
     link.style.visibility = "hidden";
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
   };
   const { profile: adminProfile } = useAuth();
   const [isLoading, setIsLoading] = useState(true);
   const [users, setUsers] = useState<any[]>([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [filter, setFilter] = useState<"all" | "pending" | "approved" | "blocked">("all");
   const handleToggleBlock = async (userId: string, currentBlockedStatus: boolean) => {
     try {
       const newStatus = !currentBlockedStatus;
       const { error } = await supabase
         .from("profiles")
         .update({ 
           is_blocked: newStatus,
           block_reason: newStatus ? "Bloqueado manualmente pelo administrador" : null
         })
         .eq("id", userId);
 
       if (error) throw error;
 
       await supabase.from("audit_logs").insert({
         user_id: adminProfile?.id,
         action: newStatus ? "BLOCK_USER" : "UNBLOCK_USER",
         entity_type: "profile",
         entity_id: userId,
         new_data: { is_blocked: newStatus }
       });
 
       toast.success(newStatus ? "Usuário bloqueado" : "Usuário desbloqueado");
       fetchUsers();
     } catch (error: any) {
       toast.error("Erro ao atualizar status: " + error.message);
     }
   };
 
 
   const fetchUsers = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("profiles")
         .select(`
           *,
           approver:profiles!approved_by(full_name)
         `)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setUsers(data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar usuários: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     fetchUsers();
   }, []);
 
   const handleToggleApproval = async (userId: string, currentStatus: boolean) => {
     try {
       const newStatus = !currentStatus;
       const { error } = await supabase
         .from("profiles")
         .update({ 
           is_approved: newStatus,
           approved_by: newStatus ? adminProfile?.id : null,
           approved_at: newStatus ? new Date().toISOString() : null
         })
         .eq("id", userId);
 
       if (error) throw error;
       
       // Record in audit log
       await supabase.from("audit_logs").insert({
         user_id: adminProfile?.id,
         action: newStatus ? "APPROVE_USER" : "DISAPPROVE_USER",
         entity_type: "profile",
         entity_id: userId,
         new_data: { is_approved: newStatus }
       });
 
       toast.success(newStatus ? "Usuário aprovado com sucesso" : "Aprovação removida");
       fetchUsers();
     } catch (error: any) {
       toast.error("Erro ao atualizar status: " + error.message);
     }
   };
 
   const filteredUsers = users.filter(user => {
     const matchesSearch = 
       user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.cpf?.includes(searchQuery) ||
       user.phone?.includes(searchQuery);
     
     const matchesFilter = 
       filter === "all" || 
       (filter === "pending" && !user.is_approved && !user.is_blocked) || 
       (filter === "approved" && user.is_approved && !user.is_blocked) ||
       (filter === "blocked" && user.is_blocked);
           <Button 
             variant={filter === "blocked" ? "default" : "outline"} 
             size="sm" 
             onClick={() => setFilter("blocked")}
             className={filter === "blocked" ? "bg-destructive text-white" : ""}
           >
             Bloqueados
           </Button>
 
     return matchesSearch && matchesFilter;
   });
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div className="flex items-center gap-2">
           <Button 
             variant={filter === "all" ? "default" : "outline"} 
             size="sm" 
             onClick={() => setFilter("all")}
             className={filter === "all" ? "bg-gold text-emerald-deep" : ""}
           >
             Todos
           </Button>
           <Button 
             variant={filter === "pending" ? "default" : "outline"} 
             size="sm" 
             onClick={() => setFilter("pending")}
             className={filter === "pending" ? "bg-gold text-emerald-deep" : ""}
           >
             Pendentes
           </Button>
           <Button 
             variant={filter === "approved" ? "default" : "outline"} 
             size="sm" 
             onClick={() => setFilter("approved")}
             className={filter === "approved" ? "bg-gold text-emerald-deep" : ""}
           >
             Aprovados
           </Button>
         </div>
         <div className="relative flex-1 max-w-md">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar por nome, CPF ou telefone..."
             className="pl-10"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
         </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
            </Button>
          </div>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>Gestão de Usuários</CardTitle>
           <CardDescription>
             Aprove ou bloqueie usuários para participar dos leilões.
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="rounded-md border overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted/50">
                   <TableHead className="font-bold">Usuário</TableHead>
                   <TableHead className="font-bold">CPF / Telefone</TableHead>
                   <TableHead className="font-bold">Cadastro</TableHead>
                   <TableHead className="font-bold">Status / Risco</TableHead>
                   <TableHead className="font-bold">Audit. Aprovação</TableHead>
                   <TableHead className="text-right font-bold">Ações</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {isLoading ? (
                   <TableRow>
                     <TableCell colSpan={6} className="h-24 text-center">
                       <Loader2 className="h-6 w-6 animate-spin mx-auto text-gold" />
                     </TableCell>
                   </TableRow>
                 ) : filteredUsers.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                       Nenhum usuário encontrado.
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredUsers.map((user) => (
                     <TableRow key={user.id} className="hover:bg-muted/30">
                       <TableCell>
                         <div className="flex flex-col">
                           <span className="font-medium">{user.full_name}</span>
                           <span className="text-xs text-muted-foreground">{user.role === 'admin' ? 'Administrador' : 'Licitante'}</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex flex-col text-sm">
                           <span>{user.cpf || "CPF não informado"}</span>
                           <span className="text-muted-foreground">{user.phone || "Sem telefone"}</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex flex-col text-sm">
                           <span>{format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                           <span className="text-xs text-muted-foreground">{format(new Date(user.created_at), "HH:mm", { locale: ptBR })}</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex flex-col gap-1">
                           {user.is_blocked ? (
                             <Badge variant="destructive" className="flex w-fit items-center gap-1">
                               <ShieldAlert className="h-3 w-3" /> Bloqueado
                             </Badge>
                           ) : user.is_approved ? (
                             <Badge className="bg-emerald-500 hover:bg-emerald-600">Aprovado</Badge>
                           ) : (
                             <Badge variant="outline" className="text-amber-500 border-amber-500">Pendente</Badge>
                           )}
                           {user.block_reason && (
                             <span className="text-[10px] text-destructive italic max-w-[150px] truncate" title={user.block_reason}>
                               {user.block_reason}
                             </span>
                           )}
                         </div>
                       </TableCell>
                       <TableCell>
                         {user.is_approved && user.approved_at ? (
                           <div className="flex flex-col text-xs space-y-1">
                             <div className="flex items-center gap-1 text-muted-foreground">
                               <UserCheck className="h-3 w-3 text-gold" />
                               <span>{user.approver?.full_name || "Admin"}</span>
                             </div>
                             <div className="flex items-center gap-1 text-muted-foreground">
                               <Clock className="h-3 w-3" />
                               <span>{format(new Date(user.approved_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                             </div>
                           </div>
                         ) : (
                           <span className="text-xs text-muted-foreground italic">-</span>
                         )}
                       </TableCell>
                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleBlock(user.id, user.is_blocked)}
                                  className={user.is_blocked ? "text-emerald-500 hover:bg-emerald-50" : "text-destructive hover:bg-destructive/10"}
                                >
                                  {user.is_blocked ? <ShieldCheckIcon className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.is_blocked ? "Desbloquear Usuário" : "Bloquear Usuário"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchUserLogs(user.id)}
                            className="text-muted-foreground"
                          >
                            <History className="h-5 w-5" />
                          </Button>
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={() => handleToggleApproval(user.id, user.is_approved)}
                                 className={user.is_approved ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"}
                               >
                                 {user.is_approved ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>{user.is_approved ? "Remover Aprovação" : "Aprovar Usuário"}</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
         </CardContent>
        </Card>
 
        <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Histórico de Auditoria</DialogTitle>
              <DialogDescription>
                Ações realizadas neste perfil.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {isLoadingLogs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
              ) : selectedUserLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado.</p>
              ) : (
                selectedUserLogs.map((log) => (
                  <div key={log.id} className="flex flex-col p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={log.action === 'APPROVE_USER' ? 'text-emerald-500 border-emerald-500' : 'text-amber-500 border-amber-500'}>
                        {log.action === 'APPROVE_USER' ? 'Aprovação' : 'Revogação'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck className="h-4 w-4 text-gold" />
                      <span className="font-medium">{log.admin?.full_name || 'Sistema'}</span>
                    </div>
                    {log.ip_address && (
                      <span className="text-[10px] text-muted-foreground mt-1 italic">IP: {log.ip_address}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }