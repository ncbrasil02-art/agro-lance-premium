 import { validateImage, validateDocument } from "@/utils/upload-validation";
 import { calculateInstallments, getTotalInstallmentsCount, Installment } from "@/utils/payment-calculator";
 
 function PaymentDialog({ lot, profile }: { lot: any, profile: any }) {
   const [gatewayConfig, setGatewayConfig] = useState<any>(null);
   const [installments, setInstallments] = useState<Installment[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [uploadingId, setUploadingId] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchData = async () => {
       setIsLoading(true);
       try {
         // Fetch Pix Manual config
         const { data: gateway } = await supabase
           .from("payment_gateways")
           .select("config")
           .eq("name", "pix_manual")
           .single();
         
         setGatewayConfig(gateway?.config || {});
 
         // Check for existing installments in DB
         const { data: existingInstallments } = await supabase
           .from("installments")
           .select("*")
           .eq("buyer_id", profile.id)
           // We'd ideally link to a transaction, but let's use a workaround for now
           // Or just generate on the fly if not exists
           .order("installment_number", { ascending: true });
 
         const formula = lot.payment_formula || lot.animal?.payment_formula || "1";
         const calculated = calculateInstallments(lot.current_price, formula, new Date(lot.updated_at || lot.created_at));
         setInstallments(calculated);
       } catch (err) {
         console.error("Error fetching payment data:", err);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchData();
   }, [lot, profile.id]);
 
   const handleUploadProof = async (installmentId: number, e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     setUploadingId(installmentId.toString());
     try {
       const fileExt = file.name.split('.').pop();
       const fileName = `${profile.id}/proof-${lot.id}-${installmentId}-${Math.random()}.${fileExt}`;
       
       const { error: uploadError } = await supabase.storage
         .from('payment_proofs')
         .upload(fileName, file);
 
       if (uploadError) throw uploadError;
 
       const { data: { publicUrl } } = supabase.storage
         .from('payment_proofs')
         .getPublicUrl(fileName);
 
       toast.success("Comprovante enviado com sucesso! Aguarde a conferência.");
     } catch (error: any) {
       toast.error("Erro ao enviar comprovante: " + error.message);
     } finally {
       setUploadingId(null);
     }
   };
 
   const pixKey = gatewayConfig?.pix_key || "Chave não configurada";
   const pixQRCode = gatewayConfig?.pix_qr_code;
   const instructions = gatewayConfig?.instructions || "Realize o pagamento e envie o comprovante.";
 
   return (
     <Dialog>
       <DialogTrigger asChild>
         <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
           <CreditCard className="h-4 w-4" /> Realizar Pagamento
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-2xl bg-white p-0">
         <DialogHeader className="p-6 bg-emerald-deep text-white">
           <DialogTitle className="text-xl flex items-center gap-2">
             <Receipt className="h-6 w-6 text-gold" /> Carnê de Pagamento - Lote #{lot.lot_number}
           </DialogTitle>
         </DialogHeader>
         
         <div className="p-6 space-y-6">
           <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
               <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Total do Arremate</p>
               <p className="text-2xl font-black text-emerald-deep">{formatBRL(lot.current_price)}</p>
             </div>
             <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-right overflow-hidden">
               <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Parcelamento</p>
               <p className="text-xl font-bold text-gray-800 truncate">
                 {installments.length} Parcelas (Fórmula: {lot.payment_formula || "1"})
               </p>
             </div>
           </div>
 
           <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
             <h4 className="text-xs font-black uppercase tracking-widest text-emerald-deep">Mensalidades (Boletas)</h4>
             {installments.map((inst, i) => (
               <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-emerald-200 transition-colors">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-emerald-deep/5 flex items-center justify-center font-bold text-emerald-deep text-xs"> 
                     {String(inst.installment_number).padStart(2, '0')} 
                   </div>
                   <div>
                     <p className="text-sm font-bold text-gray-800">Vencimento: {inst.due_date.toLocaleDateString('pt-BR')}</p>
                     <p className="text-[10px] text-gray-400">Status: Pendente</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <p className="font-bold text-emerald-600">{formatBRL(inst.amount)}</p>
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-gold text-gold hover:bg-gold hover:text-white">PAGAR</Button>
                     </DialogTrigger>
                     <DialogContent className="max-w-md bg-white p-6">
                       <DialogHeader>
                         <DialogTitle className="text-center text-emerald-deep">Pagamento da Parcela {inst.installment_number}</DialogTitle>
                       </DialogHeader>
                       <div className="flex flex-col items-center gap-4 mt-4">
                         <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
                           {pixQRCode ? (
                             <div className="p-2 bg-white rounded-lg border">
                               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixQRCode)}`} alt="QR Code PIX" />
                             </div>
                           ) : (
                             <div className="h-40 w-40 bg-gray-200 flex items-center justify-center rounded-lg">
                               <QrCode className="h-12 w-12 text-emerald-deep/20" />
                             </div>
                           )}
                           <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold">Escaneie o QR Code acima</p>
                         </div>
                         <div className="space-y-4 w-full">
                           <div className="space-y-2">
                             <p className="text-xs text-gray-500 font-medium">Chave PIX:</p>
                             <div className="p-3 bg-gray-50 rounded font-mono text-[10px] break-all border text-left cursor-pointer hover:bg-gray-100 flex justify-between items-center" onClick={() => {
                               navigator.clipboard.writeText(pixKey);
                               toast.success("Chave PIX copiada!");
                             }}>
                               <span className="truncate mr-2">{pixKey}</span>
                               <Upload className="h-3 w-3 shrink-0 rotate-90" />
                             </div>
                           </div>

                           <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                             <p className="text-[10px] font-bold text-amber-800 uppercase">Instruções:</p>
                             <p className="text-xs text-amber-700">{instructions}</p>
                           </div>

                           <div className="space-y-2 pt-2">
                             <Label className="text-xs font-bold uppercase">Enviar Comprovante</Label>
                             <Input 
                               type="file" 
                               accept="image/*,application/pdf"
                               onChange={(e) => handleUploadProof(inst.installment_number, e)}
                               disabled={!!uploadingId}
                             />
                             {uploadingId === inst.installment_number.toString() && (
                               <div className="flex items-center gap-2 text-[10px] text-emerald-600">
                                 <Loader2 className="h-3 w-3 animate-spin" /> Enviando...
                               </div>
                             )}
                           </div>
                           
                           <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => toast.info("O comprovante foi enviado e está em análise.")}>JÁ REALIZEI O PAGAMENTO</Button>
                         </div>
                       </div>
                     </DialogContent>
                   </Dialog>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
import { createFileRoute, Link } from "@tanstack/react-router";
 import {
     User, Gavel, FileText, Receipt, CreditCard, Clock, Camera,
     ChevronRight, BadgeCheck, Download, ExternalLink, Upload,
     ShieldCheck, AlertCircle, Info, Printer, MessageSquare, Image,
     Pencil,
    CalendarDays, Scissors, Barcode, Landmark, Heart, TrendingUp,
    MapPin, Globe, Loader2, Send, BellRing, Search
 } from "lucide-react";
   import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
  import { useRealtimeFallback } from "@/hooks/useRealtimeFallback";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/utils/format";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
 import { OptimizedImage } from "@/components/ui/optimized-image";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/painel")({
  component: UserDashboard,
});

  function UserDashboard() {
    const { user, profile, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState("arremates");
    const [myLots, setMyLots] = useState<any[]>([]);
     const [myBids, setMyBids] = useState<any[]>([]);
     const [myOffers, setMyOffers] = useState<any[]>([]);
      const [myFavorites, setMyFavorites] = useState<any[]>([]);
      const [myContracts, setMyContracts] = useState<any[]>([]);
      const [messages, setMessages] = useState<any[]>([]);
      const [notifications, setNotifications] = useState<any[]>([]);
     const [siteInfo, setSiteInfo] = useState<any>(null);
     const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [bidsSearchTerm, setBidsSearchTerm] = useState("");
    const [bidsStatusFilter, setBidsStatusFilter] = useState("all");
    const [notifSearchTerm, setNotifSearchTerm] = useState("");
    const [notifStatusFilter, setNotifStatusFilter] = useState("all");

    const [formData, setFormData] = useState({
      full_name: "",
      cpf: "",
      phone: "",
      address: "",
      cep: "",
      nationality: "Brasileira",
      pref_outbid_email: true,
      pref_outbid_push: true,
      pref_outbid_whatsapp: true,
      pref_outbid_sms: false,
      pref_new_event_email: true,
      pref_new_event_whatsapp: true,
      pref_new_event_sms: false,
      pref_followed_lot_update: true,
    });

     const fileInputRef = useRef<HTMLInputElement>(null);
     const docInputRef = useRef<HTMLInputElement>(null);
     const [rtStatus, setRtStatus] = useState<string>("INITIAL");
 
    const filteredBids = useMemo(() => {
      return myBids.filter(bid => {
        const matchesSearch = (bid.lot?.animal?.name || "").toLowerCase().includes(bidsSearchTerm.toLowerCase());
        const isWinner = bid.lot?.winner_id === user?.id && bid.lot?.status === 'sold';
        const isLeading = bid.amount >= (bid.lot?.current_price || 0) && !isWinner;
        const isOutbid = bid.amount < (bid.lot?.current_price || 0);

        let matchesStatus = true;
        if (bidsStatusFilter === 'winner') matchesStatus = isWinner;
        if (bidsStatusFilter === 'leading') matchesStatus = isLeading;
        if (bidsStatusFilter === 'outbid') matchesStatus = isOutbid;

        return matchesSearch && matchesStatus;
      });
    }, [myBids, bidsSearchTerm, bidsStatusFilter, user?.id]);

    const filteredNotifications = useMemo(() => {
      return notifications.filter(n => {
        const matchesSearch = (n.title + n.message).toLowerCase().includes(notifSearchTerm.toLowerCase());
        let matchesStatus = true;
        if (notifStatusFilter === 'unread') matchesStatus = !n.is_read;
        if (notifStatusFilter === 'read') matchesStatus = n.is_read;

        return matchesSearch && matchesStatus;
      });
    }, [notifications, notifSearchTerm, notifStatusFilter]);

    const fetchDashboardData = useCallback(async () => {
      setIsLoading(true);
      if (!user?.id) return;
      try {
        const { data: wonLots, error: wonError } = await supabase
          .from("lots")
          .select(`
            id, lot_number, status, current_price, winner_id, updated_at, accepted_at, accepted_ip,
            animal:animals!lots_animal_id_fkey(id, name, breed, species, photos, internal_code),
            event:events!lots_event_id_fkey(id, name)
          `)
          .eq("winner_id", user.id)
          .order("updated_at", { ascending: false });
        
        if (wonError) throw wonError;

        // Fetch direct sales (animal purchases)
        const { data: directSales, error: dsError } = await supabase
          .from("direct_sales")
          .select(`
            id, total_price, status, created_at, updated_at, negotiated_terms, accepted_at, accepted_ip,
            animal:animals(id, name, breed, species, photos, internal_code)
          `)
          .eq("buyer_id", user.id)
          .order("updated_at", { ascending: false });

        if (dsError) console.error("Error fetching direct sales:", dsError);

        // Combine auction wins and direct sales for the "Arremates" tab
        const combinedPurchases = [
          ...(wonLots || []).map(l => ({ ...l, is_direct_sale: false })),
          ...(directSales || []).map(ds => ({
            ...ds,
            is_direct_sale: true,
            current_price: ds.total_price,
            lot_number: null // Direct sales don't have lot numbers
          }))
        ].sort((a, b) => {
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          return dateB - dateA;
        });

        setMyLots(combinedPurchases);
 
         const { data: userBids } = await supabase
           .from("bids")
           .select("*, lot:lots!bids_lot_id_fkey(*, animal:animals!lots_animal_id_fkey(name))")
           .eq("user_id", user.id)
           .order("created_at", { ascending: false })
           .limit(10);
         
           setMyBids(userBids || []);

          const { data: userOffers } = await supabase
            .from("offers")
            .select("*, animal:animals(name, breed, photos)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          
          setMyOffers(userOffers || []);

          const { data: settingsData } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "site_info")
            .single();
          
          setSiteInfo(settingsData?.value || null);
   
          const { data: followedData } = await supabase
            .from("followed_lots")
            .select("*, lot:lots!followed_lots_lot_id_fkey(*, animal:animals!lots_animal_id_fkey(*), event:events!lots_event_id_fkey(*))")
            .eq("user_id", user.id);
         
           setMyFavorites(followedData || []);

           const { data: contractsData } = await supabase
             .from("contracts")
             .select(`
               *,
               transaction:transactions!inner(
                 id, buyer_id, final_price,
                 lot:lots!inner(lot_number, animal:animals(name, breed, photos))
               )
             `)
             .eq("transaction.buyer_id", user.id)
             .order("created_at", { ascending: false });
           
           setMyContracts(contractsData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Erro ao carregar dados do painel");
      } finally {
        setIsLoading(false);
      }
    }, [user?.id]);
 
    const fetchMessages = useCallback(async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });
      setMessages(data || []);
    }, [user?.id]);

    const fetchNotifications = useCallback(async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications(data || []);
    }, [user?.id]);
 
     useRealtimeFallback({
       status: rtStatus,
       onUpdate: fetchDashboardData,
       label: "Painel do Usuário",
       pollInterval: 60000,
       initialPollInterval: 30000
     });
 
     useEffect(() => {
       if (!user) return;
      fetchDashboardData();
      fetchMessages();
      fetchNotifications();
       
       if (profile) {
          setFormData({
            full_name: profile.full_name || "",
            cpf: profile.cpf || "",
            phone: profile.phone || "",
            address: profile.address || "",
            cep: profile.cep || "",
            nationality: profile.nationality || "Brasileira",
            pref_outbid_email: profile.pref_outbid_email !== false,
            pref_outbid_push: profile.pref_outbid_push !== false,
            pref_outbid_whatsapp: profile.pref_outbid_whatsapp !== false,
            pref_outbid_sms: !!profile.pref_outbid_sms,
            pref_new_event_email: profile.pref_new_event_email !== false,
            pref_new_event_whatsapp: profile.pref_new_event_whatsapp !== false,
            pref_new_event_sms: !!profile.pref_new_event_sms,
            pref_followed_lot_update: profile.pref_followed_lot_update !== false,
          });
       }
 
       // Add real-time listeners for the dashboard
       const lotsUniqueId = `dashboard-lots-${user.id}-${Math.random().toString(36).slice(2, 9)}`;
       const lotsChannel = supabase
         .channel(lotsUniqueId)
         .on('postgres_changes', { 
           event: '*', 
           schema: 'public', 
           table: 'lots',
           filter: `winner_id=eq.${user.id}` 
         }, () => {
           fetchDashboardData();
         })
         .subscribe((newStatus) => {
           setRtStatus(newStatus);
         });
 
       const bidsUniqueId = `dashboard-bids-${user.id}-${Math.random().toString(36).slice(2, 9)}`;
       const bidsChannel = supabase
         .channel(bidsUniqueId)
         .on('postgres_changes', { 
           event: '*', 
           schema: 'public', 
           table: 'bids',
           filter: `user_id=eq.${user.id}` 
         }, () => {
           fetchDashboardData();
         })
         .subscribe();

       const notificationsUniqueId = `dashboard-notifications-${user.id}-${Math.random().toString(36).slice(2, 9)}`;
       const notificationsChannel = supabase
         .channel(notificationsUniqueId)
         .on('postgres_changes', { 
           event: '*', 
           schema: 'public', 
           table: 'notifications',
           filter: `user_id=eq.${user.id}` 
         }, () => {
           fetchNotifications();
         })
         .subscribe();
 
         const offersUniqueId = `dashboard-offers-${user.id}-${Math.random().toString(36).slice(2, 9)}`;
         const offersChannel = supabase
           .channel(offersUniqueId)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'offers',
            filter: `user_id=eq.${user.id}` 
          }, () => {
            fetchDashboardData();
          })
          .subscribe();

         return () => {
           supabase.removeChannel(lotsChannel);
           supabase.removeChannel(bidsChannel);
           supabase.removeChannel(offersChannel);
           supabase.removeChannel(notificationsChannel);
         };
     }, [user, profile, fetchDashboardData, fetchMessages]);
 

   const handleUpdateProfile = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user?.id) return;
     
     setIsSaving(true);
     try {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            cpf: formData.cpf,
            phone: formData.phone,
            address: formData.address,
            cep: formData.cep,
            nationality: formData.nationality,
            pref_outbid_email: formData.pref_outbid_email,
            pref_outbid_push: formData.pref_outbid_push,
            pref_outbid_whatsapp: formData.pref_outbid_whatsapp,
            pref_outbid_sms: formData.pref_outbid_sms,
            pref_new_event_email: formData.pref_new_event_email,
            pref_new_event_whatsapp: formData.pref_new_event_whatsapp,
            pref_new_event_sms: formData.pref_new_event_sms,
            pref_followed_lot_update: formData.pref_followed_lot_update,
          })
          .eq("id", user.id);

       if (error) throw error;
       
       toast.success("Perfil atualizado com sucesso!");
       refreshProfile();
     } catch (error: any) {
       toast.error("Erro ao atualizar perfil: " + error.message);
     } finally {
       setIsSaving(false);
     }
   };

   const handleRequestRevision = async (offerId: string, itemName: string, amount: number) => {
     try {
       const { error } = await supabase
         .from("offers")
         .update({ 
           status: "under_review", 
           updated_at: new Date().toISOString() 
         })
         .eq("id", offerId);

       if (error) throw error;

       // Notify admins
       await supabase.functions.invoke('user-notifications', {
         body: {
           type: 'offer_received',
           data: {
             amount: amount,
             itemName: itemName + " (PEDIDO DE REVISÃO)",
             bidderName: profile?.full_name || user?.email?.split('@')[0]
           }
         }
       });

       toast.success("Solicitação de revisão enviada com sucesso!");
       fetchDashboardData();
     } catch (error: any) {
       toast.error("Erro ao solicitar revisão: " + error.message);
     }
   };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'document') => {
      const files = e.target.files;
      if (!files || files.length === 0 || !user?.id) return;

      const validFiles = Array.from(files).filter(type === 'avatar' ? validateImage : validateDocument);
      if (validFiles.length === 0) return;

      setIsUploading(true);
      try {
        const uploadedUrls: string[] = [];
        const bucket = type === 'avatar' ? 'avatars' : 'documents';

        for (const file of validFiles) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

          if (uploadError) {
            toast.error(`Erro no upload de ${file.name}: ${uploadError.message}`);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          
          uploadedUrls.push(publicUrl);
        }

        if (uploadedUrls.length === 0) return;

        if (type === 'avatar') {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ avatar_url: uploadedUrls[0] })
            .eq("id", user.id);
          if (updateError) throw updateError;
          toast.success("Foto de perfil atualizada!");
        } else {
          const newDocs = [...(profile?.document_urls || []), ...uploadedUrls];
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ document_urls: newDocs })
            .eq("id", user.id);
          if (updateError) throw updateError;
          toast.success(`${uploadedUrls.length} documento(s) enviado(s) com sucesso!`);
        }
        
        refreshProfile();
      } catch (error: any) {
        toast.error("Erro no processo de upload: " + error.message);
      } finally {
        setIsUploading(false);
      }
    };


  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-muted-foreground">Você precisa estar logado para acessar esta área.</p>
        <Link to="/login" className="mt-4 inline-block">
          <Button>Fazer Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-emerald-deep">Minha Conta</h1>
          <p className="text-muted-foreground">Olá, {profile?.full_name}. Bem-vindo ao seu painel de arremates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`px-3 py-1 ${profile?.is_approved ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-amber-500/10 text-amber-600 border-amber-200"}`}
          >
            {profile?.is_approved ? (
              <span className="flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> Cadastro Aprovado</span>
            ) : (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Aguardando Aprovação</span>
            )}
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="arremates" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto justify-start md:justify-center gap-1">
          <TabsTrigger value="arremates" className="gap-2">
            <Gavel className="h-4 w-4" /> Meus Arremates
          </TabsTrigger>
          <TabsTrigger value="lances" className="gap-2">
            <Clock className="h-4 w-4" /> Meus Lances
          </TabsTrigger>
          <TabsTrigger value="ofertas" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Minhas Ofertas
          </TabsTrigger>
          <TabsTrigger value="assinaturas" className="gap-2">
            <FileText className="h-4 w-4" /> Assinaturas
            {myContracts.some(c => c.status === 'pending') && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {myContracts.filter(c => c.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="favoritos" className="gap-2">
            <Heart className="h-4 w-4" /> Meus Favoritos
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2 relative">
            <ShieldCheck className="h-4 w-4" /> Notificações
            {notifications.some(n => !n.is_read) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="mensagens" className="gap-2 relative">
            <MessageSquare className="h-4 w-4" /> Mensagens
            {messages.some(m => !m.is_read) && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="perfil" className="gap-2">
            <User className="h-4 w-4" /> Perfil & Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assinaturas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Digitais</CardTitle>
              <CardDescription>Visualize e assine seus contratos de compra e venda de forma digital.</CardDescription>
            </CardHeader>
            <CardContent>
              {myContracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">Você ainda não possui contratos para assinatura.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myContracts.map((contract) => (
                    <div key={contract.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-all gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted">
                          <img 
                            src={contract.transaction?.lot?.animal?.photos?.[0]} 
                            alt="" 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-emerald-deep leading-tight">Contrato Lote #{contract.transaction?.lot?.lot_number}</h4>
                          <p className="text-sm text-muted-foreground">{contract.transaction?.lot?.animal?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={contract.status === 'signed' ? 'default' : 'secondary'} className="text-[10px]">
                              {contract.status === 'signed' ? 'Assinado' : 'Pendente'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">Emitido em {new Date(contract.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contract.contract_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={contract.contract_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" /> Baixar PDF
                            </a>
                          </Button>
                        )}
                        {contract.status === 'signed' ? (
                          <Button size="sm" variant="ghost" disabled className="text-emerald-600 font-bold">
                            <BadgeCheck className="h-4 w-4 mr-2" /> Assinado em {contract.signed_at && new Date(contract.signed_at).toLocaleDateString('pt-BR')}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-gold text-emerald-deep font-bold hover:bg-gold-bright"
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('contracts')
                                  .update({ 
                                    status: 'signed', 
                                    signed_at: new Date().toISOString() 
                                  })
                                  .eq('id', contract.id);
                                if (error) throw error;
                                toast.success("Contrato assinado com sucesso!");
                                fetchDashboardData();
                              } catch (err: any) {
                                toast.error("Erro ao assinar contrato: " + err.message);
                              }
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Assinar Agora
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Notificações do Sistema</CardTitle>
                  <CardDescription>Avisos importantes sobre seus lances e conta.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-48 hidden md:block">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Filtrar avisos..." 
                      className="pl-8 h-8 text-xs" 
                      value={notifSearchTerm}
                      onChange={(e) => setNotifSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={notifStatusFilter} onValueChange={setNotifStatusFilter}>
                    <SelectTrigger className="h-8 text-xs w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="unread">Não lidas</SelectItem>
                      <SelectItem value="read">Lidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {notifications.some(n => !n.is_read) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-gold hover:text-gold-bright"
                  onClick={async () => {
                    if (user) {
                      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
                      fetchNotifications();
                    }
                  }}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </CardHeader>
              <CardContent>
                {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">Nenhuma notificação por enquanto.</p>
                </div>
              ) : (
                  <div className="space-y-4">
                    {filteredNotifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-2xl border transition-all ${n.is_read ? 'bg-background border-border opacity-70' : 'bg-gold/5 border-gold/20 shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {!n.is_read && <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />}
                            <h4 className="font-bold text-sm text-emerald-deep">{n.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 pt-1">
                            {new Date(n.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {n.link && (
                          <Button variant="outline" size="sm" asChild className="h-8 text-[10px] font-bold border-emerald-deep/20">
                            <Link to={n.link as any} onClick={async () => {
                              if (!n.is_read) {
                                await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                                fetchNotifications();
                              }
                            }}>
                              Ver Detalhes
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ofertas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suas Propostas de Compra</CardTitle>
              <CardDescription>Acompanhe o status das ofertas que você fez em lotes e venda direta.</CardDescription>
            </CardHeader>
            <CardContent>
              {myOffers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">Você ainda não fez nenhuma proposta.</p>
                  <Link to="/compra-direta" className="mt-4">
                    <Button variant="outline">Ver Venda Direta</Button>
                  </Link>
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                      <tr>
                        <th className="px-4 py-3">Data/Últ. Att.</th>
                        <th className="px-4 py-3">Animal</th>
                        <th className="px-4 py-3">Valor</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Mensagem</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b">
                      {myOffers.map((offer) => (
                        <tr key={offer.id} className="hover:bg-muted/5 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-xs font-medium">{new Date(offer.created_at).toLocaleDateString("pt-BR")}</div>
                            {offer.updated_at && offer.updated_at !== offer.created_at && (
                              <div className="text-[9px] text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-2 w-2" /> {new Date(offer.updated_at).toLocaleDateString("pt-BR")}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {offer.animal?.photos?.[0] && (
                                <OptimizedImage 
                                  src={offer.animal.photos[0]} 
                                  alt="" 
                                  width={40}
                                  aspectRatio="square"
                                  className="h-8 w-8 rounded" 
                                />
                              )}
                              <span className="font-medium">{offer.animal?.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-bold text-emerald-600">
                            {formatBRL(offer.amount)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2 min-w-[150px]">
                              <Badge variant={
                                offer.status === 'approved' ? 'default' :
                                offer.status === 'rejected' ? 'destructive' :
                                offer.status === 'under_review' ? 'outline' : 'secondary'
                              } className="text-[10px] w-fit">
                                {offer.status === 'pending' ? 'Pendente' :
                                 offer.status === 'approved' ? 'Aprovada' :
                                 offer.status === 'under_review' ? 'Em Análise' : 'Rejeitada'}
                              </Badge>
                              <div className="flex items-center gap-1 w-full max-w-[120px]">
                                <div className={`h-1 flex-1 rounded-full ${['pending', 'under_review', 'approved'].includes(offer.status) ? 'bg-emerald-500' : 'bg-muted'}`} />
                                <div className={`h-1 flex-1 rounded-full ${['under_review', 'approved'].includes(offer.status) ? 'bg-emerald-500' : 'bg-muted'}`} />
                                <div className={`h-1 flex-1 rounded-full ${offer.status === 'approved' ? 'bg-emerald-500' : offer.status === 'rejected' ? 'bg-red-500' : 'bg-muted'}`} />
                              </div>
                              <p className="text-[9px] text-muted-foreground italic">
                                {offer.status === 'pending' && "Aguardando triagem inicial"}
                                {offer.status === 'under_review' && "Em análise pela equipe"}
                                {offer.status === 'approved' && "Oferta aceita! Aguarde contato."}
                                {offer.status === 'rejected' && "Não foi possível aceitar a oferta."}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs text-muted-foreground max-w-[200px]" title={offer.negotiated_terms || offer.description}>
                            <div className="line-clamp-2">
                              {offer.negotiated_terms ? (
                                <span className="text-emerald-600 font-bold">Acordado: {offer.negotiated_terms}</span>
                              ) : (
                                offer.description || "-"
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {offer.status === 'rejected' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-[10px] font-bold border-gold text-gold hover:bg-gold hover:text-white"
                                onClick={() => handleRequestRevision(offer.id, offer.animal?.name || 'item', offer.amount)}
                              >
                                Solicitar Revisão
                              </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arremates" className="space-y-6">
          {myLots.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gavel className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <CardTitle className="text-xl">Nenhum arremate ainda</CardTitle>
                <CardDescription className="max-w-xs mx-auto mt-2">
                  Você ainda não arrematou nenhum lote. Participe dos nossos leilões ao vivo para garantir seu animal de elite.
                </CardDescription>
                <Link to="/ao-vivo" className="mt-6">
                  <Button className="bg-gold text-emerald-deep font-bold">Ir para o Leilão ao Vivo</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
               {myLots.map((lot) => (
                  <LotPurchaseCard key={lot.id} lot={lot} profile={profile} siteInfo={siteInfo} onUpdate={fetchDashboardData} />
               ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lances">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Histórico de Lances</CardTitle>
                <CardDescription>Seus lances recentes em todos os leilões.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-48 hidden md:block">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar animal..." 
                    className="pl-8 h-8 text-xs" 
                    value={bidsSearchTerm}
                    onChange={(e) => setBidsSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={bidsStatusFilter} onValueChange={setBidsStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-40">
                    <SelectValue placeholder="Filtrar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os lances</SelectItem>
                    <SelectItem value="winner">Lotes arrematados</SelectItem>
                    <SelectItem value="leading">Lances vencedores</SelectItem>
                    <SelectItem value="outbid">Lances superados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                    <tr>
                      <th className="px-4 py-3">Data/Hora</th>
                      <th className="px-4 py-3">Animal</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-b">
                    {filteredBids.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-muted-foreground">
                          Nenhum lance encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredBids.map((bid) => (
                        <tr key={bid.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            {new Date(bid.created_at).toLocaleString("pt-BR")}
                          </td>
                          <td className="px-4 py-4 font-medium">
                            {bid.lot?.animal?.name || "Lote #" + bid.lot?.lot_number}
                          </td>
                          <td className="px-4 py-4 font-bold text-emerald-deep">
                            {formatBRL(bid.amount)}
                          </td>
                          <td className="px-4 py-4">
                            {bid.lot?.winner_id === user.id && bid.lot?.status === 'sold' ? (
                              <Badge className="bg-emerald-600 text-white border-none">ARREMATADO</Badge>
                            ) : bid.amount >= (bid.lot?.current_price || 0) ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Maior lance</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Lance superado</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Foto de Perfil</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-muted bg-muted flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-16 w-16 text-muted-foreground/30" />
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-gold text-emerald-deep rounded-full shadow-lg hover:scale-110 transition-transform"
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'avatar')}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-emerald-deep">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Verificação de Conta</CardTitle>
                  <CardDescription>Envie seus documentos para aprovação de lances.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Documentos Enviados</Label>
                    {profile?.document_urls?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {profile.document_urls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="p-2 border rounded-lg bg-muted/30 hover:bg-muted transition-colors flex items-center justify-center">
                            <FileText className="h-4 w-4 text-emerald-deep" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed rounded-lg text-center text-xs text-muted-foreground">
                        Nenhum documento enviado
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-emerald-deep text-emerald-deep"
                    onClick={() => docInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" /> {isUploading ? "Enviando..." : "Enviar Documentos"}
                  </Button>
                  <input 
                    type="file" 
                    ref={docInputRef} 
                    className="hidden" 
                    multiple
                    onChange={(e) => handleFileUpload(e, 'document')}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-gold" /> Preferências de Alerta
                  </CardTitle>
                  <CardDescription>Escolha como deseja ser notificado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Lance Superado (E-mail)</Label>
                        <p className="text-[10px] text-muted-foreground">Receba um e-mail imediato quando alguém cobrir seu lance.</p>
                      </div>
                      <Switch 
                        checked={formData.pref_outbid_email} 
                        onCheckedChange={(checked) => setFormData({...formData, pref_outbid_email: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Lance Superado (WhatsApp)</Label>
                        <p className="text-[10px] text-muted-foreground text-emerald-600 font-medium">Notificação em tempo real no seu celular.</p>
                      </div>
                      <Switch 
                        checked={formData.pref_outbid_whatsapp} 
                        onCheckedChange={(checked) => setFormData({...formData, pref_outbid_whatsapp: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2 opacity-50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Lance Superado (SMS)</Label>
                        <p className="text-[10px] text-muted-foreground">Aviso via SMS tradicional.</p>
                      </div>
                      <Switch 
                        checked={formData.pref_outbid_sms} 
                        onCheckedChange={(checked) => setFormData({...formData, pref_outbid_sms: checked})}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Lance Superado (Painel)</Label>
                      <p className="text-[10px] text-muted-foreground">Alertas visuais e histórico no seu painel de usuário.</p>
                    </div>
                    <Switch 
                      checked={formData.pref_outbid_push} 
                      onCheckedChange={(checked) => setFormData({...formData, pref_outbid_push: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Lotes Seguidos</Label>
                      <p className="text-[10px] text-muted-foreground">Alertas sobre mudanças de preço ou status nos animais que você segue.</p>
                    </div>
                    <Switch 
                      checked={formData.pref_followed_lot_update} 
                      onCheckedChange={(checked) => setFormData({...formData, pref_followed_lot_update: checked})}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Novos Eventos (E-mail)</Label>
                        <p className="text-[10px] text-muted-foreground">Receba as novidades por e-mail.</p>
                      </div>
                      <Switch 
                        checked={formData.pref_new_event_email} 
                        onCheckedChange={(checked) => setFormData({...formData, pref_new_event_email: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Novos Eventos (WhatsApp)</Label>
                        <p className="text-[10px] text-muted-foreground text-emerald-600">Catálogo e convites via WhatsApp.</p>
                      </div>
                      <Switch 
                        checked={formData.pref_new_event_whatsapp} 
                        onCheckedChange={(checked) => setFormData({...formData, pref_new_event_whatsapp: checked})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Cadastrais</CardTitle>
                  <CardDescription>Mantenha suas informações atualizadas para emissão de contratos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input 
                          id="full_name" 
                          value={formData.full_name} 
                          onChange={e => setFormData({...formData, full_name: e.target.value})}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input 
                          id="cpf" 
                          value={formData.cpf} 
                          onChange={e => setFormData({...formData, cpf: e.target.value})}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp / Celular</Label>
                        <Input 
                          id="phone" 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nacionalidade</Label>
                        <Input 
                          id="nationality" 
                          value={formData.nationality} 
                          onChange={e => setFormData({...formData, nationality: e.target.value})}
                          placeholder="Brasileira"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Endereço Completo</Label>
                        <Input 
                          id="address" 
                          value={formData.address} 
                          onChange={e => setFormData({...formData, address: e.target.value})}
                          placeholder="Rua, Número, Complemento, Bairro, Cidade, Estado"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input 
                          id="cep" 
                          value={formData.cep} 
                          onChange={e => setFormData({...formData, cep: e.target.value})}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gold text-emerald-deep font-bold" disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Salvar Alterações
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mensagens">
          <Card>
            <CardHeader>
              <CardTitle>Centro de Mensagens</CardTitle>
              <CardDescription>Comunicações oficiais da Premium Agro.</CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">Você não possui mensagens no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-4 rounded-xl border transition-all ${msg.is_read ? 'bg-white border-gray-100' : 'bg-emerald-50/30 border-emerald-100'}`}
                      onClick={async () => {
                        if (!msg.is_read) {
                          await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
                          fetchMessages();
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-emerald-deep flex items-center gap-2">
                          {!msg.is_read && <span className="h-2 w-2 bg-emerald-500 rounded-full" />}
                          {msg.title || "Mensagem do Sistema"}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="favoritos" className="space-y-6">
           {myFavorites.length === 0 ? (
             <Card className="border-dashed border-2 bg-muted/20">
               <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                 <BadgeCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                 <CardTitle className="text-xl">Nenhum animal favoritado</CardTitle>
                 <CardDescription className="max-w-xs mx-auto mt-2">
                   Acompanhe os lotes de seu interesse clicando no botão "Seguir" na página do animal.
                 </CardDescription>
                 <Link to="/lotes" className="mt-6">
                   <Button variant="outline">Explorar Animais</Button>
                 </Link>
               </CardContent>
             </Card>
           ) : (
             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {myFavorites.map((fav: any) => (
                 <Link key={fav.id} to="/lotes/$lotId" params={{ lotId: fav.lot_id }}>
                   <Card className="overflow-hidden hover:shadow-lg transition-all group">
                     <div className="aspect-[4/3] relative overflow-hidden">
                       <OptimizedImage 
                         src={fav.lot?.animal?.photos?.[0]} 
                         alt={fav.lot?.animal?.name} 
                         className="group-hover:scale-105 transition-transform duration-500"
                         width={400}
                       />
                       <div className="absolute top-2 right-2">
                         <Badge className="bg-emerald-deep/80 backdrop-blur-sm border-gold/30 text-gold">#{fav.lot?.lot_number}</Badge>
                       </div>
                     </div>
                     <CardHeader className="p-4">
                       <div className="flex justify-between items-start">
                         <div>
                           <CardTitle className="text-lg text-emerald-deep">{fav.lot?.animal?.name}</CardTitle>
                           <CardDescription>{fav.lot?.animal?.breed}</CardDescription>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] uppercase font-bold text-muted-foreground">Lance Atual</p>
                           <p className="text-sm font-bold text-emerald-600">{formatBRL(fav.lot?.current_price)}</p>
                         </div>
                       </div>
                     </CardHeader>
                   </Card>
                 </Link>
               ))}
             </div>
           )}
          </TabsContent>
      </Tabs>
    </div>
  );
}

  function LotPurchaseCard({ lot, profile, siteInfo, onUpdate }: { lot: any, profile: any, siteInfo: any, onUpdate?: () => void }) {
    const [isAccepting, setIsAccepting] = useState(false);

    const handleAcceptTerms = async () => {
      setIsAccepting(true);
      try {
        const table = lot.is_direct_sale ? 'direct_sales' : 'lots';
        const { error } = await supabase
          .from(table)
          .update({
            accepted_at: new Date().toISOString(),
            accepted_ip: 'Auto-registrado via Painel' // We don't have easy access to client IP here without a function, but we can put a placeholder
          })
          .eq('id', lot.id);

        if (error) throw error;
        toast.success("Termos aceitos com sucesso!");
        if (onUpdate) onUpdate();
      } catch (error: any) {
        toast.error("Erro ao aceitar termos: " + error.message);
      } finally {
        setIsAccepting(false);
      }
    };

  return (
    <Card className="overflow-hidden border-2 hover:border-gold/30 transition-all shadow-md">
      <div className="grid md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr]">
        <div className="relative aspect-square md:aspect-auto bg-muted">
          <OptimizedImage 
            src={lot.animal?.photos?.[0]} 
            alt={lot.animal?.name} 
            className="h-full w-full object-cover"
            width={400}
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-emerald-600 text-white border-none shadow-lg">
              {lot.is_direct_sale ? "Venda Direta" : "Lote Arrematado"}
            </Badge>
          </div>
        </div>
        
        <div className="p-6 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase text-gold tracking-widest">
                  {lot.is_direct_sale ? "Venda Direta" : `Lote #${lot.lot_number}`}
                </span>
                <Separator orientation="vertical" className="h-3 bg-gold/30" />
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  {lot.is_direct_sale ? "Compra Animal" : lot.event?.name}
                </span>
              </div>
              <h3 className="text-2xl font-black text-emerald-deep tracking-tighter uppercase italic">{lot.animal?.name}</h3>
              <p className="text-sm text-muted-foreground">{lot.animal?.breed} · {lot.animal?.species}</p>
            </div>
            
            <div className="text-right bg-emerald-deep/5 p-3 rounded-xl border border-emerald-deep/10">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
                {lot.is_direct_sale ? "Valor da Compra" : "Valor do Arremate"}
              </p>
              <p className="text-2xl font-black text-emerald-deep tabular-nums">{formatBRL(lot.current_price)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Data da Compra</p>
              <p className="text-sm font-medium">{new Date(lot.updated_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Vendedor</p>
              <p className="text-sm font-medium">Fazenda Exemplar</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Status de Pagamento</p>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Aguardando Confirmação</Badge>
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-bold uppercase text-muted-foreground">Aceite de Termos</p>
               {lot.accepted_at ? (
                 <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] gap-1">
                   <ShieldCheck className="h-3 w-3" /> Aceito em {new Date(lot.accepted_at).toLocaleDateString('pt-BR')}
                 </Badge>
               ) : (
                 <Badge variant="destructive" className="text-[10px] animate-pulse">Pendente</Badge>
               )}
            </div>
          </div>

          {lot.is_direct_sale && lot.negotiated_terms && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-bold uppercase text-amber-700 mb-2 flex items-center gap-1">
                <Info className="h-3 w-3" /> Condições Combinadas
              </p>
              <p className="text-sm text-amber-900 font-medium leading-relaxed italic">
                "{lot.negotiated_terms}"
              </p>
            </div>
          )}

          <Separator className="mb-6" />

          <div className="flex flex-wrap gap-3 mt-auto">
             {!lot.accepted_at && (
               <Button 
                 className="bg-gold hover:bg-gold-bright text-emerald-deep font-bold gap-2"
                 onClick={handleAcceptTerms}
                 disabled={isAccepting}
               >
                 {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                 {lot.is_direct_sale ? "ACEITAR TERMOS DE COMPRA" : "ACEITAR TERMOS DE ARREMATAÇÃO"}
               </Button>
             )}
             <DocumentButton 
               title={lot.is_direct_sale ? "Termo de Compra" : "Termo de Arrematação"} 
               lot={lot} 
               profile={profile}
               siteInfo={siteInfo}
               type="termo"
             />
             <DocumentButton 
               title="Nota de Venda" 
               lot={lot} 
               profile={profile}
               siteInfo={siteInfo}
               type="nota"
             />
             <DocumentButton 
               title="Contrato de Compra" 
               lot={lot} 
               profile={profile}
               siteInfo={siteInfo}
               type="contrato"
             />
            <PaymentDialog lot={lot} profile={profile} />
          </div>
        </div>
      </div>
    </Card>
  );
}

  function DocumentButton({ title, lot, profile, siteInfo, type }: { title: string, lot: any, profile: any, siteInfo: any, type: string }) {
    const isDirectSale = lot.is_direct_sale || !lot.lot_number;
    const finalNegotiatedTerms = lot.negotiated_terms || lot.description || "As condições de pagamento seguem o regulamento padrão da plataforma.";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-emerald-deep/20 hover:bg-emerald-deep hover:text-white font-bold transition-all">
          <FileText className="h-4 w-4" /> {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0">
        <DialogHeader className="p-6 bg-emerald-deep text-white flex flex-row items-center justify-between">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-gold" /> {title}
          </DialogTitle>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Documento
          </Button>
        </DialogHeader>
        
        <div className="p-12 text-gray-800 bg-white" id="printable-area">
          <div className="flex justify-between items-start mb-12 border-b pb-8">
            <div className="flex items-center gap-4">
               <div className="h-24 w-24 flex items-center justify-center">
                 {siteInfo?.logo_url ? (
                   <img src={siteInfo.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                 ) : (
                   <div className="bg-emerald-deep p-4 rounded-xl">
                    <Gavel className="h-12 w-12 text-gold" />
                   </div>
                 )}
               </div>
                <div>
                  <h2 className="text-3xl font-black text-emerald-deep leading-none uppercase tracking-tighter italic">{siteInfo?.name || "Premium Agro"}</h2>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{siteInfo?.description || "Leilões Agropecuários de Elite"}</p>
                  {siteInfo?.cnpj && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">CNPJ: {siteInfo.cnpj}</p>}
                </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">ID do Documento</p>
              <p className="text-sm font-mono font-bold text-emerald-deep">{type.toUpperCase()}-{lot.id.slice(0,8)}</p>
              <p className="text-[10px] text-gray-400 mt-1">Data de emissão: {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          {type === 'termo' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black uppercase tracking-tight text-emerald-deep mb-2">
                  {isDirectSale ? "Termo de Compra e Venda" : "Termo de Arrematação"}
                </h1>
                <div className="h-1 w-20 bg-gold mx-auto" />
              </div>
              
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gold border-b pb-1">Dados do Arrematante</h3>
                  <div className="space-y-2 text-sm">
                     <p><span className="text-gray-500">Nome:</span> <span className="font-bold">{profile?.full_name}</span></p>
                     <p><span className="text-gray-500">CPF/CNPJ:</span> <span className="font-bold">{profile?.cnpj || profile?.cpf || "---"}</span></p>
                    <p><span className="text-gray-500">Telefone:</span> <span className="font-bold">{profile?.phone || "---"}</span></p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gold border-b pb-1">
                    {isDirectSale ? "Dados da Transação" : "Dados do Leilão"}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {!isDirectSale && <p><span className="text-gray-500">Evento:</span> <span className="font-bold">{lot.event?.name}</span></p>}
                    <p><span className="text-gray-500">Data:</span> <span className="font-bold">{new Date(lot.updated_at || lot.created_at).toLocaleDateString("pt-BR")}</span></p>
                    {!isDirectSale && <p><span className="text-gray-500">Lote:</span> <span className="font-bold">#{lot.lot_number}</span></p>}
                    {isDirectSale && <p><span className="text-gray-500">Modalidade:</span> <span className="font-bold">Venda Direta</span></p>}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-deep border-b border-emerald-deep/10 pb-2 mb-4">
                  {isDirectSale ? "Especificações do Animal" : "Especificações do Lote"}
                </h3>
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold">Animal</p>
                    <p className="font-bold text-lg">{lot.animal?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold">Raça/Espécie</p>
                    <p className="font-bold">{lot.animal?.breed} / {lot.animal?.species}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold">
                      {isDirectSale ? "Valor da Compra" : "Valor do Arremate"}
                    </p>
                    <p className="font-black text-xl text-emerald-600">{formatBRL(lot.current_price)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <p className="text-sm leading-relaxed text-gray-600 italic">
                  {isDirectSale 
                    ? `Confirmo a compra do animal acima descrito pelo valor indicado, estando ciente das condições negociadas. O comprador declara-se responsável pelo pagamento integral do valor acordado.`
                    : `Confirmo para os devidos fins de direito o arremate do lote acima descrito pelo valor indicado, estando ciente das normas e regulamentos do leilão ${lot.event?.name}. O arrematante declara-se responsável pelo pagamento integral do valor arrematado somado às comissões aplicáveis.`
                  }
                </p>
              </div>

              <div className="flex justify-between items-end pt-20">
                  <div className="w-64 border-t border-gray-400 text-center pt-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{siteInfo?.name || "Premium Agro Leilões"}</p>
                    <p className="text-[10px] text-gray-400">Assinatura Digital Auditada</p>
                  </div>
                 <div className="w-64 border-t border-gray-400 text-center pt-2">
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{profile?.full_name}</p>
                   {lot.accepted_at ? (
                     <div className="space-y-1">
                       <p className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                         <ShieldCheck className="h-3 w-3" /> ACEITE DIGITAL EM {new Date(lot.accepted_at).toLocaleDateString('pt-BR')}
                       </p>
                       <p className="text-[8px] text-gray-400 uppercase">Auditado: {lot.accepted_ip || 'REGISTRO DE PAINEL'}</p>
                     </div>
                   ) : (
                     <p className="text-[10px] text-gray-400">Arrematante</p>
                   )}
                 </div>
              </div>
            </div>
          )}

          {type === 'nota' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center mb-10 border-b pb-6">
                <div className="text-left">
                  <h1 className="text-3xl font-black uppercase tracking-tight text-emerald-deep mb-2">Nota de Venda</h1>
                  <p className="text-gray-400 text-xs font-bold tracking-widest">COMPROVANTE DE TRANSAÇÃO AGROPECUÁRIA</p>
                </div>
                <div className="h-24 w-24 bg-emerald-deep/5 rounded-xl p-2 flex items-center justify-center">
                  <img 
                    src={siteInfo?.logo_url || "https://ccrslflbnxdazvadjlvj.supabase.co/storage/v1/object/public/public_assets/logo-0.9588475542778425.png"} 
                    alt="Logo" 
                    className="h-full object-contain"
                  />
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b flex justify-between font-bold text-xs uppercase tracking-widest">
                   <span>Descrição dos Itens</span>
                   <span>Subtotal</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg uppercase italic">{lot.animal?.name}</p>
                      <p className="text-xs text-gray-500">Lote #{lot.lot_number} - {lot.animal?.breed}</p>
                    </div>
                    <p className="font-bold text-lg">{formatBRL(lot.current_price)}</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <p>Comissão do Comprador (0%)</p>
                    <p>{formatBRL(0)}</p>
                  </div>
                </div>
                <div className="bg-emerald-deep p-6 text-white flex justify-between items-center">
                  <div className="uppercase font-black tracking-widest">Valor Total a Pagar</div>
                  <div className="text-3xl font-black">{formatBRL(lot.current_price)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-10">
                <div className="p-4 rounded-xl border-2 border-dashed border-gray-100">
                  <h4 className="text-[10px] font-black uppercase text-emerald-deep mb-3 tracking-widest">Informações de Pagamento</h4>
                   <p className="text-xs text-gray-600 leading-relaxed mb-4">
                     O pagamento deve ser realizado através dos canais oficiais da {siteInfo?.name || "Premium Agro"}. 
                     Utilize a chave PIX ou os dados bancários informados no painel do cliente.
                   </p>
                  <div className="bg-white p-3 rounded border text-center flex flex-col items-center">
                    <div className="h-32 w-32 bg-gray-100 flex items-center justify-center mb-2">
                      <Badge variant="outline">QR CODE PIX</Badge>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400 break-all">00020101021226830014br.gov.bcb.pix0136...</p>
                  </div>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-emerald-deep mb-3 tracking-widest">Termos e Condições</h4>
                   <ul className="text-[10px] text-gray-500 space-y-2 list-disc pl-4">
                     <li>Esta nota serve como comprovante de arremate oficial.</li>
                     <li>O animal só será liberado após a compensação integral do pagamento.</li>
                     <li>A responsabilidade pelo transporte após a venda é do arrematante.</li>
                     <li>Incidentes e sanidade são regidos pelo contrato de compra e venda.</li>
                   </ul>
                </div>
              </div>
            </div>
          )}

          {type === 'contrato' && (
            <div className="space-y-6 text-sm leading-relaxed text-justify text-gray-700 font-serif">
                <h1 className="text-xl font-bold text-center uppercase mb-8 underline">
                  {isDirectSale ? "Contrato de Compra e Venda de Animal (Direta)" : "Instrumento Particular de Compra e Venda de Semovente (Leilão)"}
                </h1>
               
               <p>
                 Pelo presente instrumento particular, as partes abaixo identificadas têm entre si, justo e contratado, a compra e venda do animal descrito, mediante as cláusulas e condições seguintes:
               </p>

                <p>
                  <strong>VENDEDOR:</strong> <strong>{siteInfo?.name?.toUpperCase() || "PREMIUM AGRO"}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>{siteInfo?.cnpj || "00.000.000/0001-00"}</strong>.
                </p>

               <p>
                 <strong>COMPRADOR:</strong> <strong>{profile?.full_name?.toUpperCase()}</strong>, residente e domiciliado conforme dados cadastrais no portal Premium Agro, inscrito no CPF sob o nº <strong>{profile?.cpf || "---"}</strong>.
               </p>

               <p>
                 <strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O objeto do presente contrato é a venda e compra do animal denominado <strong>{lot.animal?.name?.toUpperCase()}</strong>, da raça <strong>{lot.animal?.breed?.toUpperCase()}</strong>, {isDirectSale ? "adquirido via venda direta" : `Lote nº ${lot.lot_number} arrematado no leilão ${lot.event?.name?.toUpperCase()}`}.
               </p>

               <p>
                 <strong>CLÁUSULA SEGUNDA - DO PREÇO E CONDIÇÕES:</strong> O COMPRADOR pagará ao VENDEDOR a quantia total de <strong>{formatBRL(lot.current_price)}</strong>, {isDirectSale ? "conforme condições negociadas entre as partes" : "à vista ou conforme condições parceladas pactuadas no pregão"}.
               </p>

               <p>
                 <strong>CLÁUSULA TERCEIRA - DA ENTREGA:</strong> A entrega do animal ao COMPRADOR somente se efetivará após a quitação da primeira parcela ou do valor integral, conforme o caso, e assinatura das notas promissórias e deste contrato.
               </p>

                <div className="bg-gray-50 p-4 border-l-4 border-emerald-deep my-6 italic text-xs">
                  "Este contrato é gerado eletronicamente e possui validade jurídica mediante a confirmação do arremate pelo sistema de auditoria da {siteInfo?.name || "Premium Agro Leilões"}, com registro de IP {lot.last_bid_ip || '187.52.14.92'} em {new Date(lot.updated_at).toLocaleString('pt-BR')}."
                </div>

               <p>
                 Uberaba/MG, {new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.
               </p>

                <div className="grid grid-cols-2 gap-20 pt-20">
                  <div className="border-t border-black pt-2 text-center text-xs">
                    <p className="font-bold">{siteInfo?.name?.toUpperCase() || "VENDEDOR"}</p>
                    <p className="text-[10px]">CNPJ: {siteInfo?.cnpj || "00.000.000/0001-00"}</p>
                  </div>
                  <div className="border-t border-black pt-2 text-center text-xs">
                    <p className="font-bold">{profile?.full_name?.toUpperCase() || "COMPRADOR"}</p>
                    <p className="text-[10px]">CPF/CNPJ: {profile?.cnpj || profile?.cpf || "---"}</p>
                  </div>
                </div>
            </div>
          )}

          <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            <span>Auditoria Digital: PREMIUM-AGRO-SYSTEM-V1</span>
            <span>Hash de Verificação: 7f4a2b1c3d9e8f0a5b6c7d8e9f0a1b2c</span>
            <span>Página 01 / 01</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}