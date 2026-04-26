import { createFileRoute, Link, notFound } from "@tanstack/react-router";
 import { Eye, Gavel, Heart, Share2, Award, Loader2, FileText, Video, Stethoscope, ChevronRight, Calculator, Info, MessageSquare, Zap, Download, Scale, Ruler, Fingerprint, Calendar, MapPin, Sparkles, Timer, PlayCircle, Users } from "lucide-react";
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
         .limit(50)
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
});

function GenealogyTree({ genealogy }: { genealogy: any }) {
  if (!genealogy) return <div className="py-10 text-center text-muted-foreground">Informação de genealogia não disponível.</div>;

  const pai = genealogy.pai || genealogy.father || "Não informado";
  const mae = genealogy.mae || genealogy.mother || "Não informado";
  const avoPaterno = genealogy.avo_paterno || "A definir";
  const avoMaterna = genealogy.avo_materna || "A definir";

  return (
    <div className="relative overflow-x-auto py-6 md:py-10 bg-black/40 rounded-[2rem] border border-white/5 scrollbar-hide shadow-inner">
      <div className="flex min-w-[700px] lg:min-w-0 justify-center gap-4 md:gap-12 px-6 md:px-12">
        <div className="flex flex-col justify-center">
          <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-gold bg-emerald-deep p-4 md:p-6 text-center shadow-[0_0_20px_rgba(212,175,55,0.2)] w-32 md:w-44 h-32 md:h-44">
            <Award className="h-6 w-6 md:h-10 md:w-10 text-gold mb-2 md:mb-3" />
            <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gold/60">Animal</div>
            <div className="mt-1 font-black text-xs md:text-lg text-white leading-tight uppercase italic">Principal</div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-12 md:gap-20 relative">
          <div className="absolute -left-4 md:-left-8 top-[25%] bottom-[25%] w-4 md:w-8 border-y border-r border-white/20 rounded-r-2xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 text-center w-40 md:w-56 shadow-xl backdrop-blur-sm group hover:border-gold/30 transition-all">
            <div className="text-[8px] md:text-[10px] uppercase font-black text-gold/40 tracking-[0.2em] mb-2">Pai (Sire)</div>
            <div className="font-black text-white text-xs md:text-base leading-tight uppercase italic line-clamp-2">{pai}</div>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 text-center w-40 md:w-56 shadow-xl backdrop-blur-sm group hover:border-gold/30 transition-all">
            <div className="text-[8px] md:text-[10px] uppercase font-black text-gold/40 tracking-[0.2em] mb-2">Mãe (Dam)</div>
            <div className="font-black text-white text-xs md:text-base leading-tight uppercase italic line-clamp-2">{mae}</div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 md:gap-8 relative">
          <div className="absolute -left-4 md:-left-8 top-[12%] bottom-[62%] w-4 md:w-8 border-y border-r border-white/20 rounded-r-2xl" />
          <div className="absolute -left-4 md:-left-8 top-[62%] bottom-[12%] w-4 md:w-8 border-y border-r border-white/20 rounded-r-2xl" />
          {[avoPaterno, "A definir", avoMaterna, "A definir"].map((avo, idx) => (
            <div key={idx} className="relative rounded-xl border border-white/5 bg-white/5 p-3 md:p-4 text-center w-32 md:w-44 shadow-sm group hover:bg-gold/5 transition-all">
              <div className="text-[7px] md:text-[9px] uppercase font-bold text-white/30 tracking-widest mb-1">
                {idx === 0 ? "Avô Pat." : idx === 1 ? "Avó Pat." : idx === 2 ? "Avô Mat." : "Avó Mat."}
              </div>
              <div className="font-bold text-white/80 text-[10px] md:text-sm leading-tight uppercase truncate">{avo}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InstallmentSimulator({ price }: { price: number }) {
  const options = [1, 10, 20, 30, 40, 50];
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
        <div className="mt-4 space-y-3">
          {options.map((opt) => (
            <div key={opt} className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0">
              <span className="text-sm font-medium">{opt === 1 ? "À vista (PIX/TED)" : `${opt} parcelas mensais`}</span>
              <span className="font-bold text-gold">{formatBRL(price / opt)}</span>
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
           const newBid = { ...payload.new, profile };
           setRecentBids((prev: any) => [newBid, ...prev].slice(0, 50));
           
           // Alerta de novo lance
           toast.info(`Novo lance de ${formatBRL(payload.new.amount)}`, {
             description: `Licitante: ${profile?.full_name || "Licitante"}`,
             icon: <Gavel className="h-4 w-4 text-gold" />,
             duration: 5000,
           });
           
           // Som de alerta (opcional, pode ser bloqueado pelo navegador se não houver interação)
           try {
             const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
             audio.volume = 0.3;
             audio.play().catch(() => {}); // Ignora erro se o navegador bloquear
           } catch (e) {}
         }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(lotChannel);
      supabase.removeChannel(bidsChannel);
    };
  }, [lot.id]);

  const placeBid = async (amount: number) => {
    if (!user) { toast.error("Faça login para dar lances."); return; }
    if (!profile?.is_approved) { toast.error("Sua conta aguarda aprovação."); return; }
    
    if (dynamicStatus !== 'recebendo_lances' && dynamicStatus !== 'pre_lance') {
      toast.error("Este lote não está aceitando lances no momento.");
      return;
    }

    setIsBidding(true);
    try {
      const { error } = await supabase.from("bids").insert({ lot_id: lot.id, user_id: user.id, amount, bid_type: "online" });
      if (error) throw error;
      toast.success("Lance efetuado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao efetuar lance.");
    } finally {
      setIsBidding(false);
    }
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
  const installments = 30;
  const installmentValue = currentPrice / installments;

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

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <div className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl group cursor-zoom-in">
                    <img src={lot.animal?.photos?.[activePhoto] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} alt={lot.animal?.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
                  <img src={lot.animal?.photos?.[activePhoto] || ""} alt="" className="max-w-full max-h-full object-contain" />
                </DialogContent>
              </Dialog>
              <div className="grid grid-cols-5 gap-3">
                {lot.animal?.photos?.map((src: string, i: number) => (
                  <button key={i} onClick={() => setActivePhoto(i)} className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${activePhoto === i ? 'border-gold shadow-gold/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="detalhes" className="w-full">
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                 <TabsList className="inline-flex md:grid w-max md:w-full md:grid-cols-6 bg-emerald-deep/20 border border-white/5 rounded-2xl p-1 gap-1">
                  <TabsTrigger value="detalhes" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Descrição</TabsTrigger>
                  <TabsTrigger value="genealogia" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Genealogia</TabsTrigger>
                  <TabsTrigger value="saude" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Saúde</TabsTrigger>
                  <TabsTrigger value="videos" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Vídeo</TabsTrigger>
                   <TabsTrigger value="documentos" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Documentos</TabsTrigger>
                   <TabsTrigger value="historico" className="rounded-xl px-4 md:px-0 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep text-[10px] md:text-sm">Histórico</TabsTrigger>
               <TabsContent value="historico" className="mt-6">
                 <Card className="bg-card/50 border-white/5 overflow-hidden rounded-3xl">
                   <div className="p-6 border-b border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Gavel className="h-5 w-5 text-gold" />
                       <h3 className="font-bold text-white uppercase tracking-wider text-sm">Histórico Completo de Lances</h3>
                     </div>
                     <span className="text-[10px] font-bold text-white/40 uppercase bg-white/5 px-2 py-1 rounded-full">{recentBids.length} lances</span>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-white/5 text-[10px] font-black text-gold uppercase tracking-[0.2em]">
                           <th className="px-6 py-4">Licitante</th>
                           <th className="px-6 py-4">Valor</th>
                           <th className="px-6 py-4">Data/Hora</th>
                           <th className="px-6 py-4 text-right">Canal</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                         {recentBids.length > 0 ? recentBids.map((bid: any, i: number) => (
                           <tr key={bid.id} className={`group hover:bg-white/5 transition-colors ${i === 0 ? 'bg-gold/5' : ''}`}>
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                 <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-gold text-emerald-deep' : 'bg-emerald-deep text-white/40'}`}>
                                   {bid.profile?.full_name?.charAt(0) || "P"}
                                 </div>
                                 <span className={`text-sm font-bold ${i === 0 ? 'text-gold' : 'text-white/80'}`}>
                                   {bid.profile?.full_name || "Licitante oculto"}
                                 </span>
                               </div>
                             </td>
                             <td className="px-6 py-4 font-black text-white">{formatBRL(bid.amount)}</td>
                             <td className="px-6 py-4 text-xs text-white/40 font-medium">
                               {new Date(bid.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                             </td>
                             <td className="px-6 py-4 text-right">
                               <span className="text-[10px] font-black uppercase tracking-widest text-gold/30 group-hover:text-gold/60 transition-colors">
                                 {bid.bid_type || 'Online'}
                               </span>
                             </td>
                           </tr>
                         )) : (
                           <tr>
                             <td colSpan={4} className="px-6 py-10 text-center text-white/20 text-xs font-bold uppercase italic">Nenhum lance registrado até o momento</td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </Card>
               </TabsContent>
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
                    <Button variant="outline" className="h-20 justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold hover:text-emerald-deep" asChild>
                      <a href={lot.animal.pedigree_url} target="_blank">
                        <span className="flex items-center font-bold"><FileText className="mr-3 h-6 w-6 text-gold" /> PEDIGREE COMPLETO</span>
                        <Download className="h-5 w-5" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="h-20 justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold hover:text-emerald-deep" onClick={() => toast.info("Baixando encarte do lote...")}>
                    <span className="flex items-center font-bold"><Download className="mr-3 h-6 w-6 text-gold" /> ENCARTE DO LOTE (PDF)</span>
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" className="h-20 justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold hover:text-emerald-deep" onClick={() => toast.info("Baixando exames laboratoriais...")}>
                    <span className="flex items-center font-bold"><Stethoscope className="mr-3 h-6 w-6 text-gold" /> LAUDOS & EXAMES</span>
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" className="h-20 justify-between rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold hover:text-emerald-deep" onClick={() => toast.info("Visualizando histórico reprodutivo...")}>
                    <span className="flex items-center font-bold"><Fingerprint className="mr-3 h-6 w-6 text-gold" /> HISTÓRICO REPRODUTIVO</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
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
                      <InstallmentSimulator price={currentPrice} />
                    </div>
                    
                    <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 flex items-center gap-2 group" onClick={() => toast.info("Gerando encarte PDF...")}>
                      <Download className="h-4 w-4 text-gold group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-wider">Baixar Encarte do Lote (PDF)</span>
                    </Button>
                  </div>
                  </div>

                  <div className="space-y-4">
                    {lot.animal?.youtube_url && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full h-10 rounded-xl bg-white/5 text-white/60 hover:text-gold flex items-center justify-center gap-2 mb-2 border border-white/5"
                          >
                            <PlayCircle className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Ver vídeo do animal</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] bg-black p-0 border-white/10 overflow-hidden">
                          <div className="aspect-video">
                            <iframe 
                              src={lot.animal.youtube_url.replace("watch?v=", "embed/").split("&")[0]} 
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

                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 5].map((m) => (
                        <Button key={m} variant="outline" className="h-16 flex flex-col rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold/20 hover:border-gold/50" disabled={isBidding || (dynamicStatus !== "recebendo_lances" && dynamicStatus !== "pre_lance")} onClick={() => placeBid(currentPrice + (lot.bid_increment * m))}>
                          <span className="text-[8px] uppercase font-black text-gold/60 mb-1">+{m} inc.</span>
                          <span className="font-bold">+{formatBRL(lot.bid_increment * m)}</span>
                        </Button>
                      ))}
                    </div>

                     <Button 
                       size="lg" 
                       className={`w-full h-20 text-emerald-deep font-black text-2xl hover:opacity-90 shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all active:scale-[0.97] rounded-2xl uppercase tracking-tighter ${dynamicStatus === 'recebendo_lances' ? 'shimmer-button animate-blink-fast' : 'bg-gold-gradient'}`} 
                       disabled={isBidding || (dynamicStatus !== "recebendo_lances" && dynamicStatus !== "pre_lance")} 
                       onClick={() => placeBid(nextBid)}
                     >
                      {isBidding ? <Loader2 className="animate-spin" /> : "CONFIRMAR LANCE"}
                    </Button>
                    
                    <p className="text-center text-[10px] text-white/40 font-bold uppercase tracking-widest">
                      Lances confirmados são irrevogáveis.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 rounded-2xl border-white/10 bg-card text-white hover:bg-white/5"><Heart className="mr-2 h-4 w-4" /> SEGUIR</Button>
              <Button variant="outline" className="h-14 rounded-2xl border-white/10 bg-card text-white hover:bg-white/5"><Share2 className="mr-2 h-4 w-4" /> COMPARTILHAR</Button>
            </div>

            <Card className="rounded-[2rem] border-white/5 bg-card overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center gap-2">
                <Zap className="h-4 w-4 text-gold" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Lances Recentes</span>
              </div>
               <div className="p-4 space-y-3">
                 {recentBids.length > 0 ? recentBids.slice(0, 5).map((bid: any, i: number) => (
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
                 )) : <div className="text-center py-6 text-white/20 text-[10px] font-black uppercase tracking-widest italic">Aguardando primeiro lance...</div>}
                 
                 {recentBids.length > 5 && (
                   <Button 
                     variant="ghost" 
                     className="w-full h-8 text-[10px] font-black text-gold/60 hover:text-gold uppercase tracking-[0.2em]"
                     onClick={() => {
                       const tabsElement = document.querySelector('[role="tablist"]');
                       const historyTab = tabsElement?.querySelector('[value="historico"]') as HTMLElement;
                       historyTab?.click();
                       historyTab?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     }}
                   >
                     Ver todos os {recentBids.length} lances
                   </Button>
                 )}
              </div>
            </Card>

            <div className="p-8 rounded-[2rem] border border-emerald-bright/20 bg-emerald-bright/5">
              <h2 className="text-white font-black text-sm uppercase tracking-widest mb-4">Pagamento & Envio</h2>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex gap-2"> <span className="text-gold">•</span> À vista com 5% de desconto no PIX/TED. </li>
                <li className="flex gap-2"> <span className="text-gold">•</span> Parcelamento em 30x (2+2+26). </li>
                <li className="flex gap-2"> <span className="text-gold">•</span> Frete por conta do comprador. </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
