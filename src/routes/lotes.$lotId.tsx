import { createFileRoute, Link, notFound } from "@tanstack/react-router";
 import { Eye, Gavel, Heart, Share2, Award, Loader2, FileText, Video, Stethoscope, ChevronRight, Calculator, Info, MessageSquare, Zap, Download, Scale, Ruler, Fingerprint, Calendar, MapPin, Sparkles, Timer, PlayCircle, Users, ShieldAlert, CheckCircle2, AlertCircle, AlertTriangle, Printer, Expand } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { LotDetailSkeleton } from "@/components/ui/page-skeleton";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffectiveLotStatus } from "@/utils/auction-status";
import { formatBRL } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/auctions/status-badge";
import { Countdown } from "@/components/auctions/countdown";
import { supabase } from "@/integrations/supabase/client";
import { lotSchema } from "@/lib/schemas";
import { useAuth } from "@/components/auth/auth-provider";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/lotes/$lotId")({
  loader: async ({ params }) => {
    const { lotId } = params;
    if (!lotId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lotId)) {
      throw notFound();
    }

    const [lotRes, bidsRes] = await Promise.all([
       supabase
         .from("lots")
         .select("*, animal:animals(*, seller:sellers(name)), event:events!lots_event_id_fkey(*)")
         .eq("id", lotId)
         .maybeSingle(),
      supabase
        .from("bids")
        .select("*, profile:profiles(full_name)")
        .eq("lot_id", lotId)
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    if (lotRes.error || !lotRes.data) {
      throw notFound();
    }

    try {
      const validatedLot = lotSchema.parse(lotRes.data);
      return { lot: validatedLot, initialBids: bidsRes.data || [] };
    } catch (e) {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: "Lote " + loaderData.lot.lot_number + " — " + (loaderData.lot.animal?.name || 'Animal') },
    ] : [],
  }),
  component: LotDetail,
  pendingComponent: LotDetailSkeleton,
  errorComponent: ErrorFallback,
});

function GenealogyTree({ genealogy }: { genealogy: any }) {
  if (!genealogy) return <div className="py-10 text-center text-muted-foreground">Informação de genealogia não disponível.</div>;

  const pai = genealogy.father || genealogy.pai || "Não informado";
  const mae = genealogy.mother || genealogy.mae || "Não informado";
  
  const avos = [
    genealogy.grandfather_paternal || genealogy.avo_paterno || "A definir",
    genealogy.grandmother_paternal || "A definir",
    genealogy.grandfather_maternal || genealogy.avo_materno || "A definir",
    genealogy.grandmother_maternal || "A definir"
  ];

  const bisavos = [
    genealogy.great_grandfather_pp || "A definir",
    genealogy.great_grandmother_pp || "A definir",
    genealogy.great_grandfather_pm || "A definir",
    genealogy.great_grandmother_pm || "A definir",
    genealogy.great_grandfather_mp || "A definir",
    genealogy.great_grandmother_mp || "A definir",
    genealogy.great_grandfather_mm || "A definir",
    genealogy.great_grandmother_mm || "A definir"
  ];

  const Node = ({ title, name, variant = "secondary" }: { title: string, name: string, variant?: "primary" | "secondary" | "tertiary" }) => (
    <div className={`
      relative rounded-xl border transition-all p-3 text-center flex flex-col justify-center min-h-[70px]
      ${variant === 'primary' ? 'border-2 border-gold bg-emerald-deep shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 
        variant === 'secondary' ? 'border-white/10 bg-white/5 hover:border-gold/30' : 
        'border-white/5 bg-white/5 hover:bg-gold/5'}
    `}>
      <div className={`uppercase font-black tracking-[0.2em] mb-1 
        ${variant === 'primary' ? 'text-[8px] text-gold/60' : 
          variant === 'secondary' ? 'text-[7px] text-gold/40' : 
          'text-[6px] text-white/30'}
      `}>{title}</div>
      <div className={`font-black uppercase italic leading-tight line-clamp-2 
        ${variant === 'primary' ? 'text-xs md:text-base text-white' : 
          variant === 'secondary' ? 'text-[10px] md:text-sm text-white' : 
          'text-[9px] md:text-xs text-white/80'}
      `}>{name}</div>
    </div>
  );

  return (
    <div className="relative overflow-hidden py-6 md:py-10 bg-black/40 rounded-[2rem] border border-white/5 shadow-inner">
      <div className="hidden md:flex justify-center items-stretch gap-8 px-12 overflow-x-auto scrollbar-hide min-w-[900px]">
        <div className="flex flex-col justify-center">
          <div className="w-44">
            <Node title="Animal" name="Principal" variant="primary" />
          </div>
        </div>

        <div className="flex flex-col justify-around gap-12 relative w-56">
          <div className="absolute -left-4 top-[25%] bottom-[25%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          <Node title="Pai (Sire)" name={pai} />
          <Node title="Mãe (Dam)" name={mae} />
        </div>

        <div className="flex flex-col justify-around gap-6 relative w-44">
          <div className="absolute -left-4 top-[12%] bottom-[62%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          <div className="absolute -left-4 top-[62%] bottom-[12%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          {avos.map((name, i) => (
            <Node key={i} title={i === 0 ? "Avô Pat." : i === 1 ? "Avó Pat." : i === 2 ? "Avô Mat." : "Avó Mat."} name={name} variant="tertiary" />
          ))}
        </div>

        <div className="flex flex-col justify-around gap-2 relative w-40">
          <div className="absolute -left-4 top-[6%] bottom-[81%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          <div className="absolute -left-4 top-[31%] bottom-[56%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          <div className="absolute -left-4 top-[56%] bottom-[31%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          <div className="absolute -left-4 top-[81%] bottom-[6%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          {bisavos.map((name, i) => (
            <Node key={i} title={i % 2 === 0 ? "Bisavô" : "Bisavó"} name={name} variant="tertiary" />
          ))}
        </div>
      </div>

      <div className="flex md:hidden flex-col gap-6 px-4">
        <div className="space-y-4">
          <Node title="Animal" name="Principal" variant="primary" />
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <Node title="Pai" name={pai} />
              <div className="grid gap-2 pl-2 border-l border-gold/20">
                <Node title="Avô Pat." name={avos[0]} variant="tertiary" />
                <Node title="Avó Pat." name={avos[1]} variant="tertiary" />
              </div>
            </div>
            <div className="space-y-3">
              <Node title="Mãe" name={mae} />
              <div className="grid gap-2 pl-2 border-l border-gold/20">
                <Node title="Avô Mat." name={avos[2]} variant="tertiary" />
                <Node title="Avó Mat." name={avos[3]} variant="tertiary" />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <div className="text-[8px] font-black text-gold/40 uppercase tracking-widest text-center">Bisavós</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                {bisavos.slice(0, 4).map((name, i) => (
                  <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5 text-[9px] text-white/70 italic truncate">
                    {name}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {bisavos.slice(4, 8).map((name, i) => (
                  <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5 text-[9px] text-white/70 italic truncate">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallmentSimulator({ price, commissionRate }: { price: number, commissionRate: number }) {
  const options = [1, 12, 24, 30, 36, 48, 60, 72];
  const buyerCommission = price * (commissionRate / 100);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-gold hover:text-gold-bright flex items-center gap-1">
          <Calculator className="h-3 w-3" /> Ver simulador de parcelas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-emerald-deep border-gold/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Simulador de Pagamento</DialogTitle>
          <DialogDescription className="text-white/60">
            Veja as condições de parcelamento para este lote.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
           <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
             <div className="flex justify-between text-xs text-white/60 mb-1">
               <span>Valor do Animal:</span>
               <span>{formatBRL(price)}</span>
             </div>
             <div className="flex justify-between text-xs text-white/60 mb-1">
               <span>Comissão ({commissionRate}%):</span>
               <span>{formatBRL(buyerCommission)}</span>
             </div>
             <div className="flex justify-between text-sm font-bold text-gold pt-2 border-t border-white/10">
               <span>Total do Investimento:</span>
               <span>{formatBRL(price + buyerCommission)}</span>
             </div>
           </div>
           <div className="text-[10px] uppercase font-black text-white/40 mb-2 tracking-widest">Planos de Parcelamento</div>
           <div className="flex items-center justify-between p-3 rounded-lg bg-gold/10 border border-gold/20 mb-2">
             <div className="flex flex-col">
               <span className="text-sm font-bold text-gold">À Vista (PIX/TED)</span>
               <span className="text-[10px] text-gold/60">Com 5% de desconto no valor do lote</span>
             </div>
             <span className="font-black text-lg text-gold">{formatBRL((price * 0.95) + buyerCommission)}</span>
           </div>
           {options.filter(o => o !== 1).map((opt) => (
             <div key={opt} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg">
               <span className="text-sm font-medium text-white/80">{opt} parcelas iguais</span>
               <span className="font-bold text-white">{formatBRL(price / opt)}</span>
             </div>
           ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LotDetail() {
  const { lot: initialLot, initialBids } = Route.useLoaderData() as any;
  const { user, profile } = useAuth();
  const [lot, setLot] = useState(initialLot);
  const [recentBids, setRecentBids] = useState<any[]>(initialBids);
  const [isBidding, setIsBidding] = useState(false);
  const [showConfirmBid, setShowConfirmBid] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
   const [activePhoto, setActivePhoto] = useState(0);
   const [activeTab, setActiveTab] = useState("detalhes");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isOfferLoading, setIsOfferLoading] = useState(false);
  const [offerData, setOfferData] = useState({ amount: "", description: "" });

  useEffect(() => {
    const lotChannel = supabase
      .channel(`lot-${lot.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lots", filter: "id=eq." + lot.id }, (p) => setLot((prev:any) => ({...prev, ...p.new})))
      .subscribe();

    const bidsChannel = supabase
      .channel(`bids-${lot.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids", filter: "lot_id=eq." + lot.id }, async (p) => {
         const { data: profileData } = await supabase.from("profiles").select("id, full_name").eq("id", p.new.user_id).single();
         const newBid = { ...p.new, profile: profileData };
        setRecentBids(prev => [newBid, ...prev].slice(0, 10));
      })
      .subscribe();

    if (user) {
      supabase.from("followed_lots").select("id").eq("user_id", user.id).eq("lot_id", lot.id).maybeSingle().then(r => setIsFavorite(!!r.data));
    }
    return () => { 
      supabase.removeChannel(lotChannel); 
      supabase.removeChannel(bidsChannel);
    };
  }, [lot.id, user]);

  const placeBid = (amount: number) => {
    if (!user) { toast.error("Faça login para dar lances."); return; }
    setPendingBidAmount(amount);
    setShowConfirmBid(true);
  };

  const executeBid = async (amount: number) => {
    setIsBidding(true);
    try {
      const { data, error } = await supabase.rpc("place_bid_safe", { p_lot_id: lot.id, p_amount: amount, p_bid_type: "online", p_session_id: "client-side" });
      if (error) throw error;
      toast.success("Lance efetuado!");
    } catch (e: any) { toast.error(e.message); }
    finally { setIsBidding(false); setShowConfirmBid(false); }
  };

  const handleSendOffer = async () => {
    if (!user) { toast.error("Faça login para enviar uma proposta."); return; }
    if (!offerData.amount) { toast.error("Informe o valor da proposta."); return; }
    
    setIsOfferLoading(true);
    try {
      const { error } = await supabase.from("offers").insert({
        lot_id: lot.id,
        user_id: user.id,
        amount: parseFloat(offerData.amount),
        description: offerData.description
      });

      if (error) throw error;
      toast.success("Proposta enviada com sucesso! O vendedor entrará em contato.");
      setIsOfferDialogOpen(false);
      setOfferData({ amount: "", description: "" });
    } catch (e: any) {
      toast.error("Erro ao enviar proposta: " + e.message);
    } finally {
      setIsOfferLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) { toast.error("Faça login."); return; }
    setIsFavoriteLoading(true);
    try {
      if (isFavorite) { await supabase.from("followed_lots").delete().eq("user_id", user.id).eq("lot_id", lot.id); setIsFavorite(false); }
      else { await supabase.from("followed_lots").insert({ user_id: user.id, lot_id: lot.id }); setIsFavorite(true); }
    } finally { setIsFavoriteLoading(false); }
  };

   const currentPrice = lot?.current_price || lot?.starting_price || 0;
   const isSold = lot?.status === 'sold';
  const isPassed = lot?.status === 'passed';
   const nextBid = currentPrice + (lot?.bid_increment || 0);
  const dynamicStatus = useEffectiveLotStatus({
     status: lot.status,
     event_status: lot.event?.status,
     event_type: lot.event?.event_type,
     event_start_date: lot.event?.start_date,
     event_end_date: lot.event?.end_date,
     allows_pre_bidding: lot.event?.allows_pre_bidding
   });

  const isBiddingOpen = (dynamicStatus === 'live' || dynamicStatus === 'recebendo_lances' || dynamicStatus === 'pre_lance') && !isSold && !isPassed;

  const [isUrgent, setIsUrgent] = useState(false);
  const installments = 30;
  const installmentValue = currentPrice / installments;
   const COMMISSION_RATE = lot.event?.commission_rate ?? 5;
  const BUYER_COMMISSION = currentPrice * (COMMISSION_RATE / 100);

  const getAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) { years--; months += 12; }
    return years === 0 ? months + " meses" : years + " anos e " + months + " meses";
  };

  return (
    <div className="min-h-screen bg-background">
       <div className="hidden print:block p-8 text-black bg-white min-h-screen">
         <div className="border-b-4 border-emerald-900 pb-4 mb-8 flex justify-between items-end">
           <div>
             <h1 className="text-5xl font-black uppercase text-emerald-900 leading-none">{lot.animal?.name}</h1>
             <p className="text-2xl text-emerald-700 font-bold uppercase tracking-widest mt-2">Lote #{lot.lot_number} — {lot.animal?.breed}</p>
           </div>
           <div className="text-right">
             <p className="font-black text-emerald-900 uppercase">Gado Elite</p>
             <p className="text-xs text-gray-500 uppercase font-bold">{lot.event?.name}</p>
           </div>
         </div>
 
         <div className="grid grid-cols-[1.5fr_1fr] gap-8">
           <div className="space-y-6">
             <img src={lot.animal?.photos?.[0]} className="rounded-3xl shadow-xl w-full aspect-video object-cover" />
             
             <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
               <h2 className="text-lg font-black text-emerald-900 uppercase mb-4 border-b border-emerald-200 pb-2">Informações Técnicas</h2>
               <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                 <div>
                   <p className="text-[10px] text-emerald-600 uppercase font-bold">Vendedor</p>
                   <p className="font-bold text-gray-900">{lot.animal?.seller?.name || "Não informado"}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-emerald-600 uppercase font-bold">Peso</p>
                   <p className="font-bold text-gray-900">{lot.animal?.weight ? `${lot.animal.weight}kg` : "—"}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-emerald-600 uppercase font-bold">Idade</p>
                   <p className="font-bold text-gray-900">{getAge(lot.animal?.birth_date) || "—"}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-emerald-600 uppercase font-bold">Data de Nasc.</p>
                   <p className="font-bold text-gray-900">{lot.animal?.birth_date ? new Date(lot.animal.birth_date).toLocaleDateString('pt-BR') : "—"}</p>
                 </div>
               </div>
             </div>
 
             <div>
               <h2 className="text-lg font-black text-emerald-900 uppercase mb-3 border-b border-emerald-100 pb-1">Descrição</h2>
               <p className="text-sm text-gray-700 leading-relaxed italic">{lot.animal?.description || "Sem descrição disponível."}</p>
             </div>
           </div>
 
           <div className="space-y-6">
             <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-lg">
               <p className="text-[10px] text-emerald-200 uppercase font-black tracking-widest mb-1">Avaliação do Lote</p>
               <p className="text-4xl font-black italic">{formatBRL(currentPrice)}</p>
               <div className="mt-4 pt-4 border-t border-emerald-800 space-y-2">
                 <p className="text-xs text-emerald-100"><b>Plano Sugerido:</b> 30 parcelas de {formatBRL(installmentValue)}</p>
                 <p className="text-xs text-emerald-100"><b>Comissão:</b> {COMMISSION_RATE}% sobre o arremate</p>
               </div>
             </div>
 
             <div className="p-6 border-2 border-dashed border-emerald-100 rounded-3xl">
               <h2 className="text-lg font-black text-emerald-900 uppercase mb-4 text-center">Genealogia Simplificada</h2>
               <div className="space-y-4">
                 <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                   <p className="text-[8px] text-gray-400 uppercase font-bold">Pai (Sire)</p>
                   <p className="font-black text-sm uppercase italic">{lot.animal?.genealogy?.father || "Não informado"}</p>
                 </div>
                 <div className="flex justify-center h-4">
                   <div className="w-px bg-gray-200" />
                 </div>
                 <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                   <p className="text-[8px] text-gray-400 uppercase font-bold">Mãe (Dam)</p>
                   <p className="font-black text-sm uppercase italic">{lot.animal?.genealogy?.mother || "Não informado"}</p>
                 </div>
               </div>
             </div>
 
             <div className="p-6 bg-gray-50 rounded-3xl text-[9px] text-gray-400 leading-tight space-y-2">
               <p className="font-bold uppercase text-gray-500">Condições Gerais</p>
               <p>Este documento é um encarte informativo do animal. Os valores apresentados referem-se à última oferta registrada no momento da impressão. O arremate final está sujeito às regras do leilão.</p>
             </div>
           </div>
         </div>
       </div>

      <div className="min-h-screen bg-background print:hidden">
        <header className="border-b border-gold/20 bg-emerald-deep py-4 sticky top-0 z-50">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <Link to="/ao-vivo" className="text-white">← Voltar</Link>
            <div className="text-center">
              <h1 className="text-white font-bold uppercase">Lote #{lot.lot_number}</h1>
              <p className="text-gold/80 text-[10px] uppercase font-bold">{lot.event?.name}</p>
            </div>
            <StatusBadge status={dynamicStatus} urgent={isUrgent} />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-8">
               <div className="rounded-3xl overflow-hidden border border-white/10 relative group">
                <OptimizedImage src={lot.animal?.photos?.[activePhoto] || ""} alt={lot.animal?.name || "Animal"} width={1200} aspectRatio="landscape" />
                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Expand className="h-12 w-12 text-white/50" />
                 </div>
               </div>
               <div className="grid grid-cols-5 gap-3">
                 {lot.animal?.photos?.map((s:string, i:number) => (
                   <button key={i} onClick={() => setActivePhoto(i)} className={`rounded-xl overflow-hidden border-2 ${activePhoto === i ? 'border-gold' : 'border-transparent'}`}>
                    <OptimizedImage src={s} alt={`${lot.animal?.name} - foto ${i + 1}`} width={200} aspectRatio="square" />
                   </button>
                 ))}
               </div>
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="bg-emerald-deep/20">
                   <TabsTrigger value="detalhes">Descrição</TabsTrigger>
                   <TabsTrigger value="genealogia">Genealogia</TabsTrigger>
                    <TabsTrigger value="videos">Vídeo</TabsTrigger>
                    <TabsTrigger value="saude">Saúde</TabsTrigger>
                    <TabsTrigger value="historico">Lances</TabsTrigger>
                 </TabsList>
                 <TabsContent value="detalhes" className="mt-6">
                   <Card className="bg-card/50 border-white/5 p-8">
                     <p className="text-white/80 leading-relaxed italic">{lot.animal?.description}</p>
                     <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="p-4 bg-white/5 rounded-2xl text-center">
                         <p className="text-[10px] text-gold/40 uppercase font-black">Raça</p>
                         <p className="font-bold text-white">{lot.animal?.breed}</p>
                       </div>
                        <div className="p-4 bg-white/5 rounded-2xl text-center">
                          <p className="text-[10px] text-gold/40 uppercase font-black">Idade</p>
                          <p className="font-bold text-white">{getAge(lot.animal?.birth_date)}</p>
                        </div>
                        {lot.animal?.weight && (
                          <div className="p-4 bg-white/5 rounded-2xl text-center">
                            <p className="text-[10px] text-gold/40 uppercase font-black">Peso</p>
                            <p className="font-bold text-white">{lot.animal.weight}kg</p>
                          </div>
                        )}
                        {lot.animal?.location && (
                          <div className="p-4 bg-white/5 rounded-2xl text-center">
                            <p className="text-[10px] text-gold/40 uppercase font-black">Localização</p>
                            <p className="font-bold text-white">{lot.animal.location}</p>
                          </div>
                        )}
                      </div>
 
                      {lot.animal?.vaccination_records && lot.animal.vaccination_records.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-sm font-black uppercase text-gold/60 mb-4 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" /> Registro de Vacinação
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {lot.animal.vaccination_records.map((v: any, idx: number) => (
                              <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  <span className="text-xs font-bold text-white/80">
                                    {typeof v === 'string' ? v : (v.vaccine || v.name || v.label)}
                                  </span>
                                </div>
                                {v.date && <span className="text-[10px] text-white/40">{v.date}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                   </Card>
                 </TabsContent>
                 <TabsContent value="genealogia" className="mt-6">
                   <GenealogyTree genealogy={lot.animal?.genealogy} />
                 </TabsContent>
                  <TabsContent value="videos" className="mt-6">
                    <div className="aspect-video rounded-3xl overflow-hidden bg-black flex items-center justify-center">
                      {lot.animal?.youtube_url ? (
                        <iframe 
                          src={(() => {
                            try {
                              const url = new URL(lot.animal.youtube_url);
                              if (url.hostname.includes('youtube.com')) return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
                              if (url.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${url.pathname.substring(1)}`;
                              return lot.animal.youtube_url;
                            } catch (e) {
                              return lot.animal.youtube_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/");
                            }
                          })()} 
                          className="w-full h-full" 
                          allowFullScreen 
                        />
                      ) : (
                        <div className="text-center space-y-4">
                          <Video className="h-12 w-12 text-white/20 mx-auto" />
                          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Nenhum vídeo disponível</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="saude" className="mt-6">
                    <Card className="bg-card/50 border-white/5 p-8">
                      <h3 className="text-sm font-black uppercase text-gold/60 mb-6 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" /> Histórico Veterinário e Saúde
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Checklist de Saúde</p>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { id: "prognata", label: "Prognata" },
                              { id: "aerofagico", label: "Aerofágico" },
                              { id: "criptorquidico", label: "Criptorquídico" },
                              { id: "cirurgia_neurectomia", label: "Cirurgia de neurectomia" },
                              { id: "laminite", label: "Laminite" },
                              { id: "cirurgia_colica", label: "Cirurgia de Cólica" },
                              { id: "dpco", label: "DPCO" },
                              { id: "cirurgia_grave", label: "Cirurgia Grave" },
                              { id: "cicatrizes", label: "Cicatrizes" },
                              { id: "hypp", label: "HYPP" },
                            ].map(item => {
                              const val = lot.animal?.veterinary_history?.[item.id];
                              return (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                  <span className="text-xs text-white/80">{item.label}</span>
                                  {val ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-white/10" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-3">Observações Adicionais</p>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm text-white/60 italic">
                              {lot.animal?.veterinary_history?.other_info || "Nenhuma observação adicional registrada."}
                            </div>
                          </div>
                          {lot.animal?.health_info && Object.keys(lot.animal.health_info).length > 0 && (
                            <div>
                              <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-3">Informações de Saúde</p>
                              <div className="space-y-2">
                                {Object.entries(lot.animal.health_info).map(([key, val]: [string, any]) => (
                                  <div key={key} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gold/40 uppercase font-black mb-1">{key}</p>
                                    <p className="text-xs text-white/80">{String(val)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                  <TabsContent value="historico" className="mt-6">
                    <Card className="bg-card/50 border-white/5 p-8">
                      <h3 className="text-sm font-black uppercase text-gold/60 mb-6 flex items-center gap-2">
                        <Gavel className="h-4 w-4" /> Histórico de Lances
                      </h3>
                      
                      <div className="space-y-3">
                        {recentBids.length > 0 ? (
                          recentBids.map((bid, idx) => (
                            <div key={bid.id} className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? 'bg-gold/10 border-gold/30' : 'bg-white/5 border-white/5'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-gold text-emerald-deep' : 'bg-white/10 text-white/40'}`}>
                                  {idx + 1}
                                </div>
                                <div>
                                   <p className="font-bold text-white">
                                      {bid.bid_type === 'security'
                                        ? "Auditório/Mesa"
                                        : (bid.is_phone_bid && bid.phone_bidder_identifier 
                                          ? bid.phone_bidder_identifier 
                                          : (bid.profile?.full_name || "Licitante"))}
                                   </p>
                                  <p className="text-[10px] text-white/40 uppercase font-bold">
                                    {new Date(bid.created_at).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-black italic ${idx === 0 ? 'text-gold' : 'text-white'}`}>
                                  {formatBRL(bid.amount)}
                                </p>
                                {idx === 0 && <span className="text-[8px] font-black uppercase bg-gold text-emerald-deep px-2 py-0.5 rounded-full">LANCE ATUAL</span>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center space-y-4">
                            <Gavel className="h-12 w-12 text-white/10 mx-auto" />
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Ainda não há lances para este lote</p>
                            <p className="text-white/20 text-[10px]">Seja o primeiro a ofertar!</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-6">
                <Card className="bg-emerald-deep/95 border-gold/20 p-8 rounded-[2.3rem] w-full">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-4xl font-black text-white italic leading-none">{lot.animal?.name}</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gold hover:text-gold-bright hover:bg-gold/10 gap-2 font-bold h-auto p-2" 
                      onClick={() => setActiveTab("videos")}
                    >
                      <Video className="h-5 w-5" /> VER VÍDEO
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-8 bg-black/40 rounded-[2rem] border border-white/5">
                   <p className="text-gold font-black uppercase text-[10px]">Oferta Atual</p>
                   <p className="text-5xl font-black text-white italic">{formatBRL(currentPrice)}</p>
                   <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                     <p className="text-white/60 font-bold">30x {formatBRL(installmentValue)}</p>
                     <InstallmentSimulator price={currentPrice} commissionRate={COMMISSION_RATE} />
                   </div>
                 </div>
                   <div className="mt-8 space-y-6">
                     {isBiddingOpen && (
                       <div className="space-y-3">
                         <p className="text-[10px] font-black text-gold/60 uppercase tracking-widest text-center">Sugestões de Lance</p>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                           {[lot.bid_increment || 100, (lot.bid_increment || 100) * 2, (lot.bid_increment || 100) * 5, (lot.bid_increment || 100) * 10].map((inc) => (
                             <Button 
                               key={inc} 
                               variant="outline" 
                               className="h-12 border-white/10 bg-white/5 hover:bg-gold/20 hover:border-gold/50 text-white font-black text-xs"
                               onClick={() => placeBid(currentPrice + inc)}
                             >
                               +{formatBRL(inc).replace('R$', '').trim()}
                             </Button>
                           ))}
                         </div>
                       </div>
                     )}
                     <Button 
                       size="lg" 
                       className={`w-full h-20 font-black text-2xl rounded-2xl ${!isBiddingOpen ? 'bg-gray-500 cursor-not-allowed grayscale' : 'bg-gold-gradient text-emerald-deep'}`} 
                       onClick={() => isBiddingOpen && placeBid(nextBid)}
                       disabled={!isBiddingOpen}
                     >
                       {isSold ? 'LOTE ARREMATADO' : isPassed ? 'LOTE FINALIZADO' : !isBiddingOpen ? 'AGUARDANDO ABERTURA' : 'CONFIRMAR LANCE'}
                     </Button>
                   <div className="grid grid-cols-2 gap-4">
                     <Button variant="outline" className={`h-14 rounded-2xl ${isFavorite ? 'text-gold border-gold' : 'text-white'}`} onClick={toggleFavorite}>
                       <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-gold' : ''}`} /> {isFavorite ? 'SEGUINDO' : 'SEGUIR'}
                     </Button>
                      <Button
                        variant="outline"
                        className="h-14 rounded-2xl text-white"
                        onClick={() => {
                          const url = window.location.href;
                          const text = `Confira o lote #${lot.lot_number} - ${lot.animal?.name} na Premium Agro!`;
                          const shareData = { title: lot.animal?.name, text, url };

                          if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                            navigator.share(shareData).catch(() => {
                              navigator.clipboard.writeText(url);
                              window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
                              toast.success("Link copiado e WhatsApp aberto!");
                            });
                          } else {
                            navigator.clipboard.writeText(url);
                            window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
                            toast.success("Link copiado e WhatsApp aberto!");
                          }
                        }}
                      >
                        <Share2 className="mr-2 h-4 w-4 text-emerald-400" /> COMPARTILHAR
                      </Button>
                   </div>
                    <div className="flex flex-col gap-2 mt-2">
                      {lot.animal?.accepts_offers && (
                        <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full h-14 rounded-2xl bg-emerald-bright text-white hover:bg-emerald-bright/90 gap-2 font-black italic shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            >
                              <MessageSquare className="h-5 w-5" /> FAZER OFERTA DE COMPRA
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-emerald-deep border-gold/20 text-white sm:max-w-[400px]">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black italic text-white flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-gold" /> Enviar Proposta
                              </DialogTitle>
                              <DialogDescription className="text-white/60">
                                Envie uma proposta informal para o lote {lot.lot_number}. Esta oferta será analisada pelo vendedor.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gold/60">Valor da Proposta (R$)</label>
                                <input 
                                  type="number" 
                                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                  placeholder="0,00"
                                  value={offerData.amount}
                                  onChange={(e) => setOfferData({ ...offerData, amount: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gold/60">Detalhes / Condição de Pagamento</label>
                                <textarea 
                                  className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-gold text-sm"
                                  placeholder="Descreva sua proposta, prazos ou condições..."
                                  value={offerData.description}
                                  onChange={(e) => setOfferData({ ...offerData, description: e.target.value })}
                                />
                              </div>
                              <Button 
                                className="w-full h-14 rounded-xl bg-gold text-emerald-deep font-black uppercase tracking-widest"
                                onClick={handleSendOffer}
                                disabled={isOfferLoading}
                              >
                                {isOfferLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENVIAR PROPOSTA"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Button
                        variant="outline"
                        className="w-full h-14 rounded-2xl bg-white/5 text-white hover:bg-white/10 border-gold/20 gap-2 font-bold"
                        onClick={() => window.print()}
                      >
                        <Printer className="h-4 w-4 text-gold" /> IMPRIMIR ENCARTE (PDF)
                      </Button>
                    </div>
                  </div>
                </Card>
               <div className="p-8 rounded-[2rem] border border-emerald-bright/20 bg-emerald-bright/5">
                 <h3 className="text-white font-black uppercase text-sm mb-4">Pagamento & Envio</h3>
                 <ul className="text-white/60 text-xs space-y-2">
                   <li>• À vista com 5% de desconto no PIX.</li>
                   <li>• Parcelamento em 33x (1+2+30).</li>
                   <li>• Comissão de {COMMISSION_RATE}% sobre o valor do arremate.</li>
                 </ul>
               </div>
            </div>
          </div>
        </div>
      </div>
      <AlertDialog open={showConfirmBid} onOpenChange={setShowConfirmBid}>
        <AlertDialogContent className="bg-emerald-deep text-white border-gold/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Lance de {formatBRL(pendingBidAmount || 0)}?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-gold text-emerald-deep" onClick={() => pendingBidAmount && executeBid(pendingBidAmount)}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
