import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Mail, Bell, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { WebhookMonitor } from "./WebhookMonitor";

export function SecurityAlerts() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar logs: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"><CheckCircle className="h-3 w-3" /> ENVIADO</Badge>;
      case 'simulated_no_key':
        return <Badge variant="outline" className="text-amber-600 border-amber-200 gap-1"><Clock className="h-3 w-3" /> SIMULADO (SEM KEY)</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"><AlertTriangle className="h-3 w-3" /> FALHA</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm border border-red-200">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-red-900">Centro de Alertas de Segurança</h2>
          <p className="text-muted-foreground text-sm font-medium">Monitoramento em tempo real de vulnerabilidades, falhas técnicas e auditoria de segurança.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-red-100 shadow-md">
          <CardHeader className="bg-red-50/50 border-b border-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg font-bold text-red-900">LOG DE NOTIFICAÇÕES CRÍTICAS</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription className="font-medium">Histórico de e-mails de segurança enviados para administradores.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">Data</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Evento</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-red-500" />
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-medium">
                        Nenhum alerta de segurança registrado ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-red-50/30 transition-colors">
                        <TableCell className="text-[10px] font-mono whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-xs uppercase text-red-800">{log.title}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1 italic">{log.recipient_email}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(log.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-md">
          <CardHeader className="bg-amber-50/50 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg font-bold text-amber-900">WEBHOOKS EM FALHA</CardTitle>
            </div>
            <CardDescription className="font-medium">Eventos que falharam e precisam de atenção imediata para conciliação.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <WebhookMonitor />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}