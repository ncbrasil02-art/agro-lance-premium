 import * as React from "react"
 import useEmblaCarousel from "embla-carousel-react"
 import { ChevronLeft, ChevronRight, Calendar, MapPin, Users } from "lucide-react"
 import { Button } from "@/components/ui/button"
 import { EventCard } from "@/components/auctions/event-card"

 export function EventCarousel({ events, title, subtitle }: { events: any[], title: string, subtitle: string }) {
   const [emblaRef, emblaApi] = useEmblaCarousel({ 
     align: "start",
     loop: events.length > 3,
     slidesToScroll: 1,
     breakpoints: {
       "(min-width: 768px)": { slidesToScroll: 2 },
       "(min-width: 1024px)": { slidesToScroll: 3 }
     }
   })

   const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
   const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

   if (!events || events.length === 0) return null

   return (
     <section className="container mx-auto px-4 py-16">
       <div className="mb-10 flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
           <p className="mt-2 text-muted-foreground">{subtitle}</p>
         </div>
         {events.length > 3 && (
           <div className="flex gap-2">
             <Button 
               variant="outline" 
               size="icon" 
               onClick={scrollPrev}
               className="rounded-full border-gold/30 hover:bg-gold/10 text-gold"
             >
               <ChevronLeft className="h-4 w-4" />
             </Button>
             <Button 
               variant="outline" 
               size="icon" 
               onClick={scrollNext}
               className="rounded-full border-gold/30 hover:bg-gold/10 text-gold"
             >
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
         )}
       </div>

       <div className="overflow-hidden" ref={emblaRef}>
         <div className="flex -ml-6">
           {events.map((event) => (
             <div key={event.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-6">
               <EventCard event={event} />
             </div>
           ))}
         </div>
       </div>
     </section>
   )
 }