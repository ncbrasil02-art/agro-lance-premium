  import { createFileRoute, useRouter } from "@tanstack/react-router";
  import { PAGE_LIMITS } from "@/config/limits";
 import { PageSkeleton } from "@/components/ui/page-skeleton";
 import { ErrorFallback } from "@/components/ui/error-fallback";
 import { useRealtimeLots } from "@/hooks/useRealtimeEvent";
 import { LotCard } from "@/components/auctions/lot-card";
 import { supabase } from "@/integrations/supabase/client";
 import { lotSchema } from "@/lib/schemas";
 import { z } from "zod";
 import { useQuery } from "@tanstack/react-query";
  import { Loader2, Search, Filter, RefreshCw } from "lucide-react";
 import { logger } from "@/utils/logger";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Input } from "@/components/ui/input";
 import { useState, useMemo } from "react";
 import { getEffectiveLotStatus } from "@/utils/auction-status";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

 export const Route = createFileRoute("/lotes/")({
   validateSearch: (search: Record<string, unknown>): { limit?: number } => {
     return {
       limit: Number(search.limit) || undefined,
     };
   },
   loaderDeps: ({ search }: any) => ({ limit: search.limit }),
  head: () => ({
    meta: [
      { title: "Lotes — Premium Agro Leilões" },
      { name: "description", content: "Todos os lotes em leilão: cavalos, bovinos e embriões de alta linhagem." },
      { property: "og:title", content: "Lotes em Leilão" },
      { property: "og:description", content: "Animais e embriões selecionados para leilão." },
    ],
  }),
     loader: async ({ deps }: any) => {
      logger.info("Iniciando carregamento da página de Lotes");
      try {
         const { data: settingsData } = await supabase
            .from("site_settings")
            .select("key, value")
            .eq("key", "lot_card_settings")
            .maybeSingle();

         const { data: lots, error } = await supabase
            .from("lots")
            .select("*, animal:animals!lots_animal_id_fkey(*, sellers!animals_seller_id_fkey(name)), event:events!lots_event_id_fkey(*)")
            .order("created_at", { ascending: false })
             .limit(deps.limit || PAGE_LIMITS.LOTS_LIST);
       
        if (error) {
          logger.error("Erro Supabase ao carregar lotes", { error });
          throw error;
        }

        const validatedLots = z.array(lotSchema).parse(lots || []);
        logger.info("Lotes carregados e validados com sucesso", { count: validatedLots.length });
        return { lots: validatedLots, settings: settingsData?.value || null };
      } catch (error) {
        logger.error("Erro ao carregar página de Lotes", { error });
        throw error;
      }
    },
   component: LotsPage,
   pendingComponent: PageSkeleton,
   errorComponent: ErrorFallback,
});

  function LotsPage() {
     const { lots = [], settings } = Route.useLoaderData() as any;
     const { limit = PAGE_LIMITS.LOTS_LIST } = Route.useSearch();
    const router = useRouter();
   const [filter, setFilter] = useState("all");
   const [searchTerm, setSearchTerm] = useState("");
   const [sortBy, setSortBy] = useState("newest");

   useRealtimeLots(() => {
     router.invalidate();
   });

   const mappedLots = useMemo(() => {
     return lots?.map((l: any) => ({
       id: l.id,
       number: l.lot_number,
       eventId: l.event_id,
       name: l.animal?.name || "Sem nome",
       breed: l.animal?.breed || "",
       category: l.animal?.species as any,
        cover: l.animal?.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
        photos: l.animal?.photos || [],
        youtube_url: l.animal?.youtube_url || "",
        registration_number: l.animal?.registration_number || "",
        vaccination_records: l.animal?.vaccination_records || null,
        currentBid: l.current_price || l.starting_price,
       minIncrement: l.bid_increment,
       bidsCount: l.bids_count || 0,
       viewers: l.viewers || 0,
       endsAt: l.end_date || "",
       status: l.status as any,
       eventStatus: l.event?.status,
       eventStartDate: l.event?.start_date,
       eventEndDate: l.event?.end_date,
       allowsPreBidding: l.allows_pre_bidding || l.event?.allows_pre_bidding,
       father: l.animal?.genealogy?.father,
       mother: l.animal?.genealogy?.mother,
       sex: l.animal?.sex,
       color: l.animal?.color,
       birthDate: l.animal?.birth_date,
       seller: l.animal?.seller?.name,
       location: l.animal?.location,
       createdAt: l.created_at,
     }));
   }, [lots]);

   const filteredLots = useMemo(() => {
     let result = mappedLots || [];

     // Search filter
     if (searchTerm) {
       const term = searchTerm.toLowerCase();
       result = result.filter((l: any) => 
         l.name.toLowerCase().includes(term) || 
         l.breed.toLowerCase().includes(term) ||
         l.seller?.toLowerCase().includes(term)
       );
     }

     // Status filter
     if (filter !== "all") {
       result = result.filter((l: any) => {
         const effectiveStatus = getEffectiveLotStatus({
           status: l.status,
           event_status: l.eventStatus,
           event_start_date: l.eventStartDate,
           event_end_date: l.eventEndDate,
           allows_pre_bidding: l.allowsPreBidding
         });

         if (filter === "live") {
           return ["live", "recebendo_lances", "pre_lance"].includes(effectiveStatus);
         }
         if (filter === "upcoming") {
           return ["loteamento", "scheduled"].includes(effectiveStatus);
         }
         if (filter === "finished") {
           return ["sold", "passed", "finished"].includes(effectiveStatus);
         }
         return true;
       });
     }

      // Sorting
      result = [...result].sort((a: any, b: any) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "lot_number":
            return (a.number || 0) - (b.number || 0);
          case "price_desc":
            return (b.currentBid || 0) - (a.currentBid || 0);
          case "price_asc":
            return (a.currentBid || 0) - (b.currentBid || 0);
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "most_bids":
            return (b.bidsCount || 0) - (a.bidsCount || 0);
          case "ending_soon":
            if (!a.endsAt) return 1;
            if (!b.endsAt) return -1;
            return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
          default:
            return 0;
        }
      });

     return result;
   }, [mappedLots, filter, searchTerm, sortBy]);

   return (
     <div className="container mx-auto px-4 py-12">
       <header className="mb-10">
         <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Todos os lotes</h1>
         <p className="mt-2 text-muted-foreground">{filteredLots.length} animais encontrados.</p>
       </header>

       <div className="flex flex-col gap-6 mb-8">
         <div className="flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Buscar por nome, raça ou vendedor..." 
               className="pl-10 h-12 bg-background/50 border-border/50 focus:border-gold/50 rounded-xl"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="w-full md:w-48">
             <Select value={sortBy} onValueChange={setSortBy}>
               <SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl">
                 <SelectValue placeholder="Ordenar por" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="newest">Mais Recentes</SelectItem>
                  <SelectItem value="lot_number">Nº do Lote</SelectItem>
                  <SelectItem value="price_desc">Maior Valor</SelectItem>
                  <SelectItem value="price_asc">Menor Valor</SelectItem>
                  <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="most_bids">Mais Disputados</SelectItem>
                  <SelectItem value="ending_soon">Encerrando em Breve</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </div>

         <div className="overflow-x-auto scrollbar-hide">
           <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
             <TabsList className="bg-emerald-deep/20 border border-white/5 rounded-2xl p-1 inline-flex w-auto">
               <TabsTrigger value="all" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Todos</TabsTrigger>
               <TabsTrigger value="live" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Em Leilão</TabsTrigger>
               <TabsTrigger value="upcoming" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">À Disponibilizar</TabsTrigger>
               <TabsTrigger value="finished" className="rounded-xl px-6 data-[state=active]:bg-gold data-[state=active]:text-emerald-deep">Encerrados</TabsTrigger>
             </TabsList>
           </Tabs>
         </div>
       </div>

       {filteredLots.length === 0 ? (
         <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
           <p className="text-muted-foreground">Nenhum lote encontrado com os filtros selecionados.</p>
         </div>
       ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filteredLots?.map((l: any) => <LotCard key={l.id} lot={l as any} settings={settings} />)}
          </div>
        )}
 
        {lots.length >= limit && (
          <div className="flex justify-center py-12">
            <button
             onClick={() => router.navigate({ search: (prev: any) => ({ ...prev, limit: limit + PAGE_LIMITS.LOTS_LIST }) })}
              className="group relative px-10 py-4 bg-emerald-deep/40 border border-gold/30 rounded-2xl text-gold font-black uppercase tracking-widest hover:bg-gold hover:text-emerald-deep transition-all duration-300 shadow-2xl overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Carregar Mais Lotes
                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>
        )}
      </div>
   );
 }
