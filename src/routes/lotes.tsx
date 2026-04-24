import { createFileRoute } from "@tanstack/react-router";
import { lots } from "@/lib/mock-data";
import { LotCard } from "@/components/auctions/lot-card";

export const Route = createFileRoute("/lotes")({
  head: () => ({
    meta: [
      { title: "Lotes — Premium Agro Leilões" },
      { name: "description", content: "Todos os lotes em leilão: cavalos, bovinos e embriões de alta linhagem." },
      { property: "og:title", content: "Lotes em Leilão" },
      { property: "og:description", content: "Animais e embriões selecionados para leilão." },
    ],
  }),
  component: LotsPage,
});

function LotsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Todos os lotes</h1>
        <p className="mt-2 text-muted-foreground">{lots.length} animais disponíveis nos leilões ativos.</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lots.map((l) => <LotCard key={l.id} lot={l} />)}
      </div>
    </div>
  );
}
