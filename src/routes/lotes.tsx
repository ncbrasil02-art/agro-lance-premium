 import { createFileRoute } from "@tanstack/react-router";
 import { LotCard } from "@/components/auctions/lot-card";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery } from "@tanstack/react-query";
 import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/lotes")({
  head: () => ({
    meta: [
      { title: "Lotes — Premium Agro Leilões" },
      { name: "description", content: "Todos os lotes em leilão: cavalos, bovinos e embriões de alta linhagem." },
      { property: "og:title", content: "Lotes em Leilão" },
      { property: "og:description", content: "Animais e embriões selecionados para leilão." },
    ],
  }),
    loader: async () => {
      const { data: lots, error } = await supabase
        .from("lots")
        .select("*, animal:animals(*), event:events!lots_event_id_fkey(*)")
        .order("is_featured", { ascending: false })
        .order("lot_number", { ascending: true });
     
     if (error) throw error;
     return { lots };
   },
   component: LotsPage,
});

function LotsPage() {
   const { lots } = Route.useLoaderData();
 
   const mappedLots = lots.map((l: any) => ({
     id: l.id,
     number: l.lot_number,
     eventId: l.event_id,
     name: l.animal?.name || "Sem nome",
     breed: l.animal?.breed || "",
     category: l.animal?.species as any,
     cover: l.animal?.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
     currentBid: l.current_price || l.starting_price,
     minIncrement: l.bid_increment,
     bidsCount: l.bids_count || 0,
     viewers: l.viewers || 0,
     endsAt: l.end_date || "",
     status: l.status as any,
   }));
 
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Todos os lotes</h1>
         <p className="mt-2 text-muted-foreground">{mappedLots.length} animais disponíveis nos leilões ativos.</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
         {mappedLots.map((l) => <LotCard key={l.id} lot={l as any} />)}
      </div>
    </div>
  );
}
