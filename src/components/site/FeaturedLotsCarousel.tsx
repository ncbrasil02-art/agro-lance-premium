 import * as React from "react"
 import { Link } from "@tanstack/react-router"
 import useEmblaCarousel from "embla-carousel-react"
 import { ChevronLeft, ChevronRight, Star } from "lucide-react"
 import { Button } from "@/components/ui/button"
 import { LotCard } from "@/components/auctions/lot-card"
 import { cn } from "@/lib/utils"

  export function FeaturedLotsCarousel({ lots, variant = 'model1' }: { lots: any[], variant?: string }) {
   const [emblaRef, emblaApi] = useEmblaCarousel({ 
     align: "start",
     loop: true,
     slidesToScroll: 1,
     breakpoints: {
       "(min-width: 768px)": { slidesToScroll: 2 },
       "(min-width: 1024px)": { slidesToScroll: 3 }
     }
   })

   const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
   const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

   if (!lots || lots.length === 0) return null

    const isModern = variant === 'model2';
    const isTraditional = variant === 'model3';

    return (
      <section className={cn(
        "py-16 relative",
        isModern ? "bg-black text-white" : "container mx-auto px-4"
      )}>
        {isModern && <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80')] bg-cover bg-fixed" />}
        <div className={cn("relative z-10", isModern && "container mx-auto px-4")}>
       <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
             <Star className="h-3 w-3 fill-gold" />
              Oportunidades de Leilão
           </div>
            <h2 className="text-4xl font-black text-foreground uppercase italic tracking-tighter md:text-5xl">
              Lotes em <span className="text-gradient-gold">Destaque</span>
           </h2>
            <p className="mt-3 text-muted-foreground max-w-xl text-lg font-medium">Animais e embriões de linhagem superior com alto potencial genético para o seu plantel.</p>
         </div>
          <div className="flex items-center gap-3">
            <Link to="/lotes" className="mr-4 text-xs font-black uppercase italic tracking-widest text-gold hover:underline">Ver tudo</Link>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={scrollPrev}
                className="rounded-full border-gold/30 hover:bg-gold/10 text-gold h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={scrollNext}
                className="rounded-full border-gold/30 hover:bg-gold/10 text-gold h-10 w-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

       <div className="overflow-hidden p-2 -m-2" ref={emblaRef}>
         <div className="flex -ml-6">
           {lots.map((lot) => (
             <div key={lot.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-6">
               <div className="transition-transform duration-300 hover:-translate-y-2">
                 <LotCard lot={lot} />
               </div>
             </div>
           ))}
         </div>
       </div>
     </section>
   )
 }