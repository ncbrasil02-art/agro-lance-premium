import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle2, XCircle, User, Phone, Shield } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: !currentStatus })
        .eq("id", userId);

      if (error) throw error;
      toast.success(currentStatus ? "Usuário desaprovado" : "Usuário aprovado com sucesso!");
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_approved: !currentStatus });
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.cpf?.includes(searchQuery) ||
    u.phone?.includes(searchQuery)
  );

  const viewDetails = (user: any) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários / Licitantes</CardTitle>
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
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "Sem nome"}</TableCell>
                      <TableCell>{user.cpf || "---"}</TableCell>
                      <TableCell>{user.phone || "---"}</TableCell>
                      <TableCell>
                        {user.is_approved ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Aprovado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/20">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase text-[10px]">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => viewDetails(user)}>
                          Detalhes
                        </Button>
                        <Button 
                          variant={user.is_approved ? "outline" : "default"} 
                          size="sm"
                          className={!user.is_approved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                          onClick={() => toggleApproval(user.id, user.is_approved)}
                        >
                          {user.is_approved ? "Bloquear" : "Aprovar"}
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Licitante</DialogTitle>
            <DialogDescription>
              Informações completas de cadastro do usuário.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.full_name}</h3>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">{selectedUser.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">CPF / CNPJ</p>
                  <p className="font-semibold">{selectedUser.cpf || "Não informado"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Telefone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gold" />
                    <p className="font-semibold">{selectedUser.phone || "Não informado"}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">ID do Sistema</p>
                  <p className="text-[10px] font-mono break-all">{selectedUser.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Cadastro em</p>
                  <p className="font-semibold">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${selectedUser.is_approved ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <div className="flex items-center gap-3">
                  {selectedUser.is_approved ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Shield className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-bold">{selectedUser.is_approved ? "Licitante Liberado" : "Aguardando Aprovação"}</p>
                    <p className="text-xs text-muted-foreground">O usuário {selectedUser.is_approved ? 'pode' : 'não pode'} dar lances no momento.</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant={selectedUser.is_approved ? "destructive" : "default"}
                  className={!selectedUser.is_approved ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  onClick={() => toggleApproval(selectedUser.id, selectedUser.is_approved)}
                >
                  {selectedUser.is_approved ? "Bloquear" : "Aprovar Agora"}
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}