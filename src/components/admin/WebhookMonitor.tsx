 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
 import { toast } from "sonner";
 
 export function WebhookMonitor() {
   const [events, setEvents] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [reprocessingId, setReprocessingId] = useState<string | null>(null);
 
   useEffect(() => {
     fetchEvents();
   }, []);
 
   const fetchEvents = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("webhook_events")
         .select("*")
         .order("created_at", { ascending: false })
         .limit(50);
       
       if (error) throw error;
       setEvents(data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar eventos: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleReprocess = async (event: any) => {
     setReprocessingId(event.id);
     try {
       // Re-invoke the appropriate webhook function with the stored payload
       const functionName = event.gateway_name === 'mercado_pago' ? 'mercado-pago-webhook' : 'pagbank-webhook';
       
       const { data, error } = await supabase.functions.invoke(functionName, {
         body: event.payload
       });
 
       if (error) throw error;
       
       toast.success("Evento reprocessado com sucesso!");
       fetchEvents();
     } catch (error: any) {
       toast.error("Erro ao reprocessar: " + error.message);
     } finally {
       setReprocessingId(null);
     }
   };
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case 'processed':
         return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"><CheckCircle className="h-3 w-3" /> SUCESSO</Badge>;
       case 'failed':
         return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1"><AlertTriangle className="h-3 w-3" /> FALHA</Badge>;
       default:
         return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1"><Clock className="h-3 w-3" /> PENDENTE</Badge>;
     }
   };
 
   return (
     <div className="space-y-4">
       <div className="flex justify-between items-center">
         <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Log de Webhooks (Recentes)</h3>
         <Button size="sm" variant="outline" onClick={fetchEvents} disabled={isLoading}>
           <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
         </Button>
       </div>
 
       <div className="border rounded-lg overflow-hidden bg-white">
         <Table>
           <TableHeader className="bg-gray-50">
             <TableRow>
               <TableHead className="text-[10px] font-bold uppercase">Data</TableHead>
               <TableHead className="text-[10px] font-bold uppercase">Gateway</TableHead>
               <TableHead className="text-[10px] font-bold uppercase">Referência</TableHead>
               <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
               <TableHead className="text-[10px] font-bold uppercase">Erro</TableHead>
               <TableHead className="text-right text-[10px] font-bold uppercase">Ação</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {events.map((event) => (
               <TableRow key={event.id}>
                 <TableCell className="text-[10px] font-mono">
                   {new Date(event.created_at).toLocaleString('pt-BR')}
                 </TableCell>
                 <TableCell className="text-[10px] font-bold uppercase">{event.gateway_name}</TableCell>
                 <TableCell className="text-[10px] font-mono">{event.external_id}</TableCell>
                 <TableCell>{getStatusBadge(event.status)}</TableCell>
                 <TableCell className="max-w-[150px] truncate text-[10px] text-red-600" title={event.error_message}>
                   {event.error_message || "-"}
                 </TableCell>
                 <TableCell className="text-right">
                   <Button 
                     size="sm" 
                     variant="ghost" 
                     className="h-7 text-[10px] font-bold gap-1"
                     onClick={() => handleReprocess(event)}
                     disabled={reprocessingId === event.id}
                   >
                     {reprocessingId === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                     REPROCESSAR
                   </Button>
                 </TableCell>
               </TableRow>
             ))}
             {events.length === 0 && (
               <TableRow>
                 <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                   Nenhum evento registrado.
                 </TableCell>
               </TableRow>
             )}
           </TableBody>
         </Table>
       </div>
     </div>
   );
 }