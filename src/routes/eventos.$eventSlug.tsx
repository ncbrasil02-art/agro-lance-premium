import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { generateMetaTags } from "@/utils/seo";
import { EventDetailSkeleton } from "@/components/ui/page-skeleton";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { Calendar, MapPin, Gavel, Users, Trophy, Zap, RefreshCw, Maximize2, Image as ImageIcon, FileText } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
 import { useRealtimeEvent } from "@/hooks/useRealtimeEvent";
import { Countdown } from "@/components/auctions/countdown";
import { supabase } from "@/integrations/supabase/client";
import { eventSchema } from "@/lib/schemas";
import { LotCard } from "@/components/auctions/lot-card";
 import { StatusBadge } from "@/components/auctions/status-badge";
 import { getEffectiveEventStatus } from "@/utils/auction-status";
import { ErrorBoundary } from "@/components/ui/error-fallback";
import { SectionFallback } from "@/components/site/SectionFallback";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { catalogEventCover } from "@/components/auctions/catalog-media";

export const Route = createFileRoute("/eventos/$eventSlug")({
   loader: async ({ params }) => {
     const eventSlug = params.eventSlug;
     const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventSlug);
 
     try {
       let eventData = null;
       if (isUuid) {
         const { data } = await supabase.from("events").select("*").eq("id", eventSlug).maybeSingle();
         eventData = data;
       }
       if (!eventData) {
         const { data } = await supabase.from("events").select("*").eq("slug", eventSlug).maybeSingle();
         eventData = data;
       }
 
        if (!eventData) throw notFound();

        // Fetch seller logo if seller_id is present
        let sellerData = null;
        if (eventData.seller_id) {
          const { data: sData } = await supabase
            .from("sellers_public" as any)
            .select("logo_url, name")
            .eq("id", eventData.seller_id)
            .maybeSingle();
          sellerData = sData;
        }
  
        const { data: lots, error: lotsError } = await supabase
          .from("lots")
          .select("*, animal:animals(*, seller:sellers(name, logo_url))")
          .eq("event_id", eventData.id)
          .order("lot_number", { ascending: true });
  
        if (lotsError) console.error("Erro ao buscar lotes:", lotsError);
  
        const event = { ...eventData, lots: lots || [], seller: sellerData };
       const result = eventSchema.safeParse(event);
       return { event: result.success ? result.data : (event as any) };
      } catch (err: any) {
        console.error("Erro no loader de evento:", err);
        // If it's already a notFound error, rethrow it
        if (err?.status === 404 || err?.name === 'NotFound') throw err;
        // Otherwise rethrow the error to be caught by errorComponent
        throw err;
      }
   },
  head: (ctx: any) => {
    const event = ctx.loaderData?.event;
    const rootData = ctx.matches.find((m: any) => m.id === '__root__')?.loaderData as any;
    const seoSettings = rootData?.seoSettings;
    
    const tags = generateMetaTags({
      title: event?.seo_title || event?.name,
      description: event?.seo_description || event?.description,
      image: event ? catalogEventCover(event.slug || "", event.banner_url || "") : undefined,
      seoSettings,
      canonical: `/eventos/${event?.slug}`,
      ogTitle: event?.og_title,
      ogDescription: event?.og_description,
      ogImage: event?.og_image_url
    });
    // Per-route font: signature script used only on this page.
    // Self-hosted subset (Basic Latin + Latin-1 + Latin Extended-A) emitted
    // by `scripts/subset-fonts.mjs` at build time. Same-origin -> 1 RTT,
    // long-cached via public/_headers, no Google round-trip.

    const eventUrl = `https://plataformaleiloesagro.site/eventos/${event?.slug || ""}`;
    const eventJsonLd = event ? {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.name,
      description: event.description || `Leilão agropecuário ${event.name}`,
      startDate: event.start_date,
      endDate: event.end_date || undefined,
      eventStatus: event.status === "finished" ? "https://schema.org/EventCompleted" : event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
      eventAttendanceMode: event.event_type === "ao_vivo" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OnlineEventAttendanceMode",
      location: event.location ? { "@type": "Place", name: event.location, address: event.location } : { "@type": "VirtualLocation", url: eventUrl },
      image: catalogEventCover(event.slug || "", event.banner_url || "") ? [catalogEventCover(event.slug || "", event.banner_url || "")] : undefined,
      url: eventUrl,
      organizer: { "@type": "Organization", name: event.promoter_company || "Premium Agro Leilões", url: "https://plataformaleiloesagro.site" },
    } : null;
    return {
      ...tags,
      links: [
        ...(tags.links ?? []),

      ],
      scripts: eventJsonLd ? [{ type: "application/ld+json", children: JSON.stringify(eventJsonLd) }] : [],
    };
  },
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Evento não encontrado</h1>
      <Link to="/eventos" className="mt-4 inline-block text-gold hover:underline">Ver todos os eventos</Link>
    </div>
  ),
  component: EventDetail,
  pendingComponent: EventDetailSkeleton,
  errorComponent: ErrorFallback,
});

function EventDetail() {
   const { event } = Route.useLoaderData() as any;
   const effectiveStatus = getEffectiveEventStatus({
     status: event.status,
     start_date: event.start_date,
     end_date: event.end_date
   });
   const router = useRouter();
   const eventLots = Array.isArray(event.lots) ? event.lots : [];
   const [isFlyerOpen, setIsFlyerOpen] = useState(false);
 
   const { status } = useRealtimeEvent(event.id, () => {
     router.invalidate();
   });
 
   const isConnected = status === 'SUBSCRIBED';

  return (
    <div className="auction-surface min-h-screen bg-background pb-20">
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Link to="/eventos" className="text-sm text-muted-foreground hover:text-primary">Leilões / {event.name}</Link>
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="min-w-0">
              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                <OptimizedImage src={catalogEventCover(event.slug, event.banner_url || "")} alt={`Imagem do leilão ${event.name}`} width={1200} priority="high" className="h-full w-full" objectFit="contain" />
              </div>
              <Dialog open={isFlyerOpen} onOpenChange={setIsFlyerOpen}>
                <DialogTrigger asChild><Button variant="outline" className="mt-4 h-11 w-full"><Maximize2 />Ampliar imagem do leilão</Button></DialogTrigger>
                <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>{event.name}</DialogTitle></DialogHeader><OptimizedImage src={catalogEventCover(event.slug, event.banner_url || "")} alt={event.name} width={1600} objectFit="contain" className="max-h-[75vh] w-full" /></DialogContent>
              </Dialog>
              {event.slug?.startsWith("demonstracao-") && <p className="mt-2 text-xs text-muted-foreground">Leilão de demonstração · imagem ilustrativa</p>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3"><StatusBadge status={effectiveStatus} /><span className="text-sm text-muted-foreground">{event.event_type === "ao_vivo" ? "Leilão ao vivo" : "Leilão online"}</span>{!isConnected && <RefreshCw aria-label="Atualizando" className="h-4 w-4 animate-spin text-muted-foreground" />}</div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{event.name}</h1>
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">{event.description || "Consulte os animais e as condições de participação deste leilão."}</p>
              <dl className="my-6 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
                <div><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />Data e horário</dt><dd className="mt-1 font-medium">{new Date(event.start_date).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })}</dd></div>
                <div><dt className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />Local</dt><dd className="mt-1 font-medium">{event.location || "Online"}</dd></div>
                <div><dt className="text-sm text-muted-foreground">Leiloeiro</dt><dd className="mt-1 font-medium">{event.auctioneer_name || "A confirmar"}</dd></div>
                <div><dt className="text-sm text-muted-foreground">Animais em catálogo</dt><dd className="mt-1 font-medium">{eventLots.length} lotes</dd></div>
                {(event.seller?.name || event.seller_name) && <div><dt className="text-sm text-muted-foreground">Vendedor</dt><dd className="mt-1 font-medium">{event.seller?.name || event.seller_name}</dd></div>}
                {event.promoter_company && <div><dt className="text-sm text-muted-foreground">Organização</dt><dd className="mt-1 font-medium">{event.promoter_company}</dd></div>}
              </dl>
              <div className="flex flex-wrap gap-3">
                <Dialog><DialogTrigger asChild><Button variant="outline" className="h-11"><FileText />Regulamento</Button></DialogTrigger><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Regulamento do leilão</DialogTitle></DialogHeader><p className="whitespace-pre-wrap text-sm leading-relaxed">{event.regulation || "O regulamento ainda não foi disponibilizado."}</p></DialogContent></Dialog>
                {["live", "recebendo_lances", "incondicional"].includes(effectiveStatus) && <Button asChild className="h-11"><Link to="/ao-vivo"><Gavel />Acompanhar leilão</Link></Button>}
              </div>
              {new Date(event.start_date).getTime() > Date.now() && <div className="mt-6"><p className="mb-2 text-sm text-muted-foreground">Faltam para o início</p><Countdown endsAt={event.start_date} variant="segmented" /></div>}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section - Only if there are photos */}
       {Array.isArray(event.photos) && event.photos.length > 0 && (
         <ErrorBoundary tag="event-gallery" fallback={<SectionFallback title="Galeria" message="Não foi possível carregar a galeria de fotos." variant="error" />}>
           <section className="container mx-auto px-4 py-16 border-t border-white/5">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-gold/10 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Galeria do Evento</h2>
              <p className="text-muted-foreground font-medium">Registros oficiais e momentos exclusivos.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {event.photos.map((photo: any, index: number) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div className="relative aspect-square rounded-3xl overflow-hidden bg-emerald-deep/20 cursor-pointer group/photo">
                    <OptimizedImage 
                      src={photo} 
                      alt={`Foto ${index + 1} do evento ${event.name}`}
                      width={400}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/photo:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="h-8 w-8 text-white scale-75 group-hover/photo:scale-100 transition-transform" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/90 border-white/10">
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <OptimizedImage 
                      src={photo} 
                      alt={`Foto ${index + 1} da galeria do evento ${event.name}`}
                      width={1600}
                      className="max-w-full max-h-[85vh] object-contain" 
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
           </section>
         </ErrorBoundary>
      )}

      {/* Lots Section */}
      <ErrorBoundary tag="event-lots" fallback={<SectionFallback title="Lotes" message="Não foi possível carregar os lotes deste evento." variant="error" />}>
        <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
             <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Lotes Disponíveis</h2>
            <p className="mt-2 text-muted-foreground font-medium">Exemplares selecionados exclusivamente para este evento.</p>
          </div>
          <div className="h-px flex-1 bg-white/5 hidden md:block mx-8" />
          <div className="text-right">
            <span className="text-lg font-semibold text-muted-foreground tabular-nums">#{eventLots.length}</span>
          </div>
        </div>

        {eventLots.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventLots.map((l: any) => (
              <LotCard 
                key={l.id} 
                lot={{
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
                  endsAt: l.end_date || event.end_date || "",
                  status: l.status as any,
                  eventStatus: event.status,
                  eventStartDate: event.start_date,
                  eventEndDate: event.end_date,
                  allowsPreBidding: event.allows_pre_bidding,
                  father: l.animal?.genealogy?.father,
                  mother: l.animal?.genealogy?.mother,
                  sex: l.animal?.sex,
                  color: l.animal?.color,
                  birthDate: l.animal?.birth_date,
                  seller: l.animal?.seller?.name,
                  location: l.animal?.location,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-[3rem] bg-white/5 border border-dashed border-white/10">
             <Gavel className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
             <p className="text-xl text-muted-foreground font-semibold italic">Lotes em fase de preparação.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Acompanhe nossas redes para saber quando os lotes forem liberados.</p>
          </div>
        )}
        </section>
      </ErrorBoundary>
    </div>
  );
}
