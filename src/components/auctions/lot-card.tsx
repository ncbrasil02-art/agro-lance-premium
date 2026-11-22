import { Link, useRouter } from "@tanstack/react-router";
import { Gavel, ArrowRight, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatBRL } from "@/utils/format";
import { useEffectiveLotStatus } from "@/utils/auction-status";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { Countdown } from "./countdown";
import { OfferDialog } from "./OfferDialog";

export function LotCard({ lot, settings: propSettings }: { lot: any; settings?: any }) {
  if (!lot) return null;
  return <AnimalLotCard lot={lot} settings={propSettings} />;
}
function AnimalLotCard({ lot, settings: propSettings }: { lot: any; settings?: any }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);
  const router = useRouter();
  const context = router.state.matches.find(m => m.id === "__root__")?.context as any;
  const settings = propSettings || context?.lot_card_settings;
  const photos: string[] = Array.isArray(lot.photos) && lot.photos.length ? lot.photos : [lot.cover || ""];
  const status = useEffectiveLotStatus({ status: lot.status, event_status: lot.eventStatus, event_type: lot.eventType, event_start_date: lot.eventStartDate, event_end_date: lot.eventEndDate, allows_pre_bidding: lot.allowsPreBidding });
  const open = ["live", "active", "recebendo_lances", "pre_lance"].includes(status);
  const fields = Array.isArray(settings?.displayed_fields) ? settings.displayed_fields.filter((f: any) => f.enabled) : [{ key: "breed", label: "Raça" }, { key: "sex", label: "Sexo" }, { key: "father", label: "Pai" }, { key: "mother", label: "Mãe" }, { key: "seller", label: "Criador" }];
  return <article className="catalog-card flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
    <div className="relative aspect-video overflow-hidden bg-muted">
      <Link className="absolute inset-0 block" to="/lotes/$lotId" params={{ lotId: lot.id }} aria-label={`Ver ficha de ${lot.name}`}><OptimizedImage src={photos[photoIndex] || ""} alt={`${lot.name}, ${lot.breed || "animal"}, lote ${lot.number}`} width={800} className="h-full w-full" /></Link>
      <div className="absolute left-3 top-3"><StatusBadge status={status} /></div>
      <span className="absolute right-3 bottom-3 rounded bg-background/95 px-2 py-1 text-xs font-semibold text-foreground">Lote {String(lot.number || 0).padStart(2, "0")}</span>
      {photos.length > 1 && <div className="absolute inset-x-3 top-1/2 flex justify-between"><Button size="icon" variant="secondary" aria-label={`Foto anterior de ${lot.name}`} onClick={() => setPhotoIndex(p => (p + photos.length - 1) % photos.length)}><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="secondary" aria-label={`Próxima foto de ${lot.name}`} onClick={() => setPhotoIndex(p => (p + 1) % photos.length)}><ChevronRight className="h-4 w-4" /></Button></div>}
    </div>
    <div className="flex flex-1 flex-col p-5">
      <Link to="/lotes/$lotId" params={{ lotId: lot.id }}><h3 className="min-h-14 line-clamp-2 text-xl font-semibold leading-snug text-foreground">{lot.name || "Animal em leilão"}</h3></Link>
      <dl className="my-4 grid gap-2 text-sm">{fields.map((f: any) => { let value = lot[f.key]; if (f.key === "sex") value = value === "M" ? "Macho" : value === "F" ? "Fêmea" : value; if (f.key === "vaccination_records") value = Array.isArray(value) ? `${value.length} registros` : "Consultar ficha"; return <div key={f.key} className="flex min-w-0 justify-between gap-3"><dt className="shrink-0 text-muted-foreground">{f.label}</dt><dd className="truncate text-right text-foreground">{typeof value === "string" || typeof value === "number" ? value : "Não informado"}</dd></div>; })}</dl>
      <div className="mt-auto border-t border-border pt-4"><p className="text-xs text-muted-foreground">{lot.bidsCount ? "Lance atual" : "Lance inicial"}</p><p className="mt-1 text-2xl font-bold text-foreground">{formatBRL(lot.currentBid || 0)}</p><p className="mt-2 text-xs text-muted-foreground">Incremento mínimo: {formatBRL(lot.minIncrement || 0)}</p>
        {open && <div className="mt-2 text-xs text-muted-foreground">Encerra em <Countdown endsAt={lot.endsAt || lot.eventEndDate || ""} /></div>}
        <Button asChild variant={open ? "default" : "outline"} className="mt-4 h-11 w-full"><Link to="/lotes/$lotId" params={{ lotId: lot.id }}><Gavel className="h-4 w-4" />{open ? "Ver lote" : "Ver ficha"}<ArrowRight className="ml-auto h-4 w-4" /></Link></Button>
        {lot.acceptsOffers && !open && !["sold", "passed", "finished"].includes(status) && <Button variant="ghost" className="mt-2 w-full" onClick={() => setOfferOpen(true)}><MessageSquare className="mr-2 h-4 w-4" />Enviar oferta</Button>}
      </div>
    </div>
    <OfferDialog isOpen={offerOpen} onOpenChange={setOfferOpen} item={{ id: lot.id, name: lot.name, price: lot.currentBid, type: "lot" }} />
  </article>;
}
