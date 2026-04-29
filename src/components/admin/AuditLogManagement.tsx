import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, RefreshCcw, Filter, User, Calendar, Database, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AuditLogManagement() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          admin:profiles!audit_logs_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar auditoria: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  const filteredLogs = logs.filter(log => 
    log.admin?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_id?.includes(searchQuery)
  );

  const getActionBadgeColor = (action: string) => {
    if (action.includes("BLOCK") || action.includes("DELETE")) return "destructive";
    if (action.includes("APPROVE") || action.includes("CREATE") || action.includes("PLACE_BID")) return "bg-emerald-500 text-white";
    if (action.includes("UPDATE")) return "bg-amber-500 text-white";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auditoria do Sistema</h2>
          <p className="text-muted-foreground text-sm">Rastreamento detalhado de todas as ações administrativas e críticas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por admin, ação ou ID da entidade..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="all">Todas as Entidades</option>
          <option value="profile">Perfis</option>
          <option value="bid">Lances</option>
          <option value="lot">Lotes</option>
          <option value="event">Eventos</option>
        </select>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">Todas as Ações</option>
          <option value="PLACE_BID">Lances</option>
          <option value="APPROVE_USER">Aprovação</option>
          <option value="BLOCK_USER">Bloqueio</option>
          <option value="UPDATE">Atualização</option>
          <option value="DELETE">Exclusão</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[180px]">Data/Hora</TableHead>
                  <TableHead>Administrador / Autor</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>IP / Sessão</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-gold" />
                      <p className="mt-2 text-sm text-muted-foreground">Carregando trilha de auditoria...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono">
                        <div className="flex flex-col">
                          <span>{format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                          <span className="text-muted-foreground">{format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{log.admin?.full_name || "Sistema / Automático"}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{log.user_id?.split('-')[0]}...</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeColor(log.action) as any} className="text-[10px] uppercase font-bold">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold uppercase text-emerald-600">{log.entity_type}</span>
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]" title={log.entity_id}>
                              {log.entity_id?.split('-')[0]}...
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">
                        {log.ip_address || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-white">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-gold" />
                                Detalhes do Registro de Auditoria
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 bg-muted/30 rounded-lg">
                                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Ação</p>
                                  <p className="font-bold">{log.action}</p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg">
                                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Entidade</p>
                                  <p className="font-bold">{log.entity_type} ({log.entity_id})</p>
                                </div>
                              </div>
                              
                              {log.old_data && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Dados Anteriores</p>
                                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-auto max-h-[150px] font-mono">
                                    {JSON.stringify(log.old_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {log.new_data && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Novos Dados / Payload</p>
                                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs overflow-auto max-h-[150px] font-mono">
                                    {JSON.stringify(log.new_data, null, 2)}
                                  </pre>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-4">
                                <span>ID do Log: {log.id}</span>
                                <span>Gerado em: {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}</span>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}