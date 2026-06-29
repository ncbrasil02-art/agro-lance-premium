 import * as React from "react"
 import useEmblaCarousel from "embla-carousel-react"
 import { ChevronLeft, ChevronRight, Calendar, MapPin, Users } from "lucide-react"
 import { Button } from "@/components/ui/button"
 import { EventCard } from "@/components/auctions/event-card"
import { cn } from "@/lib/utils"

  export function EventCarousel({ events, title, subtitle, variant = 'model1' }: { events: any[], title: string, subtitle: string, variant?: string }) {
   const [emblaRef, emblaApi] = useEmblaCarousel({ 
     align: "start",
     loop: events.length > 1,
     slidesToScroll: 1,
   })

   const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
   const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

   if (!events || events.length === 0) return null

    const isModern = variant === 'model2';

    return (
      <section className={cn(
        "py-16",
        variant === 'model3' ? "bg-emerald-deep text-white" : "container mx-auto px-4"
      )}>
        <div className={cn("mb-10 flex items-center justify-between", variant === 'model3' && "container mx-auto px-4")}>
         <div>
            <h2 className={cn(
              "text-3xl font-bold tracking-tight md:text-4xl",
              variant === 'model3' && "text-white"
            )}>{title}</h2>
            <p className={cn(
              "mt-2 text-muted-foreground",
              variant === 'model3' && "text-white/60"
            )}>{subtitle}</p>
         </div>
         {events.length > 1 && (
           <div className="flex gap-2">
             <Button 
               variant="outline" 
               size="icon" 
               onClick={scrollPrev}
                className="rounded-full border-gold/30 hover:bg-gold/10 text-gold lg:hidden"
             >
               <ChevronLeft className="h-4 w-4" />
             </Button>
             <Button 
               variant="outline" 
               size="icon" 
               onClick={scrollNext}
                className="rounded-full border-gold/30 hover:bg-gold/10 text-gold lg:hidden"
             >
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
         )}
       </div>

        {/* Desktop: full grid, 3 columns; Mobile/Tablet: carousel */}
        <div className={cn("hidden lg:grid gap-6 grid-cols-3", variant === 'model3' && "container mx-auto px-4")}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        <div className={cn("lg:hidden overflow-hidden", variant === 'model3' && "container mx-auto px-4")} ref={emblaRef}>
         <div className="flex -ml-6">
           {events.map((event) => (
             <div key={event.id} className="flex-[0_0_100%] md:flex-[0_0_50%] pl-6">
               <EventCard event={event} />
             </div>
           ))}
         </div>
       </div>
     </section>
   )
 }