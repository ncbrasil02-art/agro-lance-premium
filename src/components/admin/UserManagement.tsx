import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, CheckCircle, XCircle, Shield, User } from "lucide-react";
import { toast } from "sonner";

export function UserManagement({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (val: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
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

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.cpf?.includes(searchQuery) ||
    user.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato/CPF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}