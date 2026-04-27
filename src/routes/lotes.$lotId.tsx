import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Eye, Gavel, Heart, Share2, Award, Loader2, FileText, Video, Stethoscope, ChevronRight, Calculator, Info, MessageSquare, Zap, Download, Scale, Ruler, Fingerprint, Calendar, MapPin, Sparkles, Timer, PlayCircle, Users, ShieldAlert, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/lotes/$lotId")({
  loader: async ({ params }) => {
    const { lotId } = params;
    
    // Validação de UUID para evitar erro 500 do banco de dados
    if (!lotId || !UUID_REGEX.test(lotId)) {
      console.error("ID de lote inválido:", lotId);
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
      console.error("Lote não encontrado ou erro:", lotRes.error);
      throw notFound();
    }

    try {
      const validatedLot = lotSchema.parse(lotRes.data);
      return { lot: validatedLot, initialBids: bidsRes.data || [] };
    } catch (e) {
      console.error("Erro de validação de dados do lote:", e);
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `Lote ${loaderData.lot.lot_number} — ${loaderData.lot.animal?.name} — Auditor de Lances` },
      { name: "description", content: `${loaderData.lot.animal?.name}, ${loaderData.lot.animal?.breed}. Lance atual ${formatBRL(loaderData.lot.current_price || loaderData.lot.starting_price || 0)}.` },
    ] : [],
  }),
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-white">Lote não encontrado</h1>
      <Link to="/lotes" className="mt-4 inline-block text-gold hover:underline">Ver todos os lotes</Link>
    </div>
  ),
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
      {/* Desktop Horizontal View */}
      <div className="hidden md:flex justify-center items-stretch gap-8 px-12 overflow-x-auto scrollbar-hide min-w-[900px]">
        {/* Gen 0: Animal */}
        <div className="flex flex-col justify-center">
          <div className="w-44">
            <Node title="Animal" name="Principal" variant="primary" />
          </div>
        </div>

        {/* Gen 1: Parents */}
        <div className="flex flex-col justify-around gap-12 relative w-56">
          <div className="absolute -left-4 top-[25%] bottom-[25%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          <Node title="Pai (Sire)" name={pai} />
          <Node title="Mãe (Dam)" name={mae} />
        </div>

        {/* Gen 2: Grandparents */}
        <div className="flex flex-col justify-around gap-6 relative w-44">
          <div className="absolute -left-4 top-[12%] bottom-[62%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          <div className="absolute -left-4 top-[62%] bottom-[12%] w-4 border-y border-r border-white/20 rounded-r-2xl" />
          {avos.map((name, i) => (
            <Node key={i} title={i === 0 ? "Avô Pat." : i === 1 ? "Avó Pat." : i === 2 ? "Avô Mat." : "Avó Mat."} name={name} variant="tertiary" />
          ))}
        </div>

        {/* Gen 3: Great Grandparents */}
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

      {/* Mobile Vertical View */}
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
 
           <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 mb-2">
             <div className="flex flex-col">
               <span className="text-sm font-bold text-white">Plano 33x (1+2+30)</span>
               <span className="text-[10px] text-white/40">3 iniciais + 30 parcelas mensais</span>
             </div>
             <div className="text-right">
               <div className="font-black text-white">{formatBRL(price / 33)}</div>
               <div className="text-[10px] text-white/40">p/ parcela</div>
             </div>
           </div>
 
           {options.filter(o => o !== 1).map((opt) => (
             <div key={opt} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg">
               <span className="text-sm font-medium text-white/80">{opt} parcelas iguais</span>
               <span className="font-bold text-white">{formatBRL(price / opt)}</span>
             </div>
           ))}
           
           <p className="text-[9px] text-white/40 italic mt-4 text-center">
             * Valores baseados no lance atual. A comissão de compra é fixa e calculada sobre o valor do arremate.
           </p>
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

  useEffect(() => {
    const lotChannel = supabase
      .channel(`lot-${lot.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lots", filter: `id=eq.${lot.id}` },
        (payload) => { setLot((prev: any) => ({ ...prev, ...payload.new })); }
      )
      .subscribe();

    const bidsChannel = supabase
      .channel(`bids-${lot.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `lot_id=eq.${lot.id}` },
        async (payload) => {
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", payload.new.user_id).single();
          setRecentBids((prev: any) => [{ ...payload.new, profile }, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(lotChannel);
      supabase.removeChannel(bidsChannel);
    };
  }, [lot.id]);

  const executeBid = async (amount: number) => {
    setIsBidding(true);
    try {
      // Obtém ou gera um ID de sessão persistente para proteção contra bots
      let sessionId = sessionStorage.getItem("bid_session_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("bid_session_id", sessionId);
      }

      const { data, error } = await supabase.rpc("place_bid_safe", {
        p_lot_id: lot.id,
        p_amount: amount,
        p_bid_type: "online",
        p_session_id: sessionId,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast.success(result.message);
      } else {
        // Se o erro for de bloqueio, a mensagem explicará o motivo (ex: excesso de lances)
        toast.error(result.message, {
          duration: 5000,
          icon: <Fingerprint className="h-4 w-4 text-destructive" />,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao efetuar lance.");
    } finally {
      setIsBidding(false);
    }
  };

  const placeBid = (amount: number) => {
    if (!user) {
      toast.error("Faça login para dar lances.");
      return;
    }
    setPendingBidAmount(amount);
    setShowConfirmBid(true);
  };

  const currentPrice = lot?.current_price || lot?.starting_price || 0;
  const nextBid = currentPrice + (lot?.bid_increment || 0);
  
   const dynamicStatus = useEffectiveLotStatus({
     status: lot.status,
     event_status: lot.event?.status,
     event_start_date: lot.event?.start_date,
     event_end_date: lot.event?.end_date,
     allows_pre_bidding: lot.event?.allows_pre_bidding
   });
   
   const [isUrgent, setIsUrgent] = useState(false);
   useEffect(() => {
     const checkUrgency = () => {
       const endsAt = lot.end_date || lot.event?.end_date;
       if (!endsAt) return;
       const diff = new Date(endsAt).getTime() - Date.now();
       setIsUrgent(diff > 0 && diff < 600000);
     };
     const timer = setInterval(checkUrgency, 5000);
     checkUrgency();
     return () => clearInterval(timer);
   }, [lot.end_date, lot.event?.end_date]);
   const COMMISSION_RATE = lot.event?.commission_rate || 5; // default 5%
   const BUYER_COMMISSION = currentPrice * (COMMISSION_RATE / 100);
   const TOTAL_WITH_COMMISSION = currentPrice + BUYER_COMMISSION;
   
   // Common auction installment types
   const installments = 30; // standard
   const installmentValue = currentPrice / installments;
   
   // For "1+2 and then 30 equal payments" (Total of 33 installments)
   // The formula is: Price / 33
   const specialInstallments = 33;
   const specialInstallmentValue = currentPrice / specialInstallments;
 
   const [isFavorite, setIsFavorite] = useState(false);
   const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
 
   useEffect(() => {
     if (user) {
       const checkFavorite = async () => {
         const { data } = await supabase
           .from("followed_lots")
           .select("id")
           .eq("user_id", user.id)
           .eq("lot_id", lot.id)
           .maybeSingle();
         setIsFavorite(!!data);
       };
       checkFavorite();
     }
   }, [user, lot.id]);
 
   const toggleFavorite = async () => {
     if (!user) {
       toast.error("Faça login para favoritar este lote.");
       return;
     }
     setIsFavoriteLoading(true);
     try {
       if (isFavorite) {
         await supabase
           .from("followed_lots")
           .delete()
           .eq("user_id", user.id)
           .eq("lot_id", lot.id);
         setIsFavorite(false);
         toast.success("Lote removido dos favoritos.");
       } else {
         await supabase
           .from("followed_lots")
           .insert({ user_id: user.id, lot_id: lot.id });
         setIsFavorite(true);
         toast.success("Lote adicionado aos favoritos!");
       }
     } catch (error) {
       toast.error("Erro ao processar favorito.");
     } finally {
       setIsFavoriteLoading(false);
     }
   };
 
   const handleShare = async () => {
     const shareData = {
       title: `Lote #${lot.lot_number} - ${lot.animal?.name}`,
       text: `Confira este exemplar de ${lot.animal?.breed} no Auditor de Lances!`,
       url: window.location.href,
     };
 
     if (navigator.share) {
       try {
         await navigator.share(shareData);
       } catch (err) {
         if ((err as Error).name !== 'AbortError') {
           toast.error("Erro ao compartilhar.");
         }
       }
     } else {
       await navigator.clipboard.writeText(window.location.href);
       toast.success("Link copiado para a área de transferência!");
     }
   };
 
   const handlePrint = () => {
     window.print();
   };

  const getAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (years === 0) return `${months} meses`;
    return `${years} anos e ${months} meses`;
  };

   return (
     <div className="min-h-screen bg-background">
       {/* Printable Area - Hidden on Screen */}
       <div className="hidden print:block p-12 text-black bg-white min-h-screen">
         <div className="flex justify-between items-start mb-12 border-b-2 border-emerald-900 pb-8">
           <div>
             <h1 className="text-4xl font-black uppercase text-emerald-900">{lot.animal?.name}</h1>
             <p className="text-xl text-gray-600 font-bold uppercase tracking-widest">{lot.animal?.breed} · Lote #{lot.lot_number}</p>
           </div>
           <div className="text-right">
             <p className="font-black text-2xl text-emerald-900">PREMIUM AGRO</p>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Encarte Técnico do Animal</p>
           </div>
         </div>
 
         <div className="grid grid-cols-2 gap-12 mb-12">
           <div className="space-y-6">
             <div className="aspect-[4/3] rounded-3xl overflow-hidden border-4 border-emerald-900/10">
               <img src={lot.animal?.photos?.[0]} alt={lot.animal?.name} className="w-full h-full object-cover" />
             </div>
             <div className="p-6 rounded-3xl bg-emerald-900/5 border border-emerald-900/10">
               <h3 className="text-sm font-black uppercase text-emerald-900 mb-4 tracking-widest border-b border-emerald-900/10 pb-2">Genealogia</h3>
               <div className="space-y-2 text-sm">
                 <p><span className="font-bold">PAI:</span> {lot.animal?.genealogy?.father || "Não informado"}</p>
                 <p><span className="font-bold">MÃE:</span> {lot.animal?.genealogy?.mother || "Não informado"}</p>
               </div>
             </div>
           </div>
           
           <div className="space-y-8">
             <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Sexo</p>
                 <p className="font-bold">{lot.animal?.sex === 'M' ? 'Macho' : 'Fêmea'}</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Nascimento</p>
                 <p className="font-bold">{new Date(lot.animal?.birth_date).toLocaleDateString('pt-BR')}</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Peso</p>
                 <p className="font-bold">{lot.animal?.weight} kg</p>
               </div>
               <div className="p-4 rounded-xl border border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Pelagem</p>
                 <p className="font-bold">{lot.animal?.color}</p>
               </div>
             </div>
 
             <div className="space-y-4">
               <h3 className="text-sm font-black uppercase text-emerald-900 tracking-widest border-b border-emerald-900/10 pb-2">Descrição do Exemplar</h3>
               <p className="text-sm text-gray-600 leading-relaxed italic">
                 {lot.animal?.description || "Exemplar de alta linhagem, com características genéticas superiores e morfologia equilibrada."}
               </p>
             </div>
 
             <div className="p-8 rounded-3xl bg-emerald-900 text-white shadow-2xl">
               <p className="text-xs font-bold uppercase text-gold tracking-widest mb-2">Valor Base</p>
               <p className="text-4xl font-black italic">{formatBRL(currentPrice)}</p>
               <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
                 <div>
                   <p className="text-[10px] uppercase font-bold text-white/60">Plano Sugerido</p>
                   <p className="text-lg font-bold">30 parcelas de {formatBRL(installmentValue)}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] uppercase font-bold text-white/60">Arremate</p>
                   <p className="text-xs">Lote #{lot.lot_number}</p>
                 </div>
               </div>
             </div>
           </div>
         </div>
 
         <div className="mt-auto pt-12 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 uppercase font-black tracking-widest">
           <span>Premium Agro Leilões - Documento Gerado em {new Date().toLocaleDateString('pt-BR')}</span>
           <span>auditor-lances.lovable.app</span>
         </div>
       </div>
 
       <div className="min-h-screen bg-background print:hidden">
      <header className="border-b border-gold/20 bg-emerald-deep py-4 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/eventos/$eventSlug" params={{ eventSlug: lot.event?.slug || "" }} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-emerald-deep transition-all"> ← </Link>
            <div>
              <h1 className="text-white font-bold tracking-tight text-lg md:text-xl uppercase">Auditor de Lances</h1>
              <p className="text-gold/80 text-[10px] uppercase font-bold tracking-widest">{lot.event?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
             <StatusBadge status={dynamicStatus} urgent={isUrgent} className="scale-90 md:scale-100 origin-right" />
            {dynamicStatus === 'loteamento' && lot.event?.start_date && (
              <div className="hidden md:flex items-center gap-2 bg-black/20 border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-white/60">
                <Timer className="h-3 w-3" />
                <Countdown endsAt={lot.event.start_date} />
              </div>
            )}
            <div className="flex flex-col text-right">
              <span className="text-white/60 text-[9px] uppercase tracking-wider">Lote</span>
              <span className="text-white font-black text-xl md:text-2xl">#{String(lot.lot_number).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      </header>

      <AlertDialog open={showConfirmBid} onOpenChange={setShowConfirmBid}>
        <AlertDialogContent className="bg-emerald-deep border-gold/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gold">
              <AlertTriangle className="h-5 w-5" /> Confirmar Lance
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80">
              Você está prestes a dar um lance de <span className="text-white font-bold">{formatBRL(pendingBidAmount || 0)}</span> para o lote <span className="text-white font-bold">#{lot.lot_number}</span>.
              <br /><br />
              <span className="text-xs italic font-bold text-gold">Lances confirmados são irrevogáveis e representam um compromisso de compra.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-gold text-emerald-deep hover:bg-gold/90 font-bold"
              onClick={() => {
                if (pendingBidAmount) executeBid(pendingBidAmount);
              }}
            >
              Confirmar Lance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <div className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl group cursor-zoom-in">
                    <OptimizedImage 
                      src={lot.animal?.photos?.[activePhoto] || ""} 
                      alt={lot.animal?.name || "Animal"} 
                      width={1200}
                      priority="high"
                      aspectRatio="landscape"
                      className="transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute left-6 top-6 flex flex-col gap-2">
                     <StatusBadge status={dynamicStatus} urgent={isUrgent} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <Eye className="h-10 w-10 text-white/50" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-white/10 flex items-center justify-center overflow-hidden">
                  <OptimizedImage 
                    src={lot.animal?.photos?.[activePhoto] || ""} 
                    alt="" 
                    width={1600}
                    className="max-w-full max-h-full object-contain" 
                  />
                </DialogContent>
              </Dialog>
              <div className="grid grid-cols-5 gap-3">
                {lot.animal?.photos?.map((src: string, i: number) => (
                  <button key={i} onClick={() => setActivePhoto(i)} className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${activePhoto === i ? 'border-gold shadow-gold/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <OptimizedImage 
                      src={src} 
                      alt="" 
                      width={200}
                      aspectRatio="square"
                      className="h-full w-full" 
                    />
                  </button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="detalhes" className="w-full">
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="inline-flex md:grid w-max md:w-full md:grid-cols-5 bg-emerald-deep/20 border border-white/5 rounded-2xl p-1 gap-1">
                  <TabsTrigger value="detalhes" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Descrição</TabsTrigger>
                  <TabsTrigger value="genealogia" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Genealogia</TabsTrigger>
                  <TabsTrigger value="saude" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Saúde</TabsTrigger>
                  <TabsTrigger value="videos" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Vídeo</TabsTrigger>
                  <TabsTrigger value="documentos" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Documentos</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="detalhes" className="mt-6 space-y-6">
                <Card className="bg-card/50 border-white/5 p-6 md:p-8 rounded-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em]">Descrição do Animal</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <p className="text-white/80 leading-relaxed italic whitespace-pre-wrap text-base md:text-lg">
                    {lot.animal?.description || "Exemplar de alta linhagem, com características genéticas superiores e morfologia equilibrada. Uma oportunidade única para investidores exigentes."}
                  </p>
                  
                  <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {[
                      { icon: Award, label: "Raça", value: lot.animal?.breed },
                      { icon: Info, label: "Sexo", value: lot.animal?.sex === 'M' ? 'Macho' : 'Fêmea' },
                      { icon: Calendar, label: "Idade", value: getAge(lot.animal?.birth_date) },
                       { icon: MapPin, label: "Local", value: lot.animal?.location || "Brasil" },
                       { icon: Users, label: "Vendedor", value: lot.animal?.seller?.name },
                       { icon: Scale, label: "Peso", value: lot.animal?.weight ? `${lot.animal.weight} kg` : null },
                      { icon: Ruler, label: "Altura", value: lot.animal?.height ? `${lot.animal.height} m` : null },
                      { icon: Sparkles, label: "Pelagem", value: lot.animal?.color },
                       { icon: Fingerprint, label: "Registro", value: lot.animal?.registration_number },
                       { icon: Fingerprint, label: "Registro 1cc", value: lot.animal?.registration_1cc },
                       { icon: Fingerprint, label: "Registro 2", value: lot.animal?.registration_2 },
                       { icon: Zap, label: "Chip", value: lot.animal?.chip_number },
                       { icon: FileText, label: "Livro", value: lot.animal?.book },
                       { icon: Zap, label: "Tipagem", value: lot.animal?.blood_typing },
                       { icon: Zap, label: "Grau Sangue", value: lot.animal?.blood_percentage },
                     ].filter(item => item.value && item.value !== "").map((item) => (
                      <div key={item.label} className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center group hover:bg-gold/5 transition-all">
                        <item.icon className="h-4 w-4 text-gold/60 mb-2" />
                        <div className="text-[9px] uppercase text-gold/40 font-black tracking-widest mb-1">{item.label}</div>
                        <div className="font-bold text-white text-xs md:text-sm line-clamp-1">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="genealogia" className="mt-6">
                <GenealogyTree genealogy={lot.animal?.genealogy} />
              </TabsContent>

              <TabsContent value="saude" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center text-gold"><Stethoscope /></div>
                    <div>
                      <div className="text-xs text-gold/60 font-bold uppercase">Exames</div>
                      <div className="font-bold text-white">100% Regularizado</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                    <div className="h-12 w-12 rounded-full bg-emerald-bright/10 flex items-center justify-center text-emerald-bright"><Award /></div>
                    <div>
                      <div className="text-xs text-gold/60 font-bold uppercase">Vacinação</div>
                      <div className="font-bold text-white">Protocolo em Dia</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="videos" className="mt-6">
                <div className="aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black">
                  {lot.animal?.youtube_url ? (
                    <iframe src={lot.animal.youtube_url.replace("watch?v=", "embed/").split("&")[0]} className="h-full w-full" allowFullScreen />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-white/20">
                      <Video className="h-16 w-16 mb-4" />
                      <p>Vídeo não disponível</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documentos" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                   {lot.animal?.pedigree_url && (
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button variant="outline" className="h-20 justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold hover:text-emerald-deep" asChild>
                             <a href={lot.animal.pedigree_url} target="_blank">
                               <span className="flex items-center font-bold"><FileText className="mr-3 h-6 w-6 text-gold" /> PEDIGREE COMPLETO</span>
                               <Download className="h-5 w-5" />
                             </a>
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent>Clique para visualizar o documento de pedigree original</TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   )}
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button variant="outline" className="h-20 justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold hover:text-emerald-deep" onClick={() => toast.info("Baixando encarte do lote...")}>
                           <span className="flex items-center font-bold"><Download className="mr-3 h-6 w-6 text-gold" /> ENCARTE DO LOTE (PDF)</span>
                           <Download className="h-5 w-5" />
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>Baixar PDF com fotos e informações técnicas do lote</TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button variant="outline" className="h-20 justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold hover:text-emerald-deep" onClick={() => toast.info("Baixando exames laboratoriais...")}>
                           <span className="flex items-center font-bold"><Stethoscope className="mr-3 h-6 w-6 text-gold" /> LAUDOS & EXAMES</span>
                           <Download className="h-5 w-5" />
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>Acessar laudos veterinários e exames laboratoriais recentes</TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                   <TooltipProvider>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button variant="outline" className="h-20 justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold hover:text-emerald-deep" onClick={() => toast.info("Visualizando histórico reprodutivo...")}>
                           <span className="flex items-center font-bold"><Fingerprint className="mr-3 h-6 w-6 text-gold" /> HISTÓRICO REPRODUTIVO</span>
                           <ChevronRight className="h-5 w-5" />
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>Ver informações de genealogia e desempenho reprodutivo</TooltipContent>
                     </Tooltip>
                   </TooltipProvider>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <div className="p-1 rounded-[2.5rem] bg-gold-gradient shadow-2xl">
              <Card className="border-0 overflow-hidden rounded-[2.3rem] bg-emerald-deep/95 backdrop-blur-xl">
                <div className="p-6 md:p-8 space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gold">
                      <Gavel className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Painel do Licitante</span>
                    </div>
                  <h2 className="text-4xl font-black text-white tracking-tight">{lot?.animal?.name || "Sem nome"}</h2>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 space-y-6">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                     <div className="flex-1">
                       <div className="text-[10px] uppercase tracking-widest text-gold font-black mb-2">
                         {dynamicStatus === 'finished' || dynamicStatus === 'sold' ? 'Preço Final' : 'Oferta Atual'}
                       </div>
                       <div className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none italic">
                         {formatBRL(currentPrice)}
                       </div>
                     </div>
                     <div className="flex flex-col md:items-end pb-1 gap-1">
                       <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">
                         {dynamicStatus === 'loteamento' ? 'Inicia em' : 
                          dynamicStatus === 'finished' || dynamicStatus === 'sold' ? 'Encerrado' : 'Expira em'}
                       </div>
                       <div className="text-xl md:text-3xl font-mono font-bold text-white tracking-tighter">
                         {dynamicStatus === 'finished' || dynamicStatus === 'sold' ? (
                           <span className="text-white/20">00:00:00</span>
                         ) : dynamicStatus === 'loteamento' && lot.event?.start_date ? (
                           <div className="text-upcoming animate-pulse">
                             <Countdown endsAt={lot.event.start_date} />
                           </div>
                         ) : (
                           <div className="text-white">
                             <Countdown endsAt={lot.end_date || lot.event?.end_date || ""} />
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="text-white/60 text-sm font-bold">{installments}x <span className="text-white">{formatBRL(installmentValue)}</span></div>
                       <InstallmentSimulator price={currentPrice} commissionRate={COMMISSION_RATE} />
                    </div>
                    
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 flex items-center gap-2 group" onClick={handlePrint}>
                             <Download className="h-4 w-4 text-gold group-hover:scale-110 transition-transform" />
                             <span className="text-xs font-bold uppercase tracking-wider">Baixar Encarte do Lote (PDF)</span>
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent>Documento completo com fotos e dados do animal</TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                  </div>
                  </div>

                  <div className="space-y-4">
                     {lot.animal?.youtube_url && (
                       <Dialog>
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <DialogTrigger asChild>
                                 <Button 
                                   variant="ghost" 
                                   className="w-full h-10 rounded-xl bg-white/5 text-white/60 hover:text-gold flex items-center justify-center gap-2 mb-2 border border-white/5"
                                 >
                                   <PlayCircle className="h-4 w-4" />
                                   <span className="text-[10px] font-bold uppercase tracking-wider">Ver vídeo do animal</span>
                                 </Button>
                               </DialogTrigger>
                             </TooltipTrigger>
                             <TooltipContent>Abrir player de vídeo do YouTube</TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                         <DialogContent className="sm:max-w-[800px] bg-black p-0 border-white/10 overflow-hidden">
                           <div className="aspect-video">
                             <iframe 
                               src={lot.animal.youtube_url.includes('youtube.com/embed') ? lot.animal.youtube_url : lot.animal.youtube_url.replace("watch?v=", "embed/").split("&")[0]} 
                               className="h-full w-full" 
                               allowFullScreen 
                             />
                           </div>
                         </DialogContent>
                       </Dialog>
                     )}
                    {dynamicStatus === 'loteamento' && (
                      <div className="p-4 rounded-2xl bg-gold/10 border border-gold/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <Info className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gold uppercase tracking-wider">Lances em breve</p>
                          <p className="text-[11px] text-white/70 leading-relaxed">
                            Este lote está em fase de loteamento. 
                            {lot.event?.start_date ? (
                              <> Os lances abrem automaticamente em <b>{new Date(lot.event.start_date).toLocaleDateString('pt-BR')} às {new Date(lot.event.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</b>.</>
                            ) : (
                              <> Os lances serão liberados assim que o evento for iniciado ou o pré-lance for autorizado.</>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {dynamicStatus === 'pre_lance' && (
                      <div className="p-4 rounded-2xl bg-emerald-bright/10 border border-emerald-bright/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <Zap className="h-5 w-5 text-emerald-bright shrink-0 mt-0.5 animate-pulse" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-bright uppercase tracking-wider">Pré-lance Liberado</p>
                          <p className="text-[11px] text-white/70 leading-relaxed">
                            O evento principal ainda não começou, mas você já pode antecipar seus lances! Aproveite para garantir sua vantagem.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {user && (
                        <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                          profile?.is_blocked ? 'bg-destructive/10 border-destructive/20' :
                          !profile?.is_approved ? 'bg-amber-500/10 border-amber-500/20' :
                          'bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                          {profile?.is_blocked ? (
                            <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          ) : !profile?.is_approved ? (
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <p className={`text-xs font-bold uppercase tracking-wider ${
                              profile?.is_blocked ? 'text-destructive' :
                              !profile?.is_approved ? 'text-amber-500' :
                              'text-emerald-500'
                            }`}>
                              {profile?.is_blocked ? 'Conta Bloqueada' :
                               !profile?.is_approved ? 'Aprovação Pendente' :
                               'Habilitado para Lances'}
                            </p>
                            <p className="text-[11px] text-white/70 leading-relaxed">
                              {profile?.is_blocked ? (
                                <>Sua conta foi restringida: <b>{profile.block_reason || "Verifique com o suporte."}</b></>
                              ) : !profile?.is_approved ? (
                                <>Sua conta está em análise. Você poderá dar lances assim que um administrador aprovar seu cadastro.</>
                              ) : (
                                <>Você está autorizado a participar deste leilão. Boas compras!</>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 5].map((m) => (
                          <TooltipProvider key={m}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <Button 
                                    variant="outline" 
                                    className="w-full h-16 flex flex-col rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold/20 hover:border-gold/50" 
                                    disabled={isBidding || (dynamicStatus !== "recebendo_lances" && dynamicStatus !== "pre_lance") || !profile?.is_approved || profile?.is_blocked} 
                                    onClick={() => placeBid(currentPrice + (lot.bid_increment * m))}
                                  >
                                    <span className="text-[8px] uppercase font-black text-gold/60 mb-1">+{m} inc.</span>
                                    <span className="font-bold">+{formatBRL(lot.bid_increment * m)}</span>
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="bg-emerald-deep border-gold/20 text-white text-[10px] max-w-[200px] text-center">
                                {!user ? "Faça login para dar lances" :
                                 profile?.is_blocked ? "Conta bloqueada" :
                                 !profile?.is_approved ? "Aguardando aprovação" :
                                 (dynamicStatus !== "recebendo_lances" && dynamicStatus !== "pre_lance") ? "Leilão não está recebendo lances" :
                                 `Dê um lance de ${formatBRL(currentPrice + (lot.bid_increment * m))}`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className="w-full">
                             <Button 
                               size="lg" 
                               className={`w-full h-20 text-emerald-deep font-black text-2xl hover:opacity-90 shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all active:scale-[0.97] rounded-2xl uppercase tracking-tighter ${dynamicStatus === 'recebendo_lances' ? 'shimmer-button animate-blink-fast' : 'bg-gold-gradient'}`} 
                               disabled={isBidding || (dynamicStatus !== "recebendo_lances" && dynamicStatus !== "pre_lance") || !profile?.is_approved || profile?.is_blocked} 
                               onClick={() => placeBid(nextBid)}
                             >
                              {isBidding ? <Loader2 className="animate-spin" /> : "CONFIRMAR LANCE"}
                            </Button>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent side="top" className="bg-emerald-deep border-gold/20 text-white text-xs p-3">
                            {!user ? "Faça login para dar lances" :
                             profile?.is_blocked ? "Sua conta está bloqueada" :
                             !profile?.is_approved ? "Aguardando aprovação de cadastro" :
                             (dynamicStatus !== "recebendo_lances" && dynamicStatus !== "pre_lance") ? "Lances não permitidos agora" :
                             `Dar lance de ${formatBRL(nextBid)}`}
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                    
                    <p className="text-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
                      Lances confirmados são irrevogáveis.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

             <div className="grid grid-cols-2 gap-3">
               <Button 
                 variant="outline" 
                 className={`h-14 rounded-2xl border-white/10 bg-card hover:bg-white/5 transition-all ${isFavorite ? 'text-gold border-gold/50 bg-gold/5' : 'text-white'}`}
                 onClick={toggleFavorite}
                 disabled={isFavoriteLoading}
               >
                 {isFavoriteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-gold' : ''}`} />}
                 {isFavorite ? 'SEGUINDO' : 'SEGUIR'}
               </Button>
               <Button 
                 variant="outline" 
                 className="h-14 rounded-2xl border-white/10 bg-card text-white hover:bg-white/5"
                 onClick={handleShare}
               >
                 <Share2 className="mr-2 h-4 w-4" /> COMPARTILHAR
               </Button>
             </div>

            <Card className="rounded-[2rem] border-white/5 bg-card overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center gap-2">
                <Zap className="h-4 w-4 text-gold" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Lances Recentes</span>
              </div>
              <div className="p-6 space-y-4">
                {recentBids.length > 0 ? recentBids.map((bid: any, i: number) => (
                  <div key={bid.id} className={`flex items-center justify-between p-4 rounded-2xl ${i === 0 ? 'bg-gold/10 border border-gold/20' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-gold text-emerald-deep' : 'bg-emerald-deep text-white/40'}`}> {bid.profile?.full_name?.charAt(0) || "P"} </div>
                      <div>
                        <div className="text-sm font-bold text-white">{bid.profile?.full_name || "Licitante"}</div>
                        <div className="text-[10px] text-white/40 font-bold">{new Date(bid.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div className={`font-black tracking-tight ${i === 0 ? 'text-gold text-lg' : 'text-white'}`}> {formatBRL(bid.amount)} </div>
                  </div>
                )) : <div className="text-center py-6 text-white/20 text-xs font-bold uppercase">Nenhum lance ainda</div>}
              </div>
            </Card>

             <div className="p-8 rounded-[2rem] border border-emerald-bright/20 bg-emerald-bright/5">
               <h2 className="text-white font-black text-sm uppercase tracking-widest mb-4">Pagamento & Envio</h2>
               <div className="space-y-4">
                 <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                   <div className="flex items-center gap-2 mb-2">
                     <Calculator className="h-4 w-4 text-gold" />
                     <span className="text-[10px] font-black uppercase text-white/80">Condições de Venda</span>
                   </div>
                   <ul className="space-y-3 text-xs text-white/70">
                     <li className="flex justify-between items-center pb-2 border-b border-white/5">
                       <span>À vista (5% OFF):</span>
                       <span className="font-bold text-gold">{formatBRL((currentPrice * 0.95) + BUYER_COMMISSION)}</span>
                     </li>
                     <li className="flex justify-between items-center pb-2 border-b border-white/5">
                       <span>Plano 1+2+30:</span>
                       <span className="font-bold text-white">3x {formatBRL(currentPrice/33)} + 30x {formatBRL(currentPrice/33)}</span>
                     </li>
                     <li className="flex justify-between items-center">
                       <span>Comissão Comprador:</span>
                       <span className="font-bold text-amber-500">{formatBRL(BUYER_COMMISSION)} ({COMMISSION_RATE}%)</span>
                     </li>
                   </ul>
                 </div>
                 
                 <ul className="space-y-3 text-[11px] text-white/60">
                   <li className="flex gap-2"> <span className="text-gold font-bold">•</span> Após o arremate, o contrato e as boletas (com QR Code PIX) estarão disponíveis em seu painel. </li>
                   <li className="flex gap-2"> <span className="text-gold font-bold">•</span> O pagamento pode ser mensal (30 dias) ou quinzenal, conforme acordado no fechamento. </li>
                   <li className="flex gap-2"> <span className="text-gold font-bold">•</span> A liberação do animal ocorre após a assinatura do contrato e confirmação do primeiro pagamento. </li>
                 </ul>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
