import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function EventRequestManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar pedidos: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este pedido?")) return;
    try {
      const { error } = await supabase.from("event_requests").delete().eq("id", id);
      if (error) throw error;
      toast.success("Pedido excluído");
      fetchRequests();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("event_requests").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success("Status atualizado");
      fetchRequests();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Pedidos de Realização de Eventos
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome / Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Qtd / Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="text-xs">
                        {format(new Date(req.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {req.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-bold">
                          <a 
                            href={`https://wa.me/${req.whatsapp.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-500 hover:underline"
                          >
                            {req.whatsapp}
                          </a>
                        </div>
                        <div className="text-muted-foreground">{req.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{req.category}</div>
                        <div className="text-muted-foreground font-medium">{req.location}</div>
                        {req.additional_info && (
                          <div className="mt-1 text-[10px] text-muted-foreground italic border-l-2 border-gold/30 pl-2">
                            {req.additional_info}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{req.estimated_animals || '--'}</div>
                        <div className="text-muted-foreground">{req.estimated_date || '--'}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {req.status === 'pending' ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          {req.status === 'pending' ? 'Pendente' : 'Atendido'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {req.status === 'pending' && (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(req.id, 'completed')} title="Marcar como Atendido">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(req.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}