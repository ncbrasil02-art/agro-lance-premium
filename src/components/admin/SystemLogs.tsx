 import React, { useEffect, useState } from "react";
 import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
 import { supabase } from "@/integrations/supabase/client";
  import { AlertCircle, Terminal, Trash2, RefreshCcw, Zap } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { toast } from "sonner";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
 export function SystemLogs() {
   const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReconciling, setIsReconciling] = useState(false);

    const handleReconcile = async () => {
      setIsReconciling(true);
      const toastId = toast.loading("Reconciliando falhas do sistema...");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reconcile-failures`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error("Falha na reconciliação");

        const result = await response.json();
        toast.success(`Reconciliação concluída! Webhooks: ${result.webhooks.succeeded}, Notificações: ${result.notifications.succeeded}, Boletas: ${result.installments.reconciled}`, { id: toastId });
        fetchLogs();
      } catch (error: any) {
        console.error("Reconciliation error:", error);
        toast.error("Erro ao reconciliar: " + error.message, { id: toastId });
      } finally {
        setIsReconciling(false);
      }
    };

    const fetchLogs = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("db_errors")
         .select("*")
         .order("created_at", { ascending: false })
         .limit(50);
       
       if (error) throw error;
       setLogs(data || []);
     } catch (error) {
       console.error("Error fetching logs:", error);
       toast.error("Falha ao carregar logs de sistema.");
     } finally {
       setIsLoading(false);
     }
   };
 
   const clearLogs = async () => {
     if (!confirm("Tem certeza que deseja limpar todos os logs de erro?")) return;
     
     try {
       const { error } = await supabase.from("db_errors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
       if (error) throw error;
       toast.success("Logs limpos com sucesso.");
       setLogs([]);
     } catch (error) {
       console.error("Error clearing logs:", error);
       toast.error("Falha ao limpar logs.");
     }
   };
 
   useEffect(() => {
     fetchLogs();
   }, []);
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Monitor de Falhas</h2>
           <p className="text-muted-foreground text-sm">Acompanhe erros críticos capturados pela blindagem do sistema.</p>
         </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gold/50 text-gold hover:bg-gold/10" 
              onClick={handleReconcile} 
              disabled={isReconciling}
            >
              <Zap className={`mr-2 h-4 w-4 ${isReconciling ? 'animate-pulse' : ''}`} /> 
              Reconciliar Falhas
            </Button>
           <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
             <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
           </Button>
           <Button variant="destructive" size="sm" onClick={clearLogs}>
             <Trash2 className="mr-2 h-4 w-4" /> Limpar Logs
           </Button>
         </div>
       </div>
 
       <Card>
         <CardContent className="p-0">
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="bg-muted/50 border-b">
                   <th className="p-4 text-left font-medium">Data/Hora</th>
                   <th className="p-4 text-left font-medium">Origem</th>
                   <th className="p-4 text-left font-medium">Mensagem</th>
                   <th className="p-4 text-left font-medium">Contexto</th>
                 </tr>
               </thead>
               <tbody>
                 {logs.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="p-12 text-center text-muted-foreground italic">
                       Nenhum erro registrado recentemente. O sistema está operando normalmente.
                     </td>
                   </tr>
                 ) : (
                   logs.map((log) => (
                     <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                       <td className="p-4 whitespace-nowrap text-xs">
                         {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                       </td>
                       <td className="p-4">
                         <span className="px-2 py-1 rounded bg-secondary text-[10px] font-bold uppercase font-mono">
                           {log.function_name}
                         </span>
                       </td>
                       <td className="p-4 font-medium text-destructive">
                         <div className="flex items-center gap-2">
                           <AlertCircle className="h-3 w-3 shrink-0" />
                           {log.error_message}
                         </div>
                       </td>
                       <td className="p-4 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground text-[10px] font-mono">
                         {log.error_context}
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }