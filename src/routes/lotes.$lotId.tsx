import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Eye, Gavel, Heart, Share2, Award, Loader2, FileText, Video, Stethoscope, ChevronRight, Calculator, Info, MessageSquare, Zap, Download, Scale, Ruler, Fingerprint, Calendar, MapPin, Sparkles } from "lucide-react";
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
         .select("*, animal:animals(*), event:events!lots_event_id_fkey(*)")
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
      { name: "description", content: `${loaderData.lot.animal?.name}, ${loaderData.lot.animal?.breed}. Lance atual ${formatBRL(loaderData.lot.current_price || loaderData.lot.starting_price)}.` },
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

  return (
    <div className="relative overflow-x-auto py-10 bg-black/20 rounded-2xl border border-white/5">
      <div className="flex min-w-[800px] justify-center gap-12 px-8">
        <div className="flex flex-col justify-center">
          <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-gold/50 bg-emerald-deep p-5 text-center shadow-lg w-40">
            <Award className="h-6 w-6 text-gold mb-2" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Animal</div>
            <div className="mt-1 font-bold text-sm text-white">Principal</div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-16 relative">
          <div className="absolute -left-6 top-1/2 h-24 w-6 border-y border-r border-white/20 -translate-y-1/2 rounded-r-xl"></div>
          <div className="relative rounded-lg border border-white/10 bg-emerald-deep/40 p-4 text-center w-48 shadow-sm">
            <div className="text-[10px] uppercase font-semibold text-gold/60 tracking-wider mb-1">Pai (Sire)</div>
            <div className="font-bold text-white leading-tight">{pai}</div>
          </div>
          <div className="relative rounded-lg border border-white/10 bg-emerald-deep/40 p-4 text-center w-48 shadow-sm">
            <div className="text-[10px] uppercase font-semibold text-gold/60 tracking-wider mb-1">Mãe (Dam)</div>
            <div className="font-bold text-white leading-tight">{mae}</div>
          </div>
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
          setRecentBids((prev: any) => [{ ...payload.new, profile }, ...prev].slice(0, 5));
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
          <div className="flex items-center gap-3">
            {lot.status === 'active' && (
              <div className="flex items-center gap-2 bg-live/20 border border-live/30 px-3 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                <span className="text-live text-[10px] font-bold tracking-tighter">AO VIVO</span>
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
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
                <img src={lot.animal?.photos?.[activePhoto] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} alt={lot.animal?.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute left-6 top-6 flex gap-2">
                  <StatusBadge status={lot?.status} />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {lot.animal?.photos?.map((src: string, i: number) => (
                  <button key={i} onClick={() => setActivePhoto(i)} className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${activePhoto === i ? 'border-gold shadow-gold/20' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="detalhes" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 bg-emerald-deep/20 border border-white/5 rounded-2xl p-1">
                <TabsTrigger value="detalhes" className="rounded-xl data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Descrição</TabsTrigger>
                <TabsTrigger value="genealogia" className="rounded-xl data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Genealogia</TabsTrigger>
                <TabsTrigger value="saude" className="rounded-xl data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Saúde</TabsTrigger>
                <TabsTrigger value="videos" className="rounded-xl data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Vídeo</TabsTrigger>
                <TabsTrigger value="documentos" className="rounded-xl data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="detalhes" className="mt-6 space-y-6">
                <Card className="bg-card/50 border-white/5 p-8 rounded-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1px flex-1 bg-white/10" />
                    <span className="text-xs font-black text-gold uppercase tracking-[0.3em]">Descrição do Animal</span>
                    <div className="h-1px flex-1 bg-white/10" />
                  </div>
                  <p className="text-white/80 leading-relaxed italic whitespace-pre-wrap text-lg">
                    {lot.animal?.description || "Exemplar de alta linhagem, com características genéticas superiores e morfologia equilibrada. Uma oportunidade única para investidores exigentes."}
                  </p>
                  
                  <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Award, label: "Raça", value: lot.animal?.breed },
                      { icon: Info, label: "Sexo", value: lot.animal?.sex === 'M' ? 'Macho' : 'Fêmea' },
                      { icon: Calendar, label: "Idade", value: getAge(lot.animal?.birth_date) },
                      { icon: MapPin, label: "Local", value: lot.animal?.location || "Brasil" },
                      { icon: Scale, label: "Peso", value: lot.animal?.weight ? `${lot.animal.weight} kg` : null },
                      { icon: Ruler, label: "Altura", value: lot.animal?.height ? `${lot.animal.height} m` : null },
                      { icon: Sparkles, label: "Pelagem", value: lot.animal?.color },
                      { icon: Fingerprint, label: "Registro", value: lot.animal?.registration_number },
                    ].filter(item => item.value).map((item) => (
                      <div key={item.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                        <item.icon className="h-4 w-4 text-gold/60 mb-2" />
                        <div className="text-[9px] uppercase text-gold/40 font-black tracking-widest mb-1">{item.label}</div>
                        <div className="font-bold text-white text-sm">{item.value}</div>
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
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gold font-black mb-2">Oferta Atual</div>
                        <div className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none italic">
                          {formatBRL(currentPrice)}
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
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 5].map((m) => (
                        <Button key={m} variant="outline" className="h-16 flex flex-col rounded-2xl border-white/10 bg-white/5 text-white hover:bg-gold/20 hover:border-gold/50" disabled={isBidding || lot.status !== "active"} onClick={() => placeBid(currentPrice + (lot.bid_increment * m))}>
                          <span className="text-[8px] uppercase font-black text-gold/60 mb-1">+{m} inc.</span>
                          <span className="font-bold">+{formatBRL(lot.bid_increment * m)}</span>
                        </Button>
                      ))}
                    </div>

                    <Button size="lg" className="w-full h-20 bg-gold-gradient text-emerald-deep font-black text-2xl hover:opacity-90 shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all active:scale-[0.97] rounded-2xl uppercase tracking-tighter" disabled={isBidding || lot.status !== "active"} onClick={() => placeBid(nextBid)}>
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
