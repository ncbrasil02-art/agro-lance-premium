import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Eye, Gavel, Heart, Share2, Award } from "lucide-react";
import { lots, events, formatBRL } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/auctions/status-badge";
import { Countdown } from "@/components/auctions/countdown";

export const Route = createFileRoute("/lotes/$lotId")({
  loader: ({ params }) => {
    const lot = lots.find((l) => l.id === params.lotId);
    if (!lot) throw notFound();
    const event = events.find((e) => e.id === lot.eventId);
    return { lot, event };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `Lote ${loaderData.lot.number} — ${loaderData.lot.name} — Premium Agro` },
      { name: "description", content: `${loaderData.lot.name}, ${loaderData.lot.breed}. Lance atual ${formatBRL(loaderData.lot.currentBid)}.` },
      { property: "og:title", content: `${loaderData.lot.name} — Lote ${loaderData.lot.number}` },
      { property: "og:description", content: `${loaderData.lot.breed} · ${loaderData.lot.category}` },
      { property: "og:image", content: loaderData.lot.cover },
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
  const { lot, event } = Route.useLoaderData();

  return (
    <div className="container mx-auto px-4 py-8">
      {event && (
        <Link to="/eventos/$eventSlug" params={{ eventSlug: event.slug }} className="text-sm text-muted-foreground hover:text-gold">
          ← {event.name}
        </Link>
      )}

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Galeria */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted">
            <img src={lot.cover} alt={lot.name} className="h-full w-full object-cover" />
            <div className="absolute left-4 top-4 flex gap-2">
              <StatusBadge status={lot.status} />
              <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-bold backdrop-blur">LOTE {String(lot.number).padStart(2, "0")}</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[lot.cover, lot.cover, lot.cover, lot.cover].map((src, i) => (
              <button key={i} className="aspect-square overflow-hidden rounded-lg border border-border opacity-70 transition hover:opacity-100">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info + Lance */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{lot.name}</h1>
            <p className="mt-1 text-muted-foreground">{lot.breed} · {lot.category}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {lot.viewers} acompanhando</span>
              <span className="flex items-center gap-1"><Gavel className="h-3.5 w-3.5" /> {lot.bidsCount} lances</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gold/30 bg-card p-6 shadow-gold">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lance atual</div>
                <div className="text-4xl font-bold text-gradient-gold">{formatBRL(lot.currentBid)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Encerra em</div>
                <Countdown endsAt={lot.endsAt} className="font-mono text-xl font-bold text-foreground" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[1, 5, 10].map((m) => (
                <Button key={m} variant="outline" className="border-gold/30 hover:bg-gold/10">
                  +{formatBRL(lot.minIncrement * m)}
                </Button>
              ))}
            </div>
            <Button size="lg" className="mt-3 w-full bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold">
              Dar lance de {formatBRL(lot.currentBid + lot.minIncrement)}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Incremento mínimo: {formatBRL(lot.minIncrement)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1"><Heart className="mr-2 h-4 w-4" /> Acompanhar</Button>
            <Button variant="outline" className="flex-1"><Share2 className="mr-2 h-4 w-4" /> Compartilhar</Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Pagamento</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• À vista no PIX (5% desconto)</li>
              <li>• Entrada de 30% + 20 parcelas mensais</li>
              <li>• Boleto ou transferência bancária</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 font-semibold"><Award className="h-4 w-4 text-gold" /> Genealogia & saúde</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Pai</dt>
                <dd className="font-medium">Imperador do Sul</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Mãe</dt>
                <dd className="font-medium">Princesa Real</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Vacinação</dt>
                <dd className="font-medium text-emerald-bright">Em dia</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Exames</dt>
                <dd className="font-medium text-emerald-bright">Aprovado</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
