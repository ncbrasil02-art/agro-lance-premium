 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { toast } from "sonner";
 import { Loader2, Save, CreditCard, Wallet, QrCode, Building2, HelpCircle } from "lucide-react";
 import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
 
 interface PaymentGateway {
   id: string;
   name: string;
   label: string;
   is_enabled: boolean;
   config: any;
 }
 
 export function PaymentManagement() {
   const [gateways, setGateways] = useState<PaymentGateway[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
 
   useEffect(() => {
     fetchGateways();
   }, []);
 
   const fetchGateways = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("payment_gateways")
         .select("*")
         .order("name");
       
       if (error) throw error;
       const formattedData = (data || []).map(g => ({
         ...g,
         is_enabled: !!g.is_enabled,
         config: g.config || {}
       })) as PaymentGateway[];
       setGateways(formattedData);
     } catch (error: any) {
       toast.error("Erro ao carregar gateways: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleUpdateGateway = async (id: string, updates: Partial<PaymentGateway>) => {
     try {
       const { error } = await supabase
         .from("payment_gateways")
         .update(updates)
         .eq("id", id);
       
       if (error) throw error;
       
       setGateways(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
       toast.success("Configuração atualizada!");
     } catch (error: any) {
       toast.error("Erro ao atualizar: " + error.message);
     }
   };
 
   const handleConfigChange = (id: string, field: string, value: string) => {
     setGateways(prev => prev.map(g => {
       if (g.id === id) {
         return {
           ...g,
           config: {
             ...g.config,
             [field]: value
           }
         };
       }
       return g;
     }));
   };
 
   const saveConfig = async (gateway: PaymentGateway) => {
     setIsSaving(true);
     try {
       const { error } = await supabase
         .from("payment_gateways")
         .update({ config: gateway.config, is_enabled: gateway.is_enabled })
         .eq("id", gateway.id);
       
       if (error) throw error;
       toast.success(`${gateway.label} salvo com sucesso!`);
     } catch (error: any) {
       toast.error("Erro ao salvar: " + error.message);
     } finally {
       setIsSaving(false);
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center p-12">
         <Loader2 className="h-8 w-8 animate-spin text-gold" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <CreditCard className="h-5 w-5 text-gold" /> Módulos de Pagamento
           </CardTitle>
           <CardDescription>
             Configure como seus clientes poderão pagar pelas compras. Ative os gateways e insira suas credenciais de API.
           </CardDescription>
         </CardHeader>
         <CardContent>
           <Accordion type="single" collapsible className="w-full">
             {gateways.map((gateway) => (
               <AccordionItem key={gateway.id} value={gateway.id}>
                 <AccordionTrigger className="hover:no-underline">
                   <div className="flex items-center gap-3 text-left">
                     {gateway.name === 'mercado_pago' && <Wallet className="h-5 w-5 text-blue-500" />}
                     {gateway.name === 'pagbank' && <Building2 className="h-5 w-5 text-emerald-500" />}
                     {gateway.name === 'pix_manual' && <QrCode className="h-5 w-5 text-teal-500" />}
                     <div>
                       <p className="font-bold uppercase text-sm">{gateway.label}</p>
                       <p className="text-xs text-muted-foreground">
                         {gateway.is_enabled ? "Ativado" : "Desativado"}
                       </p>
                     </div>
                   </div>
                 </AccordionTrigger>
                 <AccordionContent className="space-y-6 pt-4">
                   <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border">
                     <div className="space-y-1">
                       <span className="text-sm font-bold uppercase">Status do Módulo</span>
                       <p className="text-[10px] text-muted-foreground uppercase">Ativar ou desativar este método de pagamento</p>
                     </div>
                     <Switch 
                       checked={gateway.is_enabled} 
                       onCheckedChange={(checked) => handleUpdateGateway(gateway.id, { is_enabled: checked })} 
                     />
                   </div>
 
                   <div className="space-y-4">
                     {gateway.name === 'mercado_pago' && (
                       <>
                         <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase">Public Key</Label>
                           <Input 
                             placeholder="APP_USR-..." 
                             value={gateway.config.public_key || ''} 
                             onChange={(e) => handleConfigChange(gateway.id, 'public_key', e.target.value)}
                           />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase">Access Token</Label>
                           <Input 
                             type="password"
                             placeholder="APP_USR-..." 
                             value={gateway.config.access_token || ''} 
                             onChange={(e) => handleConfigChange(gateway.id, 'access_token', e.target.value)}
                           />
                         </div>
                         <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[10px] text-blue-500 flex gap-2">
                           <HelpCircle className="h-3 w-3 shrink-0" />
                           <p>Encontre suas credenciais no painel do desenvolvedor do Mercado Pago.</p>
                         </div>
                       </>
                     )}
 
                     {gateway.name === 'pagbank' && (
                       <>
                         <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase">Token de Acesso</Label>
                           <Input 
                             type="password"
                             placeholder="Insira seu token PagBank" 
                             value={gateway.config.token || ''} 
                             onChange={(e) => handleConfigChange(gateway.id, 'token', e.target.value)}
                           />
                         </div>
                         <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-500 flex gap-2">
                           <HelpCircle className="h-3 w-3 shrink-0" />
                           <p>Encontre seu token nas configurações de conta do PagBank (antigo PagSeguro).</p>
                         </div>
                       </>
                     )}
 
                     {gateway.name === 'pix_manual' && (
                       <>
                         <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase">Chave PIX</Label>
                           <Input 
                             placeholder="CPF, E-mail ou Chave Aleatória" 
                             value={gateway.config.pix_key || ''} 
                             onChange={(e) => handleConfigChange(gateway.id, 'pix_key', e.target.value)}
                           />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase">Instruções de Pagamento</Label>
                           <Input 
                             placeholder="Ex: Enviar comprovante para (11) 99999-9999" 
                             value={gateway.config.instructions || ''} 
                             onChange={(e) => handleConfigChange(gateway.id, 'instructions', e.target.value)}
                           />
                         </div>
                       </>
                     )}
 
                     <div className="pt-4 flex justify-end">
                       <Button 
                         className="bg-gold text-emerald-deep font-black hover:bg-gold/90"
                         onClick={() => saveConfig(gateway)}
                         disabled={isSaving}
                       >
                         {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                         SALVAR {gateway.label.toUpperCase()}
                       </Button>
                     </div>
                   </div>
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
         </CardContent>
       </Card>
 
       <Card className="border-gold/30 bg-gold/5">
         <CardHeader>
           <CardTitle className="text-sm font-bold flex items-center gap-2">
             <QrCode className="h-4 w-4" /> Parcelamento de Boletos e Outros Módulos
           </CardTitle>
           <CardDescription className="text-xs">
             Estamos expandindo as opções. Em breve você poderá instalar novos módulos diretamente por aqui.
           </CardDescription>
         </CardHeader>
       </Card>
     </div>
   );
 }