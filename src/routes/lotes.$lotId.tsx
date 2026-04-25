 import { createFileRoute, Link, notFound } from "@tanstack/react-router";
 import { Eye, Gavel, Heart, Share2, Award, Loader2 } from "lucide-react";
 import { formatBRL } from "@/utils/format";
 import { Button } from "@/components/ui/button";
 import { StatusBadge } from "@/components/auctions/status-badge";
 import { Countdown } from "@/components/auctions/countdown";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/components/auth/auth-provider";
 import { useEffect, useState } from "react";
 import { toast } from "sonner";
 
 export const Route = createFileRoute("/lotes/$lotId")({
   loader: async ({ params }) => {
     const { data: lot, error } = await supabase
       .from("lots")
       .select("*, animal:animals(*), event:events(*)")
       .eq("id", params.lotId)
       .single();
 
     if (error || !lot) throw notFound();
     return { lot };
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
 
 function LotDetail() {
   const { lot: initialLot } = Route.useLoaderData();
   const { user, profile } = useAuth();
   const [lot, setLot] = useState(initialLot);
   const [isBidding, setIsBidding] = useState(false);
 
   useEffect(() => {
     const channel = supabase
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
 
     return () => {
       supabase.removeChannel(channel);
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
 
   return (
     <div className="container mx-auto px-4 py-8">
       {lot.event && (
         <Link 
           to="/eventos/$eventSlug" 
           params={{ eventSlug: lot.event.slug || "" }} 
           className="text-sm text-muted-foreground hover:text-gold"
         >
           ← {lot.event.name}
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
               <button key={i} className="aspect-square overflow-hidden rounded-lg border border-border opacity-70 transition hover:opacity-100">
                 <img src={src} alt="" className="h-full w-full object-cover" />
               </button>
             ))}
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
 
           <div className="rounded-2xl border border-gold/30 bg-card p-6 shadow-gold">
             <div className="flex items-end justify-between">
               <div>
                 <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lance atual</div>
                 <div className="text-4xl font-bold text-gradient-gold">{formatBRL(currentPrice)}</div>
               </div>
               {lot.end_date && (
                 <div className="text-right">
                   <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Encerra em</div>
                   <Countdown endsAt={lot.end_date} className="font-mono text-xl font-bold text-foreground" />
                 </div>
               )}
             </div>
 
             <div className="mt-6 grid grid-cols-3 gap-2">
               {[1, 5, 10].map((m) => (
                 <Button 
                   key={m} 
                   variant="outline" 
                   className="border-gold/30 hover:bg-gold/10"
                   disabled={isBidding || lot.status !== "active"}
                   onClick={() => placeBid(currentPrice + (lot.bid_increment * m))}
                 >
                   +{formatBRL(lot.bid_increment * m)}
                 </Button>
               ))}
             </div>
             <Button 
               size="lg" 
               className="mt-3 w-full bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold"
               disabled={isBidding || lot.status !== "active"}
               onClick={() => placeBid(nextBid)}
             >
               {isBidding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               Dar lance de {formatBRL(nextBid)}
             </Button>
             <p className="mt-2 text-center text-xs text-muted-foreground">
               Incremento mínimo: {formatBRL(lot.bid_increment)}
             </p>
           </div>
 
           <div className="flex gap-2">
             <Button variant="outline" className="flex-1"><Heart className="mr-2 h-4 w-4" /> Acompanhar</Button>
             <Button variant="outline" className="flex-1"><Share2 className="mr-2 h-4 w-4" /> Compartilhar</Button>
           </div>
 
           <div className="rounded-2xl border border-border bg-card p-6">
             <h2 className="font-semibold">Pagamento</h2>
             <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
               {lot.payment_methods && lot.payment_methods.length > 0 ? (
                 lot.payment_methods.map((method, i) => <li key={i}>• {method}</li>)
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
