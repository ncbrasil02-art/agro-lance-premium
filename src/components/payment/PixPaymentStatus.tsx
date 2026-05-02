 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Loader2, QrCode, CheckCircle2, Copy, RefreshCw, AlertCircle } from "lucide-react";
 import { toast } from "sonner";
 import { formatBRL } from "@/utils/format";
 
 interface PixPaymentStatusProps {
   installmentId: string;
   onSuccess?: () => void;
 }
 
 export function PixPaymentStatus({ installmentId, onSuccess }: PixPaymentStatusProps) {
   const [installment, setInstallment] = useState<any>(null);
   const [pixData, setPixData] = useState<{ qr_code?: string, qr_code_base64?: string } | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isGenerating, setIsGenerating] = useState(false);
 
   useEffect(() => {
     fetchInstallment();
 
     // Subscribe to real-time changes
     const channel = supabase
       .channel(`installment_${installmentId}`)
       .on(
         'postgres_changes',
         {
           event: 'UPDATE',
           schema: 'public',
           table: 'installments',
           filter: `id=eq.${installmentId}`
         },
         (payload) => {
           console.log('Installment updated:', payload);
           setInstallment(payload.new);
           if (payload.new.status === 'paid' && onSuccess) {
             onSuccess();
           }
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [installmentId]);
 
   const fetchInstallment = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from('installments')
         .select('*')
         .eq('id', installmentId)
         .single();
       
       if (error) throw error;
       setInstallment(data);
 
       // If it has an external reference but no pix data yet, we might want to fetch it again or just wait
       // For now, if it's pending, let's allow generating
     } catch (err: any) {
       toast.error("Erro ao carregar status: " + err.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   const generatePix = async () => {
     setIsGenerating(true);
     try {
       const { data, error } = await supabase.functions.invoke('create-pix-payment', {
         body: { installmentId, gatewayName: 'mercado_pago' }
       });
 
       if (error) throw error;
       setPixData(data);
     } catch (err: any) {
       toast.error("Erro ao gerar PIX: " + err.message);
     } finally {
       setIsGenerating(false);
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex flex-col items-center justify-center p-8 gap-4">
         <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
         <p className="text-sm text-muted-foreground animate-pulse">Carregando status do pagamento...</p>
       </div>
     );
   }
 
   if (installment?.status === 'paid') {
     return (
       <div className="flex flex-col items-center justify-center p-8 gap-4 bg-emerald-50 rounded-2xl border border-emerald-100">
         <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center">
           <CheckCircle2 className="h-10 w-10 text-white" />
         </div>
         <div className="text-center">
           <h3 className="text-xl font-bold text-emerald-900">Pagamento Confirmado!</h3>
           <p className="text-sm text-emerald-700">A parcela de {formatBRL(installment.amount)} foi paga com sucesso.</p>
         </div>
         <Button variant="outline" className="mt-2 border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={() => window.location.reload()}>
           VOLTAR AO PAINEL
         </Button>
       </div>
     );
   }
 
    return (
      <div className="flex flex-col items-center p-6 gap-6 bg-white dark:bg-emerald-950 rounded-3xl">
        {!pixData && !installment?.external_reference ? (
         <div className="w-full space-y-4">
           <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
             <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
             <p className="text-xs text-amber-700">
               Gere um novo código PIX para realizar o pagamento desta parcela de <strong>{formatBRL(installment?.amount)}</strong>.
             </p>
           </div>
           <Button 
             className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 font-bold gap-2" 
             onClick={generatePix}
             disabled={isGenerating}
           >
             {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
             GERAR PIX AGORA
           </Button>
         </div>
       ) : (
         <div className="w-full flex flex-col items-center gap-6">
            <div className="p-4 bg-white rounded-2xl border-2 border-emerald-100 shadow-xl flex flex-col items-center w-full max-w-[280px]">
             {pixData?.qr_code_base64 ? (
               <img 
                 src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                 alt="QR Code PIX" 
                 className="w-48 h-48"
               />
             ) : (
               <div className="h-48 w-48 bg-gray-50 flex items-center justify-center rounded-lg border border-dashed">
                 <Loader2 className="h-8 w-8 animate-spin text-emerald-200" />
               </div>
             )}
             <div className="mt-4 flex flex-col items-center gap-1">
               <div className="flex items-center gap-2 text-emerald-600">
                 <RefreshCw className="h-3 w-3 animate-spin" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Aguardando pagamento...</span>
               </div>
               <p className="text-[9px] text-gray-400 text-center px-4">
                 O sistema identifica o pagamento automaticamente em poucos segundos.
               </p>
             </div>
           </div>
 
            <div className="w-full space-y-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-emerald-800 p-4 rounded-xl border border-emerald-100 dark:border-emerald-700 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Chave Pix Copia e Cola</span>
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 break-all text-[10px] font-mono font-bold text-emerald-900 dark:text-emerald-100 leading-relaxed">
                    {pixData?.qr_code || installment?.external_reference || "Carregando..."}
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white h-12 font-black gap-2 shadow-lg hover:scale-[1.02] transition-all"
                onClick={() => {
                 const code = pixData?.qr_code || installment?.external_reference;
                 if (code) {
                   navigator.clipboard.writeText(code);
                   toast.success("Código PIX copiado!");
                 }
               }}
             >
               <Copy className="h-4 w-4" /> COPIAR CÓDIGO PIX
             </Button>
             <p className="text-[10px] text-center text-gray-500 italic">
               Abra o app do seu banco e escolha a opção "PIX Copia e Cola" ou escaneie o QR Code.
             </p>
           </div>
         </div>
       )}
     </div>
   );
 }