import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, CheckCircle, XCircle, Shield, User, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export function UserManagement({ 
  searchQuery, 
  onSearchChange,
  currentPage,
  onPageChange,
  sortColumn,
  sortDirection,
  onSortChange
}: { 
  searchQuery: string; 
  onSearchChange: (val: string) => void;
  currentPage: number;
  onPageChange: (val: number) => void;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSortChange: (col: string, dir: "asc" | "desc") => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const ITEMS_PER_PAGE = 8;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" });

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,cpf.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order(sortColumn, { ascending: sortDirection === "asc" })
        .range(from, to);

      if (error) throw error;
      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setSelectedIds([]);
  }, [currentPage, searchQuery, sortColumn, sortDirection]);
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkApproval = async (approve: boolean) => {
    const action = approve ? "aprovar" : "remover o acesso de";
    if (!confirm(`Deseja ${action} os ${selectedIds.length} usuários selecionados?`)) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: approve })
        .in("id", selectedIds);

      if (error) throw error;
      
      toast.success(`${selectedIds.length} usuários ${approve ? 'aprovados' : 'com acesso removido'} com sucesso!`);
      setSelectedIds([]);
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro na ação em lote: " + error.message);
    }
  };


  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      onSortChange(column, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(column, "asc");
    }
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp className="ml-2 h-3 w-3" /> : <ChevronDown className="ml-2 h-3 w-3" />;
  };


  const handleToggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: !currentStatus })
        .eq("id", userId);

      if (error) throw error;
      
      toast.success(currentStatus ? "Aprovação removida" : "Usuário aprovado com sucesso!");
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative">
         {selectedIds.length > 0 && (
           <div className="absolute inset-0 bg-emerald-deep/95 z-20 rounded-lg flex items-center px-4 animate-in fade-in slide-in-from-top-2 border border-gold/30">
             <div className="flex items-center gap-3">
               <span className="text-xs font-black text-white uppercase tracking-widest">{selectedIds.length} selecionados</span>
               <div className="h-4 w-px bg-white/20" />
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 text-gold hover:bg-gold/10 text-[10px] font-bold"
                 onClick={() => handleBulkApproval(true)}
               >
                 <CheckCircle className="mr-2 h-3.5 w-3.5" /> Aprovar Selecionados
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-8 text-white/80 hover:bg-white/10 text-[10px] font-bold"
                 onClick={() => handleBulkApproval(false)}
               >
                 <XCircle className="mr-2 h-3.5 w-3.5" /> Remover Acesso
               </Button>
             </div>
             <Button 
               variant="ghost" 
               size="sm" 
               className="ml-auto text-white/60 hover:text-white text-[10px] font-bold"
               onClick={() => setSelectedIds([])}
             >
               Cancelar
             </Button>
           </div>
         )}

        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Lista"}
        </Button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou celular..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('full_name')}>
                      <div className="flex items-center">Nome <SortIndicator column="full_name" /></div>
                    </TableHead>
                    <TableHead>Contato/CPF</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('is_approved')}>
                      <div className="flex items-center">Status <SortIndicator column="is_approved" /></div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                  users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {user.full_name}
                                {user.role === 'admin' && <Shield className="h-3 w-3 text-gold" />}
                              </div>
                              <div className="text-[10px] text-muted-foreground">ID: ...{user.id.slice(-6)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">{user.phone || "Sem celular"}</div>
                          <div className="text-[10px] text-muted-foreground">{user.cpf || "Sem CPF"}</div>
                        </TableCell>
                        <TableCell>
                          {user.is_approved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 uppercase">
                              <CheckCircle className="h-3 w-3" /> Aprovado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 uppercase">
                              <XCircle className="h-3 w-3" /> Pendente
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant={user.is_approved ? "outline" : "default"} 
                            size="sm" 
                            className={`h-8 ${!user.is_approved ? 'bg-gold text-emerald-deep hover:bg-gold/90' : ''}`}
                            onClick={() => handleToggleApproval(user.id, user.is_approved)}
                          >
                            {user.is_approved ? "Remover Acesso" : "Aprovar Licitante"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t gap-4">
                  <div className="text-xs text-muted-foreground order-2 sm:order-1">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} até {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount} registros
                  </div>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-xs font-medium">Página {currentPage} de {totalPages}</div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
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