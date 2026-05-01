 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { ShieldAlert, RefreshCw, ChevronRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Link } from "@tanstack/react-router";
 
 export function SecurityAlertsBanner() {
   const [alerts, setAlerts] = useState<any[]>([]);
   const [failedWebhooksCount, setFailedWebhooksCount] = useState(0);
   const [unapprovedUsersCount, setUnapprovedUsersCount] = useState(0);
 
   useEffect(() => {
     const fetchSecurityStats = async () => {
       const [webhooksRes, usersRes] = await Promise.all([
         supabase.from("webhook_events").select("id", { count: "exact", head: true }).eq("status", "failed"),
         supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_approved", false)
       ]);
 
       setFailedWebhooksCount(webhooksRes.count || 0);
       setUnapprovedUsersCount(usersRes.count || 0);
     };
 
     fetchSecurityStats();
   }, []);
 
   if (failedWebhooksCount === 0 && unapprovedUsersCount === 0) return null;
 
   return (
     <div className="space-y-4 mb-8">
       {failedWebhooksCount > 0 && (
         <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm animate-in fade-in slide-in-from-top-4">
           <ShieldAlert className="h-5 w-5 text-red-600" />
           <div className="flex-1 ml-3">
             <AlertTitle className="font-black uppercase tracking-tight text-red-700">Aviso Crítico de Segurança</AlertTitle>
             <AlertDescription className="text-sm font-medium">
               Existem <span className="font-black underline">{failedWebhooksCount} falhas de webhooks</span> pendentes de conciliação. Isso pode significar pagamentos recebidos que ainda não foram baixados no sistema.
             </AlertDescription>
           </div>
            <Link to="/admin" search={{ tab: "installments" }}>
              <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-100 font-bold gap-2 ml-4">
                REPARAR AGORA <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
         </Alert>
       )}
 
       {unapprovedUsersCount > 5 && (
         <Alert className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
           <ShieldAlert className="h-5 w-5 text-amber-600" />
           <div className="flex-1 ml-3">
             <AlertTitle className="font-bold uppercase tracking-tight text-amber-700">Revisão de Novos Usuários</AlertTitle>
             <AlertDescription className="text-sm font-medium">
               Há <span className="font-bold">{unapprovedUsersCount} novos cadastros</span> aguardando análise de segurança para participar dos leilões.
             </AlertDescription>
           </div>
            <Link to="/admin" search={{ tab: "users" }}>
              <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-100 font-bold ml-4">
                ANALISAR
              </Button>
            </Link>
         </Alert>
       )}
     </div>
   );
 }