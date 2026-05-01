import { motion } from "framer-motion";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { generateMetaTags } from "@/utils/seo";
import { Eye, Gavel, Heart, Share2, Award, Loader2, FileText, Video, Stethoscope, ChevronRight, Calculator, Info, MessageSquare, Zap, ZapOff, WifiOff, Download, Scale, Ruler, Fingerprint, Calendar, MapPin, Sparkles, Timer, PlayCircle, Users, ShieldAlert, CheckCircle2, AlertCircle, AlertTriangle, XCircle, Printer, Expand, ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";
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
 import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
 import { useRealtimeFallback } from "@/hooks/useRealtimeFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferDialog } from "@/components/auctions/OfferDialog";
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

    const [lotRes, bidsRes, neighboringLotsRes] = await Promise.all([
       supabase
         .from("lots")
         .select("*, animal:animals(*, seller:sellers(name)), event:events!lots_event_id_fkey(*)")
         .eq("id", lotId)
         .maybeSingle(),
      supabase
        .from("bids")
        .select("*")
        .eq("lot_id", lotId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("lots")
        .select("id, lot_number")
        .order("lot_number", { ascending: true })
    ]);

    if (lotRes.error || !lotRes.data) {
      throw notFound();
    }

    // Actually let's fetch only lots from this event
    const { data: eventLotsData } = await supabase
      .from("lots")
      .select("id, lot_number")
      .eq("event_id", lotRes.data.event_id as string)
      .order("lot_number", { ascending: true });

    const currentLotIndex = (eventLotsData || []).findIndex(l => l.id === lotId);
    const prevLotId = currentLotIndex > 0 ? eventLotsData![currentLotIndex - 1].id : null;
    const nextLotId = currentLotIndex < (eventLotsData?.length || 0) - 1 ? eventLotsData![currentLotIndex + 1].id : null;

    try {
      const validatedLot = lotSchema.parse(lotRes.data);
      return { 
        lot: validatedLot, 
        initialBids: bidsRes.data || [],
        prevLotId,
        nextLotId
      };
    } catch (e) {
      throw notFound();
    }
  },
  head: (ctx: any) => {
    const lot = ctx.loaderData?.lot;
    const rootData = ctx.matches.find((m: any) => m.id === '__root__')?.loaderData as any;
    const seoSettings = rootData?.seoSettings;
    
    return generateMetaTags({
       title: lot?.animal?.og_title || lot?.animal?.seo_title || (lot ? `Lote ${lot.lot_number} — ${lot.animal?.name || 'Animal'}` : "Detalhe do Lote"),
       description: lot?.animal?.og_description || lot?.animal?.seo_description || lot?.animal?.description,
       image: lot?.animal?.og_image_url || lot?.animal?.photos?.[0],
      seoSettings,
       canonical: `/lotes/${lot?.id}`,
       ogTitle: lot?.animal?.og_title,
       ogDescription: lot?.animal?.og_description,
       ogImage: lot?.animal?.og_image_url
    });
  },
  component: LotDetail,
  pendingComponent: LotDetailSkeleton,
  errorComponent: ErrorFallback,
});

function GenealogyTree({ genealogy }: { genealogy: any }) {
  if (!genealogy) return <div className="py-10 text-center text-muted-foreground">Informação de genealogia não disponível.</div>;

   const pai = genealogy.father || genealogy.pai || genealogy.genealogy_father || "Não informado";
   const mae = genealogy.mother || genealogy.mae || genealogy.genealogy_mother || "Não informado";
  
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
    <div className="relative overflow-hidden py-6 lg:py-10 bg-black/40 rounded-[2rem] border border-white/5 shadow-inner">
      {/* Desktop/Wide Version - Horizontal Tree */}
      <div className="hidden lg:block">
        <div className="flex justify-center items-stretch gap-4 xl:gap-8 px-4 xl:px-12 w-full max-w-full overflow-hidden">
          <div className="flex flex-col justify-center flex-1 min-w-0 max-w-[180px]">
            <Node title="Animal" name="Principal" variant="primary" />
          </div>

          <div className="flex flex-col justify-around gap-8 relative flex-1 min-w-0 max-w-[220px]">
            <div className="absolute -left-2 xl:-left-4 top-[25%] bottom-[25%] w-2 xl:w-4 border-y border-r border-white/20 rounded-r-2xl" />
             <Node title="Pai" name={pai} />
             <Node title="Mãe" name={mae} />
          </div>

          <div className="flex flex-col justify-around gap-4 relative flex-1 min-w-0 max-w-[180px]">
            <div className="absolute -left-2 xl:-left-4 top-[12%] bottom-[62%] w-2 xl:w-4 border-y border-r border-white/20 rounded-r-2xl" />
            <div className="absolute -left-2 xl:-left-4 top-[62%] bottom-[12%] w-2 xl:w-4 border-y border-r border-white/20 rounded-r-2xl" />
             {avos.map((name, i) => (
               <Node key={i} title={i === 0 ? "Avô Paterno" : i === 1 ? "Avó Paterna" : i === 2 ? "Avô Materno" : "Avó Materna"} name={name} variant="tertiary" />
             ))}
          </div>

          <div className="flex flex-col justify-around gap-1 relative flex-1 min-w-0 max-w-[160px]">
            <div className="absolute -left-2 xl:-left-4 top-[6%] bottom-[81%] w-2 xl:w-4 border-y border-r border-white/20 rounded-r-2xl" />
            <div className="absolute -left-2 xl:-left-4 top-[31%] bottom-[56%] w-2 xl:w-4 border-y border-r border-white/20 rounded-r-2xl" />
            <div className="absolute -left-2 xl:-left-4 top-[56%] bottom-[31%] w-2 xl:w-4 border-y border-r border-white/20 rounded-r-2xl" />
            <div className="absolute -left-2 xl:-left-4 top-[81%] bottom-[6%] w-2 xl:w-4 border-y border-r border-white/20 rounded-r-2xl" />
            {bisavos.map((name, i) => (
              <Node key={i} title={i % 2 === 0 ? "Bisavô" : "Bisavó"} name={name} variant="tertiary" />
            ))}
          </div>
        </div>
      </div>

      {/* Tablet/Mobile Version - Vertical Tree */}
      <div className="flex lg:hidden flex-col gap-6 px-4">
        <div className="space-y-4">
          <Node title="Animal" name="Principal" variant="primary" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paternal Side */}
            <div className="space-y-4">
              <div className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest pl-2 border-l-2 border-blue-400/20">Linhagem Paterna</div>
              <Node title="Pai" name={pai} />
              <div className="grid grid-cols-2 gap-2 pl-4 border-l border-white/10">
                 <div className="space-y-2">
                   <Node title="Avô Paterno" name={avos[0]} variant="tertiary" />
                   <div className="space-y-1 pl-2 border-l border-white/5">
                      <div className="text-[7px] text-white/30 uppercase">Bisavós</div>
                      <div className="text-[9px] text-white/70 italic bg-white/5 p-1 rounded">{bisavos[0]}</div>
                      <div className="text-[9px] text-white/70 italic bg-white/5 p-1 rounded">{bisavos[1]}</div>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Node title="Avó Paterna" name={avos[1]} variant="tertiary" />
                   <div className="space-y-1 pl-2 border-l border-white/5">
                      <div className="text-[7px] text-white/30 uppercase">Bisavós</div>
                      <div className="text-[9px] text-white/70 italic bg-white/5 p-1 rounded">{bisavos[2]}</div>
                      <div className="text-[9px] text-white/70 italic bg-white/5 p-1 rounded">{bisavos[3]}</div>
                   </div>
                 </div>
              </div>
            </div>

            {/* Maternal Side */}
            <div className="space-y-4">
              <div className="text-[10px] font-black text-pink-400/60 uppercase tracking-widest pl-2 border-l-2 border-pink-400/20">Linhagem Materna</div>
              <Node title="Mãe" name={mae} />
              <div className="grid grid-cols-2 gap-2 pl-4 border-l border-white/10">
                 <div className="space-y-2">
                   <Node title="Avô Materno" name={avos[2]} variant="tertiary" />
                   <div className="space-y-1 pl-2 border-l border-white/5">
                      <div className="text-[7px] text-white/30 uppercase">Bisavós</div>
                      <div className="text-[9px] text-white/70 italic bg-white/5 p-1 rounded">{bisavos[4]}</div>
                      <div className="text-[9px] text-white/70 italic bg-white/5 p-1 rounded">{bisavos[5]}</div>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Node title="Avó Materna" name={avos[3]} variant="tertiary" />
                   <div className="space-y-1 pl-2 border-l border-white/5">
                      <div className="text-[7px] text-white/30 uppercase">Bisavós</div>
                      <div className="text-[9px] text-white/70 italic bg-white/5 p-1 rounded">{bisavos[6]}</div>
                      <div className="text-[9px] text-white/70 italic bg-white/5 p-1 rounded">{bisavos[7]}</div>
                   </div>
                 </div>
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
            {options.filter(o => o !== 1).map((opt) => {
              const totalWithCommission = price + buyerCommission;
              return (
                <div key={opt} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg">
                  <span className="text-sm font-medium text-white/80">{opt} parcelas iguais</span>
                  <span className="font-bold text-white">{formatBRL(totalWithCommission / opt)}</span>
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

 function LotDetail() {
   const { lot: initialLot, initialBids, prevLotId, nextLotId } = Route.useLoaderData() as any;
   const { animations } = Route.useRouteContext();
  const { user, profile } = useAuth();
   const [lot, setLot] = useState(initialLot);
   const [viewIncremented, setViewIncremented] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [recentBids, setRecentBids] = useState<any[]>(initialBids);
  const [isBidding, setIsBidding] = useState(false);
  const [showConfirmBid, setShowConfirmBid] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
   const [activePhoto, setActivePhoto] = useState(0);
   const [activeTab, setActiveTab] = useState("detalhes");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);

   const [rtStatus, setRtStatus] = useState<string>("INITIAL");
 
   const fetchLatestData = useCallback(async () => {
     const lotId = lot.id;
     const { data: latestLot } = await supabase.from("lots").select("*").eq("id", lotId).single();
     if (latestLot) setLot((prev: any) => ({ ...prev, ...latestLot }));
 
     const { data: latestBids } = await supabase
       .from("bids")
       .select("*")
       .eq("lot_id", lotId)
       .order("created_at", { ascending: false })
       .limit(10);
     
     if (latestBids) setRecentBids(latestBids);
   }, [lot.id]);
 
    const { delaySeconds, isPolling } = useRealtimeFallback({
     status: rtStatus,
     onUpdate: fetchLatestData,
     label: `Detalhe Lote ${lot.lot_number}`,
     pollInterval: 30000,
     initialPollInterval: 15000
   });
 
    useEffect(() => {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

   // Real-time synchronization
   useEffect(() => {
     const lotId = lot.id;
     let lastBidId = initialBids[0]?.id;
 
      const uniqueId = `lot-dt-${lotId}-${Math.random().toString(36).slice(2, 9)}`;
      const lotChannel = supabase
        .channel(uniqueId)
       .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lots", filter: `id=eq.${lotId}` }, (p) => {
         setLot((prev: any) => ({ ...prev, ...p.new }));
       })
       .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids", filter: `lot_id=eq.${lotId}` }, (p) => {
         const newBid = p.new;
         if (!newBid || newBid.id === lastBidId) return;
         lastBidId = newBid.id;
 
          setRecentBids(prev => {
            if (prev.some(b => b.id === newBid.id)) return prev;
            const updated = [newBid, ...prev].slice(0, 10);
            
            // Se o novo lance não for do próprio usuário e o usuário tiver o lance anterior
            const isOutbiddingMe = user && prev.length > 0 && prev[0].user_id === user.id && newBid.user_id !== user.id;

            if (isOutbiddingMe) {
              // Tocar som de alerta
              try {
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.volume = 0.5;
                audio.play();
              } catch (e) {
                console.error("Erro ao tocar som:", e);
              }

              toast.error("VOCÊ FOI SUPERADO!", {
                description: `Seu lance no lote #${lot.lot_number} foi superado por ${formatBRL(newBid.amount)}. Deseja cobrir?`,
                icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
                duration: 6000,
                action: {
                  label: "DAR LANCE",
                  onClick: () => {
                    const el = document.getElementById('bid-actions');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              });
            } else {
              toast.info(`Novo lance: ${formatBRL(newBid.amount)}`, {
                description: newBid.bidder_name || "Licitante",
                icon: <Gavel className="h-4 w-4 text-gold" />,
                duration: 3000
              });
            }
            
            return updated;
          });
 
         setLot((prev: any) => {
           if (newBid.amount > (prev.current_price || 0)) {
             return { ...prev, current_price: newBid.amount };
           }
           return prev;
         });
       })
       .subscribe((newStatus) => {
         setRtStatus(newStatus);
       });

    if (user) {
      supabase.from("followed_lots").select("id").eq("user_id", user.id).eq("lot_id", lotId).maybeSingle().then(r => setIsFavorite(!!r.data));
    }
    
    if (!viewIncremented) {
      supabase.rpc('increment_lot_viewers', { p_lot_id: lotId }).then(({ error }) => {
        if (error) {
          supabase.from('lots').update({ viewers: (lot.viewers || 0) + 1 }).eq('id', lotId);
        }
        setViewIncremented(true);
      });
    }

    return () => {
      supabase.removeChannel(lotChannel);
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
      const { data, error } = await supabase.rpc("place_bid_safe", { 
        p_lot_id: lot.id, 
        p_amount: amount, 
        p_bid_type: "online", 
        p_session_id: "client-side" 
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; message: string; previous_bidder_id?: string };
      if (result.success) {
        toast.success(result.message || "Lance efetuado!");

        // Enviar notificação por e-mail se houver um licitante anterior superado
        if (result.previous_bidder_id && user && result.previous_bidder_id !== user.id) {
          supabase.functions.invoke('user-notifications', {
            body: {
              userId: result.previous_bidder_id,
              type: 'outbid',
              lotId: lot.id,
              data: {
                amount: amount,
                lotNumber: lot.lot_number,
                animalName: lot.animal?.name
              }
            }
          }).catch(err => console.error("Erro ao enviar e-mail de outbid:", err));
        }
      } else {
        toast.error(result.message, {
          duration: 6000,
          icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
        });
      }
    } catch (e: any) { 
      toast.error(e.message || "Erro ao efetuar lance."); 
    } finally { 
      setIsBidding(false); 
      setShowConfirmBid(false); 
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
   const COMMISSION_RATE = lot.event?.commission_rate ?? 5;
   const BUYER_COMMISSION = currentPrice * (COMMISSION_RATE / 100);
   const installments = lot.installment_count || 30;
   const installmentValue = (currentPrice + BUYER_COMMISSION) / installments;

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
    <div className="min-h-screen bg-background overflow-x-hidden w-full relative">
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
               <div className="space-y-6 print-block">
                 {lot.animal?.photos?.[0] && (
                   <img 
                     src={lot.animal.photos[0]} 
                     className="rounded-3xl shadow-xl w-full aspect-video object-cover" 
                     style={{ display: 'block' }}
                   />
                 )}
             
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
                    <p className="text-[8px] text-gray-400 uppercase font-bold">Pai</p>
                    <p className="font-black text-sm uppercase italic">{lot.animal?.genealogy?.father || lot.animal?.genealogy?.pai || "Não informado"}</p>
                  </div>
                 <div className="flex justify-center h-4">
                   <div className="w-px bg-gray-200" />
                 </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[8px] text-gray-400 uppercase font-bold">Mãe</p>
                    <p className="font-black text-sm uppercase italic">{lot.animal?.genealogy?.mother || lot.animal?.genealogy?.mae || "Não informado"}</p>
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

      <div className="min-h-screen bg-background print:hidden overflow-x-hidden w-full relative">
        <header className="border-b border-gold/20 bg-emerald-deep py-4 sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 flex items-center justify-between gap-4">
            <Link to="/ao-vivo" className="text-white flex items-center gap-1 hover:text-gold transition-colors">
              <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Voltar</span>
            </Link>
            
             <div className="flex items-center gap-2 sm:gap-6">
               {prevLotId ? (
                 <Link to="/lotes/$lotId" params={{ lotId: prevLotId }} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-emerald-deep transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                   <ChevronLeft className="h-6 w-6" />
                 </Link>
               ) : (
                 <div className="h-10 w-10 sm:h-12 sm:w-12" />
               )}
               
               <div className="text-center min-w-[140px]">
                 <div className="text-gold/60 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Navegar Lotes</div>
                 <h1 className="text-white font-black uppercase text-base sm:text-xl tracking-tighter italic">Lote #{lot.lot_number}</h1>
               </div>
 
               {nextLotId ? (
                 <Link to="/lotes/$lotId" params={{ lotId: nextLotId }} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-emerald-deep transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                   <ChevronRight className="h-6 w-6" />
                 </Link>
               ) : (
                 <div className="h-10 w-10 sm:h-12 sm:w-12" />
               )}
             </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all cursor-help ${isOffline ? 'bg-destructive/10 border-destructive/30 text-destructive' : isPolling ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                      {isOffline ? <WifiOff className="h-3 w-3 animate-pulse" /> : isPolling ? <ZapOff className="h-3 w-3 animate-pulse" /> : <Zap className="h-3 w-3" />}
                      <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                        {isOffline ? 'Off' : isPolling ? 'Sync' : 'Live'}
                      </span>
                      {delaySeconds > 0 && <span className="text-[8px] opacity-70 ml-1">{delaySeconds}s</span>}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {isOffline ? 'Você está offline.' : isPolling ? 'Sincronizando via polling redundante.' : 'Conectado em tempo real.'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <StatusBadge status={dynamicStatus} urgent={isUrgent} />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] flex-col-reverse lg:flex-row">
            <div className="space-y-8 order-2 lg:order-1">
               <div className="rounded-3xl overflow-hidden border border-white/10 relative group">
                <div className="relative">
                  <OptimizedImage src={lot.animal?.photos?.[activePhoto] || ""} alt={lot.animal?.name || "Animal"} width={1200} aspectRatio="landscape" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="bg-emerald-deep/80 backdrop-blur-md p-4 rounded-full border border-gold/40 shadow-gold">
                      <Expand className="h-8 w-8 text-gold" />
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 z-20">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      animate={{ 
                        boxShadow: ["0 0 10px rgba(212,175,55,0.2)", "0 0 20px rgba(212,175,55,0.4)", "0 0 10px rgba(212,175,55,0.2)"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Button 
                        size="sm" 
                        className="bg-gold text-emerald-deep hover:bg-gold-bright hover:text-emerald-deep transition-all shadow-gold font-black border-2 border-emerald-deep/20 px-6 h-10 rounded-full"
                        onClick={() => setActivePhoto(activePhoto)}
                      >
                        <Expand className="mr-2 h-4 w-4" /> VER GALERIA
                      </Button>
                    </motion.div>
                  </div>
                  
                  {/* Next/Prev overlays on image */}
                  <div className="absolute inset-y-0 left-0 flex items-center px-4">
                    {prevLotId && (
                      <Link 
                        to="/lotes/$lotId" 
                        params={{ lotId: prevLotId }}
                        className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-gold hover:text-emerald-deep transition-all shadow-xl"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Link>
                    )}
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4">
                    {nextLotId && (
                      <Link 
                        to="/lotes/$lotId" 
                        params={{ lotId: nextLotId }}
                        className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-gold hover:text-emerald-deep transition-all shadow-xl"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Link>
                    )}
                  </div>
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
                  <TabsList className="bg-emerald-deep/20 flex-wrap h-auto py-1">
                    <TabsTrigger value="detalhes" className="text-[10px] sm:text-sm">Descrição</TabsTrigger>
                    <TabsTrigger value="genealogia" className="text-[10px] sm:text-sm">Genealogia</TabsTrigger>
                    <TabsTrigger value="videos" className="text-[10px] sm:text-sm">Vídeo</TabsTrigger>
                    <TabsTrigger value="saude" className="text-[10px] sm:text-sm">Saúde</TabsTrigger>
                    <TabsTrigger value="lances" className="text-[10px] sm:text-sm">Lances</TabsTrigger>
                  </TabsList>
                  <TabsContent value="lances" className="mt-6">
                    <Card className="bg-card/50 border-white/5 p-6 rounded-[2rem]">
                      <h3 className="text-sm font-black uppercase text-gold/60 mb-6 flex items-center gap-2">
                        <Gavel className="h-4 w-4" /> Histórico de Lances
                      </h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {recentBids.length > 0 ? (
                          recentBids.map((bid, idx) => (
                            <div key={bid.id} className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? 'bg-gold/10 border-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/5'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-gold text-emerald-deep' : 'bg-white/10 text-white/40'}`}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white leading-none mb-1">
                                    {bid.bidder_name || (bid.user_id === user?.id ? profile?.full_name : 'Licitante')}
                                  </p>
                                  <p className="text-[10px] text-white/40">{new Date(bid.created_at).toLocaleTimeString('pt-BR')}</p>
                                </div>
                              </div>
                              <div className={`font-black italic ${idx === 0 ? 'text-gold text-lg' : 'text-white text-sm'}`}>
                                {formatBRL(bid.amount)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                            <Gavel className="h-12 w-12 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Nenhum lance recebido</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </TabsContent>
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
 
                       {lot.animal?.vaccination_records && (typeof lot.animal.vaccination_records === 'string' ? lot.animal.vaccination_records.length > 0 : lot.animal.vaccination_records.length > 0) && (
                        <div className="mt-8">
                          <h3 className="text-sm font-black uppercase text-gold/60 mb-4 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" /> Registro de Vacinação
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(typeof lot.animal.vaccination_records === 'string' ? lot.animal.vaccination_records.split(',').map((s: string) => s.trim()).filter(Boolean) : lot.animal.vaccination_records).map((v: any, idx: number) => (
                              <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                   <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                                     <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                   </div>
                                   <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">VACINADO (SIM)</span>
                                     <span className="text-xs font-bold text-white/90 leading-tight">
                                       {typeof v === 'string' ? v : (v.vaccine || v.name || v.label)}
                                     </span>
                                   </div>
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
                         <Stethoscope className="h-4 w-4" /> Saúde do Animal
                       </h3>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                           <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Checklist de Saúde</p>
                            <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                              {(() => {
                                const staticItems = [
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
                                ];
                                
                                 const history = lot.animal?.veterinary_history || lot.animal?.health_info || {};
                                const customKeys = Object.keys(history).filter(k => 
                                  k !== 'other_info' && 
                                  k !== 'health_photo_url' && 
                                  !staticItems.find(i => i.id === k)
                                );
                                
                                const allItems = [
                                  ...staticItems,
                                  ...customKeys.map(k => ({ id: k, label: k }))
                                ];

                                return allItems.map(item => {
                                  const val = history[item.id];
                                  // We only show items if they have a value (true/false) OR if it's one of the static items
                                  const shouldShow = val !== undefined || staticItems.find(i => i.id === item.id);
                                  if (!shouldShow) return null;

                               return (
                                 <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                   <span className="text-xs text-white/80">{item.label}</span>
                                   <div className="flex items-center gap-3">
                                       {val === true ? (
                                         <div className="flex items-center gap-2">
                                           <span className="text-xs font-black uppercase text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">SIM</span>
                                           <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                                             <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                           </div>
                                         </div>
                                       ) : val === false ? (
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">NÃO</span>
                                            <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40">
                                              <XCircle className="h-4 w-4 text-red-400" />
                                            </div>
                                          </div>
                                       ) : (
                                         <div className="flex items-center gap-2">
                                           <span className="text-xs font-black uppercase text-white/20 bg-white/5 px-2 py-0.5 rounded border border-white/10">PENDENTE</span>
                                           <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                             <AlertCircle className="h-4 w-4 text-white/10" />
                                           </div>
                                         </div>
                                       )}
                                   </div>
                                 </div>
                                  );
                                });
                              })()}
                           </div>
                         </div>
                         
                         <div className="space-y-6">
                           {lot.animal?.veterinary_history?.health_photo_url && (
                             <div>
                               <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-3">Imagens de Exames (Raio-X)</p>
                               <div className="rounded-2xl border border-gold/20 overflow-hidden bg-black/40 group cursor-pointer" onClick={() => window.open(lot.animal.veterinary_history.health_photo_url, '_blank')}>
                                 <OptimizedImage 
                                   src={lot.animal.veterinary_history.health_photo_url} 
                                   alt="Exame de Saúde"
                                   aspectRatio="video"
                                   className="w-full h-auto group-hover:scale-110 transition-transform duration-500"
                                 />
                                 <div className="p-2 text-center bg-gold/10 text-[8px] font-black text-gold uppercase tracking-widest">Clique para ampliar</div>
                               </div>
                           </div>
                           )}

                           <div>
                             <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-3">Observações Veterinárias</p>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm text-white/60 italic leading-relaxed">
                               {lot.animal?.veterinary_history?.other_info || "Nenhuma observação adicional registrada."}
                             </div>
                           </div>

                           {/* Detalhamento Expansivo */}
                           <div className="pt-4">
                              <div className="flex flex-col gap-2">
                                <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Detalhamento do Animal</p>
                                <div className="p-4 bg-emerald-deep/40 rounded-2xl border border-gold/10 text-white/90">
                                  <p className="text-sm leading-relaxed whitespace-pre-line">
                                    {lot.animal?.description || "Informações detalhadas não informadas."}
                                  </p>
                                </div>
                              </div>
                           </div>
                         </div>
                       </div>
                     </Card>
                   </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-6 order-1 lg:order-2" id="bid-actions">
                <Card className="bg-emerald-deep/95 border-gold/20 p-8 rounded-[2.3rem] w-full shadow-2xl">
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
                    <div className="flex flex-col">
                      <p className="text-5xl font-black text-white italic">{formatBRL(currentPrice)}</p>
                      {COMMISSION_RATE > 0 && (
                        <p className="text-[10px] text-white/40 mt-1 uppercase font-bold tracking-widest">
                          + {COMMISSION_RATE}% de comissão do leiloeiro
                        </p>
                      )}
                    </div>
                   <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                     <p className="text-white/60 font-bold">30x {formatBRL(installmentValue)}</p>
                     <InstallmentSimulator price={currentPrice} commissionRate={COMMISSION_RATE} />
                   </div>
                 </div>
                   <div className="mt-8 space-y-6">
                     {user && profile && !profile.is_approved && (
                       <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl mb-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-500">
                         <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                         <div>
                           <p className="text-amber-500 font-black text-[10px] uppercase tracking-wider mb-1">Cadastro em Análise</p>
                           <p className="text-white/80 text-xs leading-relaxed">
                             Você ainda não está habilitado para dar lances. Seu cadastro está sendo revisado pela nossa equipe. 
                             <a href="https://wa.me/5581989437877" target="_blank" className="text-gold hover:underline font-bold block mt-1">Clique aqui para agilizar no WhatsApp</a>
                           </p>
                         </div>
                       </div>
                     )}

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
                        className={`w-full h-20 font-black text-2xl rounded-2xl transition-all duration-300 ${!isBiddingOpen ? 'bg-gray-500 cursor-not-allowed grayscale' : 'bg-gold-gradient text-emerald-deep shadow-gold'} ${isBiddingOpen && (animations?.bid_button_pulse || lot.event?.is_live_interactive) ? 'animate-pulse scale-[1.02] shadow-[0_0_30px_rgba(212,175,55,0.4)]' : ''}`} 
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
                     <div className="flex flex-col gap-3 mt-2">
                      {lot.animal?.accepts_offers && (dynamicStatus === 'pre_lance' || dynamicStatus === 'scheduled' || dynamicStatus === 'loteamento') && (
                        <Button 
                          className="w-full h-14 rounded-2xl bg-emerald-bright text-white hover:bg-emerald-bright/90 gap-2 font-black italic shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                          onClick={() => setIsOfferDialogOpen(true)}
                        >
                          <MessageSquare className="h-5 w-5" /> FAZER OFERTA DE COMPRA
                        </Button>
                      )}

                      <OfferDialog 
                        isOpen={isOfferDialogOpen} 
                        onOpenChange={setIsOfferDialogOpen} 
                        item={{
                          id: lot.id,
                          name: lot.animal?.name || `Lote ${lot.lot_number}`,
                          price: currentPrice,
                          type: 'lot'
                        }}
                      />
                      
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

                <Card className="bg-card/50 border-white/5 p-6 rounded-[2rem]">
                  <h3 className="text-sm font-black uppercase text-gold/60 mb-6 flex items-center gap-2">
                    <Gavel className="h-4 w-4" /> Histórico de Lances
                  </h3>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {recentBids.length > 0 ? (
                      recentBids.map((bid, idx) => (
                        <div key={bid.id} className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? 'bg-gold/10 border-gold/30' : 'bg-white/5 border-white/5'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-gold text-emerald-deep' : 'bg-white/10 text-white/40'}`}>
                              {idx + 1}
                            </div>
                             <div>
                                 <p className="text-xs font-bold text-white leading-none mb-1">
                                    {bid.bidder_name || (bid.user_id === user?.id ? profile?.full_name : 'Licitante')}
                                 </p>
                               <p className="text-[8px] text-white/40 uppercase font-bold">
                                {new Date(bid.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black italic ${idx === 0 ? 'text-gold' : 'text-white'}`}>
                              {formatBRL(bid.amount)}
                            </p>
                            {idx === 0 && <span className="text-[7px] font-black uppercase bg-gold text-emerald-deep px-1.5 py-0.5 rounded-full">LANCE ATUAL</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center space-y-3">
                        <Gavel className="h-8 w-8 text-white/10 mx-auto" />
                        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Ainda não há lances</p>
                      </div>
                    )}
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
