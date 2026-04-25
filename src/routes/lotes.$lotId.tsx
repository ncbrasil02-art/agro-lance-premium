 import { createFileRoute, Link, notFound } from "@tanstack/react-router";
 import { Eye, Gavel, Heart, Share2, Award, Loader2, FileText, Video, Stethoscope, ChevronRight, Calculator, Info, MessageSquare, Zap } from "lucide-react";
 import { formatBRL } from "@/utils/format";
 import { Button } from "@/components/ui/button";
 import { StatusBadge } from "@/components/auctions/status-badge";
 import { Countdown } from "@/components/auctions/countdown";
 import { supabase } from "@/integrations/supabase/client";
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
 
 export const Route = createFileRoute("/lotes/$lotId")({
    loader: async ({ params }) => {
      const [lotRes, bidsRes] = await Promise.all([
        supabase
          .from("lots")
          .select("*, animal:animals(*), event:events(*)")
          .eq("id", params.lotId)
          .single(),
        supabase
          .from("bids")
          .select("*, profile:profiles(full_name)")
          .eq("lot_id", params.lotId)
          .order("created_at", { ascending: false })
          .limit(5)
      ]);
  
      if (lotRes.error || !lotRes.data) throw notFound();
      return { lot: lotRes.data, initialBids: bidsRes.data || [] };
    },
   head: ({ loaderData }) => ({
     meta: loaderData ? [
       { title: `Lote ${loaderData.lot.lot_number} — ${loaderData.lot.animal?.name} — Elite Agro` },
       { name: "description", content: `${loaderData.lot.animal?.name}, ${loaderData.lot.animal?.breed}. Lance atual ${formatBRL(loaderData.lot.current_price || loaderData.lot.starting_price)}.` },
       { property: "og:title", content: `${loaderData.lot.animal?.name} — Lote ${loaderData.lot.lot_number}` },
       { property: "og:image", content: loaderData.lot.animal?.photos?.[0] },
     ] : [],
   }),
   notFoundComponent: () => (
     <div className="container mx-auto px-4 py-20 text-center">
       <h1 className="text-3xl font-bold">Lote não encontrado</h1>
       <Link to="/lotes" className="mt-4 inline-block text-gold hover:underline">Ver todos os lotes</Link>
     </div>
   ),
   component: LotDetail,
 });
 
 function GenealogyTree({ genealogy }: { genealogy: any }) {
   if (!genealogy) return <div className="py-10 text-center text-muted-foreground">Informação de genealogia não disponível.</div>;
 
   return (
     <div className="relative overflow-x-auto py-10 bg-muted/20 rounded-2xl border border-border/40">
       <div className="flex min-w-[800px] justify-center gap-12 px-8">
         {/* Nível 1: Animal */}
         <div className="flex flex-col justify-center">
           <div className="group relative">
             <div className="absolute -inset-1 rounded-xl bg-gold/20 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
             <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-gold/50 bg-card p-5 text-center shadow-lg w-40">
               <Award className="h-6 w-6 text-gold mb-2" />
               <div className="text-[10px] font-bold uppercase tracking-widest text-gold/80">Animal</div>
               <div className="mt-1 font-bold text-sm">Principal</div>
             </div>
           </div>
         </div>
 
         <div className="flex flex-col justify-center gap-16 relative">
           {/* Linhas conectoras Pais */}
           <div className="absolute -left-6 top-1/2 h-24 w-6 border-y border-r border-border/60 -translate-y-1/2 rounded-r-xl"></div>
           
           {/* Nível 2: Pais */}
           <div className="relative flex items-center group">
             <div className="absolute -inset-0.5 rounded-lg bg-border/20 blur-sm opacity-0 group-hover:opacity-100 transition"></div>
             <div className="relative rounded-lg border border-border bg-card p-4 text-center w-48 shadow-sm group-hover:border-gold/30 transition-smooth">
               <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Pai (Sire)</div>
               <div className="font-bold text-foreground leading-tight">{genealogy.pai || "Não informado"}</div>
             </div>
           </div>
           <div className="relative flex items-center group">
             <div className="absolute -inset-0.5 rounded-lg bg-border/20 blur-sm opacity-0 group-hover:opacity-100 transition"></div>
             <div className="relative rounded-lg border border-border bg-card p-4 text-center w-48 shadow-sm group-hover:border-gold/30 transition-smooth">
               <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Mãe (Dam)</div>
               <div className="font-bold text-foreground leading-tight">{genealogy.mae || "Não informado"}</div>
             </div>
           </div>
         </div>
 
         <div className="flex flex-col justify-center gap-6 relative">
           {/* Linhas conectoras Avós */}
           <div className="absolute -left-6 top-[25%] h-12 w-6 border-y border-r border-border/60 -translate-y-1/2 rounded-r-lg"></div>
           <div className="absolute -left-6 top-[75%] h-12 w-6 border-y border-r border-border/60 -translate-y-1/2 rounded-r-lg"></div>
 
           {/* Nível 3: Avós */}
           {[
             { label: "Avô Paterno", val: genealogy.avo_paterno },
             { label: "Avó Paterna", val: genealogy.ava_paterna },
             { label: "Avô Materno", val: genealogy.avo_materno },
             { label: "Avó Materna", val: genealogy.ava_materna }
           ].map((avo, i) => (
             <div key={i} className="relative group">
               <div className="relative rounded-lg border border-border/60 bg-card/60 p-3 text-center text-xs w-44 shadow-xs group-hover:border-gold/20 transition-smooth">
                 <div className="text-[9px] uppercase font-medium text-muted-foreground tracking-tight mb-0.5">{avo.label}</div>
                 <div className="font-semibold text-foreground/90">{avo.val || "—"}</div>
               </div>
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
       <DialogContent className="sm:max-w-[425px]">
         <DialogHeader>
           <DialogTitle>Simulador de Pagamento</DialogTitle>
           <DialogDescription>
             Veja as condições de parcelamento para este lote.
           </DialogDescription>
         </DialogHeader>
         <div className="mt-4 space-y-3">
           {options.map((opt) => (
             <div key={opt} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
               <span className="text-sm font-medium">{opt === 1 ? "À vista (PIX/TED)" : `${opt} parcelas mensais`}</span>
               <span className="font-bold text-foreground">{formatBRL(price / opt)}</span>
             </div>
           ))}
           <div className="mt-6 rounded-lg bg-gold/5 p-3 text-[10px] text-muted-foreground flex gap-2">
             <Info className="h-4 w-4 shrink-0 text-gold" />
             <p>As condições finais dependem da aprovação de cadastro e podem variar conforme o regulamento do leiloeiro.</p>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 }
 
  function LotDetail() {
    const { lot: initialLot, initialBids } = Route.useLoaderData();
    const { user, profile } = useAuth();
    const [lot, setLot] = useState(initialLot);
    const [recentBids, setRecentBids] = useState<any[]>(initialBids);
    const [isBidding, setIsBidding] = useState(false);
  
    useEffect(() => {
      const lotChannel = supabase
        .channel(`lot-${lot.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "lots",
            filter: `id=eq.${lot.id}`,
          },
          (payload) => {
            setLot((prev) => ({ ...prev, ...payload.new }));
          }
        )
        .subscribe();
 
      const bidsChannel = supabase
        .channel(`bids-${lot.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bids",
            filter: `lot_id=eq.${lot.id}`,
          },
          async (payload) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.user_id)
              .single();
            
            const newBidWithProfile = { ...payload.new, profile };
            setRecentBids((prev) => [newBidWithProfile, ...prev].slice(0, 5));
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(lotChannel);
        supabase.removeChannel(bidsChannel);
      };
    }, [lot.id]);
 
   const placeBid = async (amount: number) => {
     if (!user) {
       toast.error("Você precisa estar logado para dar lances.");
       return;
     }
 
     if (!profile?.is_approved) {
       toast.error("Sua conta ainda não foi aprovada para dar lances.");
       return;
     }
 
     setIsBidding(true);
     try {
       const { error } = await supabase
         .from("bids")
         .insert({
           lot_id: lot.id,
           user_id: user.id,
           amount,
           bid_type: "online",
         });
 
       if (error) throw error;
       toast.success("Lance efetuado com sucesso!");
     } catch (error: any) {
       toast.error(error.message || "Erro ao efetuar lance.");
     } finally {
       setIsBidding(false);
     }
   };
 
   const currentPrice = lot.current_price || lot.starting_price;
   const nextBid = currentPrice + lot.bid_increment;
  const installments = 30; // Exemplo de 30 parcelas
  const installmentValue = currentPrice / installments;
 
   return (
     <div className="container mx-auto px-4 py-8">
       {lot.event && (
        <Link 
            to="/eventos/$eventSlug" 
            params={{ eventSlug: lot.event?.slug || "" }} 
            className="text-sm text-muted-foreground hover:text-gold"
          >
            ← {lot.event?.name}
          </Link>
       )}
 
       <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
         {/* Galeria */}
         <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted">
            <img 
              src={lot.animal?.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} 
              alt={lot.animal?.name} 
              className="h-full w-full object-cover" 
            />
            <div className="absolute left-4 top-4 flex gap-2">
              <StatusBadge status={lot.status as any} />
              <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-bold backdrop-blur">
                LOTE {String(lot.lot_number).padStart(2, "0")}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {lot.animal?.photos?.map((src, i) => (
              <button key={i} className="aspect-square overflow-hidden rounded-lg border border-border opacity-70 transition hover:opacity-100 focus:ring-2 focus:ring-gold outline-none">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div className="mt-8">
            <Tabs defaultValue="detalhes" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
                <TabsTrigger value="detalhes">Descrição</TabsTrigger>
                <TabsTrigger value="genealogia">Genealogia</TabsTrigger>
                <TabsTrigger value="saude">Saúde</TabsTrigger>
               <TabsTrigger value="videos">Vídeo</TabsTrigger>
                <TabsTrigger value="documentos" className="hidden lg:inline-flex">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="detalhes" className="mt-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {"Este exemplar apresenta características excepcionais da raça, com excelente conformação e temperamento. Ideal para quem busca genética de ponta e resultados comprovados em pista ou reprodução."}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-[10px] uppercase text-muted-foreground">Raça</div>
                        <div className="font-semibold">{lot.animal?.breed}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-[10px] uppercase text-muted-foreground">Sexo</div>
                        <div className="font-semibold">{lot.animal?.sex === 'M' ? 'Macho' : 'Fêmea'}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-[10px] uppercase text-muted-foreground">Localização</div>
                        <div className="font-semibold">{lot.animal?.location || "Não informada"}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="genealogia" className="mt-6">
                <GenealogyTree genealogy={lot.animal?.genealogy} />
              </TabsContent>

              <TabsContent value="saude" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-full bg-emerald/10 p-2">
                        <Stethoscope className="h-5 w-5 text-emerald-bright" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Exames Veterinários</div>
                        <div className="font-semibold">Aprovado e Regularizado</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-full bg-emerald/10 p-2">
                        <Award className="h-5 w-5 text-emerald-bright" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Vacinação</div>
                        <div className="font-semibold">Plano Sanitário em Dia</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
                  Todos os animais possuem atestado negativo para Anemia Infecciosa Equina (AIE) e Mormo, além de estarem com a vacinação de Influenza e Encefalomielite atualizadas.
                </div>
              </TabsContent>

              <TabsContent value="videos" className="mt-6">
                <div className="grid gap-4">
                  {lot.animal?.youtube_url ? (
                    <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black">
                      <iframe 
                        src={lot.animal.youtube_url.replace("watch?v=", "embed/").split("&")[0]} 
                        className="h-full w-full" 
                        allowFullScreen
                        title="Apresentação do Animal"
                      />
                    </div>
                  ) : lot.animal?.videos && (lot.animal.videos as string[]).length > 0 ? (
                    (lot.animal.videos as string[]).map((url: string, i: number) => (
                      <div key={i} className="aspect-video overflow-hidden rounded-xl border border-border bg-black">
                        <video src={url} controls className="h-full w-full" />
                      </div>
                    ))
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground">
                      <Video className="mb-2 h-10 w-10 opacity-20" />
                      <p>Vídeo de apresentação não disponível</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documentos" className="mt-6">
                <div className="space-y-3">
                  {lot.animal?.pedigree_url && (
                    <Button variant="outline" className="w-full justify-between" asChild>
                      <a href={lot.animal.pedigree_url} target="_blank">
                        <span className="flex items-center"><FileText className="mr-2 h-4 w-4" /> Árvore Genealógica (PDF)</span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full justify-between" asChild>
                    <a href="#" target="_blank">
                      <span className="flex items-center"><FileText className="mr-2 h-4 w-4" /> Laudo Veterinário</span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </a>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
 
         {/* Info + Lance */}
         <div className="space-y-6">
           <div>
             <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{lot.animal?.name}</h1>
             <p className="mt-1 text-muted-foreground">{lot.animal?.breed} · {lot.animal?.species}</p>
             <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
               <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {lot.viewers || 0} acompanhando</span>
               <span className="flex items-center gap-1"><Gavel className="h-3.5 w-3.5" /> {lot.bids_count || 0} lances</span>
             </div>
           </div>
 
            <Card className="border-gold/30 shadow-gold overflow-hidden">
              <div className="bg-emerald-deep p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-gold" />
                  <span className="text-xs font-bold uppercase tracking-widest">Oferta Atual</span>
                </div>
                {lot.end_date && (
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                    <span className="text-[10px] font-medium opacity-80">Faltam:</span>
                    <Countdown endsAt={lot.end_date as string} className="font-mono text-sm font-bold text-gold-bright" />
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col gap-1">
                  <div className="text-4xl font-black text-gradient-gold tracking-tighter">
                    {formatBRL(currentPrice)}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    ou {installments}x de <span className="text-foreground font-bold">{formatBRL(installmentValue)}</span>
                  </div>
                  <InstallmentSimulator price={currentPrice} />
                </div>

                <div className="mt-8 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 5].map((m) => (
                      <Button 
                        key={m} 
                        variant="outline" 
                        size="sm"
                        className="border-gold/20 hover:bg-gold/5 h-12 flex flex-col"
                        disabled={isBidding || lot.status !== "active"}
                        onClick={() => placeBid(currentPrice + (lot.bid_increment * m))}
                      >
                        <span className="text-[10px] opacity-60">+{m} inc.</span>
                        <span className="font-bold">+{formatBRL(lot.bid_increment * m)}</span>
                      </Button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-card px-2 text-muted-foreground">Lance Personalizado</span></div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-14 bg-gold-gradient text-emerald-deep font-bold text-lg hover:opacity-90 shadow-gold transition-all active:scale-[0.98]"
                    disabled={isBidding || lot.status !== "active"}
                    onClick={() => placeBid(nextBid)}
                  >
                    {isBidding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Gavel className="mr-2 h-5 w-5" />}
                    Dar lance de {formatBRL(nextBid)}
                  </Button>
                  
                  <p className="text-center text-[10px] text-muted-foreground">
                    {!user ? (
                      <Link to="/login" className="text-gold hover:underline font-bold">Faça login para dar lances</Link>
                    ) : !profile?.is_approved ? (
                      <span className="text-destructive font-semibold">Conta aguardando aprovação administrativa</span>
                    ) : (
                      "Ao confirmar, você concorda com os termos de uso e condições do leilão."
                    )}
                    <br />Incremento mínimo: {formatBRL(lot.bid_increment)}
                  </p>
                </div>
              </CardContent>
            </Card>
 
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" className="border-border hover:bg-secondary"><Heart className="mr-2 h-4 w-4" /> Acompanhar</Button>
              <Button variant="outline" size="lg" className="border-border hover:bg-secondary"><Share2 className="mr-2 h-4 w-4" /> Compartilhar</Button>
               <Button variant="outline" size="lg" className="col-span-2 border-emerald/30 text-emerald-bright hover:bg-emerald/5" asChild>
                 <a href={`https://wa.me/5511999999999?text=Olá, gostaria de mais informações sobre o Lote ${lot.lot_number}: ${lot.animal?.name}`} target="_blank">
                   <MessageSquare className="mr-2 h-4 w-4" /> Dúvidas? Fale no WhatsApp
                 </a>
               </Button>
             </div>
 
             {/* Histórico de Lances */}
             <div className="rounded-2xl border border-border bg-card p-6">
               <h2 className="flex items-center gap-2 font-semibold"><Zap className="h-4 w-4 text-gold" /> Lances recentes</h2>
               <div className="mt-4 space-y-3">
                 {recentBids.length > 0 ? (
                   recentBids.map((bid: any) => (
                     <div key={bid.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                       <div>
                         <div className="text-sm font-bold">{bid.profile?.full_name || "Participante"}</div>
                         <div className="text-[10px] text-muted-foreground">{new Date(bid.created_at).toLocaleTimeString()}</div>
                       </div>
                       <div className="text-sm font-black text-gold-bright">{formatBRL(bid.amount)}</div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-4 text-xs text-muted-foreground">Nenhum lance efetuado ainda.</div>
                 )}
               </div>
             </div>
  
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold">Pagamento</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {lot.payment_methods && lot.payment_methods.length > 0 ? (
                  lot.payment_methods.map((method: string, i: number) => <li key={i}>• {method}</li>)
                ) : (
                  <>
                    <li>• À vista no PIX (5% desconto)</li>
                    <li>• Entrada de 30% + 20 parcelas mensais</li>
                    <li>• Boleto ou transferência bancária</li>
                  </>
                )}
              </ul>
            </div>
 
           <div className="rounded-2xl border border-border bg-card p-6">
             <h2 className="flex items-center gap-2 font-semibold"><Award className="h-4 w-4 text-gold" /> Genealogia & saúde</h2>
             <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
               <div>
                 <dt className="text-xs text-muted-foreground">Pai</dt>
                 <dd className="font-medium">{(lot.animal?.genealogy as any)?.pai || "Não informado"}</dd>
               </div>
               <div>
                 <dt className="text-xs text-muted-foreground">Mãe</dt>
                 <dd className="font-medium">{(lot.animal?.genealogy as any)?.mae || "Não informado"}</dd>
               </div>
               <div>
                 <dt className="text-xs text-muted-foreground">Vacinação</dt>
                 <dd className="font-medium text-emerald-bright">{(lot.animal?.health_info as any)?.vacinas || "Em dia"}</dd>
               </div>
               <div>
                 <dt className="text-xs text-muted-foreground">Exames</dt>
                 <dd className="font-medium text-emerald-bright">{(lot.animal?.health_info as any)?.exames || "Aprovado"}</dd>
               </div>
             </dl>
           </div>
         </div>
       </div>
     </div>
   );
 }
