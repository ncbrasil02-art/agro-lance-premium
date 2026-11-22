import { Link } from "@tanstack/react-router";
import { catalogEventCover } from "./catalog-media";
import { Calendar, MapPin, Gavel, ArrowRight, Expand } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useEffectiveEventStatus } from "@/utils/auction-status";
import { StatusBadge } from "./status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function EventCard({ event }: { event: any }) {
  if (!event) return null;
  return <AuctionEventCard event={event} />;
}
function AuctionEventCard({ event }: { event: any }) {
  const [open, setOpen] = useState(false);
  const status = useEffectiveEventStatus({ status: event.status, start_date: event.date, end_date: event.end_date });
  const bidding = ["live", "recebendo_lances"].includes(status);
  return <article className="catalog-card flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
    <div className="relative aspect-video overflow-hidden bg-muted">
      <Link className="absolute inset-0 block" to="/eventos/$eventSlug" params={{ eventSlug: event.slug }} aria-label={`Ver lotes de ${event.name}`}><OptimizedImage src={catalogEventCover(event.slug || "", event.cover || "")} alt={`Imagem do leilão ${event.name}`} width={800} className="h-full w-full" /></Link>
      <div className="absolute left-3 top-3"><StatusBadge status={status} /></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="secondary" size="icon" className="absolute bottom-3 right-3" aria-label={`Ampliar imagem de ${event.name}`}><Expand className="h-4 w-4" /></Button></DialogTrigger><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{event.name}</DialogTitle></DialogHeader><OptimizedImage src={catalogEventCover(event.slug || "", event.cover || "")} alt={event.name} width={1200} className="max-h-[70vh] w-full object-contain" /></DialogContent></Dialog>
    </div>
    <div className="flex flex-1 flex-col p-5"><h3 className="min-h-14 line-clamp-2 text-xl font-semibold leading-snug">{event.name}</h3><p className="mt-2 min-h-10 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{event.description || "Consulte o catálogo de animais e as condições deste leilão."}</p>
      <div className="my-4 grid gap-2 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0" />{event.date ? new Date(event.date).toLocaleDateString("pt-BR") : "Data a confirmar"}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />{event.city || "Brasil"}{event.state ? ` / ${event.state}` : ""}</p><p className="flex items-center gap-2"><Gavel className="h-4 w-4 shrink-0" />{event.lotsCount || 0} animais em catálogo</p></div>
      <Button asChild variant={bidding ? "default" : "outline"} className="mt-auto h-11 w-full"><Link to="/eventos/$eventSlug" params={{ eventSlug: event.slug }}>{bidding ? "Ver lotes" : "Ver leilão"}<ArrowRight className="ml-auto h-4 w-4" /></Link></Button>
    </div>
  </article>;
}
