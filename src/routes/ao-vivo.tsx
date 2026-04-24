import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Users, Eye, Gavel, Volume2 } from "lucide-react";
import { events, lots, formatBRL } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/auctions/countdown";
import { StatusBadge } from "@/components/auctions/status-badge";

export const Route = createFileRoute("/ao-vivo")({
  head: () => ({
    meta: [
      { title: "Ao Vivo — Premium Agro Leilões" },
      { name: "description", content: "Assista aos leilões agropecuários ao vivo com lances em tempo real." },
      { property: "og:title", content: "Leilão ao Vivo" },
      { property: "og:description", content: "Transmissão em tempo real com lances instantâneos." },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const liveEvent = events.find((e) => e.status === "live");
  const liveLot = lots.find((l) => l.status === "live");

  if (!liveEvent || !liveLot) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Nenhuma transmissão ao vivo no momento</h1>
        <p className="mt-2 text-muted-foreground">Confira o calendário de próximos eventos.</p>
        <Link to="/eventos" className="mt-6 inline-block">
          <Button className="bg-gold-gradient text-emerald-deep">Ver eventos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <StatusBadge status="live" />
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{liveEvent.name}</h1>
          <p className="text-sm text-muted-foreground">Leiloeiro: {liveEvent.auctioneer} · {liveEvent.promoter}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4 text-gold" /> {liveEvent.viewers.toLocaleString("pt-BR")} assistindo</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Gavel className="h-4 w-4 text-gold" /> {liveEvent.bidsCount} lances</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Player + Lote em destaque */}
        <div className="space-y-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-gold/30 bg-emerald-deep shadow-elegant">
            <img src={liveLot.cover} alt={liveLot.name} className="h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-emerald-deep via-emerald-deep/40 to-transparent text-center">
              <Radio className="h-12 w-12 text-gold animate-pulse-live" />
              <p className="mt-3 text-sm font-bold uppercase tracking-wider text-gold">Transmissão ao vivo</p>
              <p className="text-white/80 text-xs">Player de vídeo HD será exibido aqui</p>
            </div>
            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur">
              <Volume2 className="h-4 w-4" />
            </div>
          </div>

          {/* Lote em destaque */}
          <div className="rounded-2xl border border-gold/30 bg-card p-6 shadow-gold">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold">Lote em destaque</span>
                <h2 className="mt-1 text-2xl font-bold">#{String(liveLot.number).padStart(2, "0")} — {liveLot.name}</h2>
                <p className="text-sm text-muted-foreground">{liveLot.breed} · {liveLot.category}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Encerra em</div>
                <Countdown endsAt={liveLot.endsAt} className="font-mono text-2xl font-bold text-live" />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-secondary p-5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lance atual</div>
              <div className="text-4xl font-bold text-gradient-gold">{formatBRL(liveLot.currentBid)}</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[1, 5, 10].map((mult) => (
                  <Button key={mult} variant="outline" className="border-gold/30 hover:bg-gold/10">
                    +{formatBRL(liveLot.minIncrement * mult)}
                  </Button>
                ))}
              </div>
              <Button className="mt-3 w-full bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold" size="lg">
                Dar lance de {formatBRL(liveLot.currentBid + liveLot.minIncrement)}
              </Button>
            </div>
          </div>
        </div>

        {/* Chat / Histórico de lances */}
        <aside className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="font-semibold">Histórico de lances</h3>
            <p className="text-xs text-muted-foreground">Atualização em tempo real</p>
          </div>
          <ul className="max-h-[600px] overflow-auto p-4 text-sm">
            {Array.from({ length: 12 }).map((_, i) => {
              const value = liveLot.currentBid - i * liveLot.minIncrement;
              return (
                <li key={i} className={`flex items-center justify-between rounded-lg p-3 ${i === 0 ? "bg-gold/10 ring-1 ring-gold/30 animate-bid-flash" : "border-b border-border/40"}`}>
                  <div>
                    <div className="font-semibold">Comprador #{1284 - i}</div>
                    <div className="text-xs text-muted-foreground">há {i === 0 ? "agora" : `${i * 12}s`}</div>
                  </div>
                  <div className={`font-mono font-bold ${i === 0 ? "text-gold" : "text-foreground"}`}>{formatBRL(value)}</div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
