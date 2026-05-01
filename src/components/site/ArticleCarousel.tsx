 import * as React from "react"
 import useEmblaCarousel from "embla-carousel-react"
 import { ArrowRight, ChevronLeft, ChevronRight, MessageSquare, Calendar } from "lucide-react"
 import { Button } from "@/components/ui/button"
 import { OptimizedImage } from "@/components/ui/optimized-image"
 import { Link } from "@tanstack/react-router"
 import { cn } from "@/lib/utils"
 import { format } from "date-fns"
 import { ptBR } from "date-fns/locale"

 interface Article {
   id: string
   title: string
   slug: string
   excerpt: string | null
   featured_image: string | null
   published_at: string | null
   category?: { name: string | null } | null
 }

   import { ArticleSettings } from "@/hooks/useSiteSettings";

   export function ArticleCarousel({ 
     articles, 
     variant = 'model1',
     settings 
   }: { 
     articles: Article[], 
     variant?: string,
     settings?: ArticleSettings | null
   }) {
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

   if (!articles || articles.length === 0) return null

     const isModern = (settings?.card_style === 'modern') || (!settings?.card_style && variant === 'model2');
     const isTraditional = (settings?.card_style === 'traditional') || (!settings?.card_style && variant === 'model3');
     const isGlass = settings?.card_style === 'glass';
     const isMinimal = settings?.card_style === 'minimal';

    return (
      <section className={cn(
        "py-16 overflow-hidden",
        variant === 'model1' ? "bg-emerald-deep/20 border-t border-gold/10" : 
        isModern ? "bg-background" : "bg-muted/30"
      )}>
       <div className="container mx-auto px-4">
         <div className="mb-10 flex items-center justify-between">
           <div>
              <h2 className={cn(
                "text-3xl font-bold tracking-tight md:text-4xl",
                variant === 'model1' ? "text-white" : "text-foreground"
              )}>
                {isModern ? "O que há de novo no " : "Blog & "} 
                <span className="text-gradient-gold uppercase italic">{isModern ? "Mercado" : "Notícias"}</span>
             </h2>
              <p className="mt-2 text-muted-foreground">
                {isModern ? "Informação estratégica para investidores de elite." : "Fique por dentro das principais novidades do mercado agropecuário."}
              </p>
           </div>
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
         </div>

         <div className="overflow-hidden" ref={emblaRef}>
           <div className="flex -ml-4">
             {articles.map((article) => (
               <div key={article.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-4">
                   <div className={cn(
                     "group h-full flex flex-col overflow-hidden transition-all",
                     isGlass ? "rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-gold/30 hover:bg-white/10" :
                     isModern ? "rounded-none border-b border-border bg-transparent hover:bg-muted/50 shadow-none" :
                     isTraditional ? "rounded-none border-l-4 border-gold bg-emerald-deep shadow-2xl" :
                     isMinimal ? "rounded-lg border-none bg-transparent hover:bg-muted/30" :
                     variant === 'model1' ? "rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-gold/30 hover:bg-white/10" :
                     "rounded-3xl border border-border bg-card shadow-sm hover:shadow-xl"
                   )}>
                    <div className={cn(
                      "relative overflow-hidden",
                      settings?.image_aspect_ratio === '4/3' ? "aspect-[4/3]" :
                      settings?.image_aspect_ratio === '1/1' ? "aspect-square" :
                      "aspect-[16/9]"
                    )}>
                     <OptimizedImage
                       src={article.featured_image || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"}
                       alt={article.title}
                       className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                     />
                      {article.category?.name && settings?.show_category !== false && (
                       <div className="absolute left-4 top-4 rounded-full bg-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-deep">
                         {article.category.name}
                       </div>
                     )}
                   </div>
                   
                    <div className={cn("flex flex-1 flex-col p-6", isModern && "px-0", isTraditional && "text-white")}>
                      {settings?.show_date !== false && (
                        <div className="mb-3 flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gold" />
                             {(() => {
                               if (!article.published_at) return "--";
                               try {
                                 const d = new Date(article.published_at);
                                 if (isNaN(d.getTime())) return "--";
                                 return format(d, "dd 'de' MMMM", { locale: ptBR });
                               } catch (e) {
                                 return "--";
                               }
                             })()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-gold" />
                            Blog Elite
                          </div>
                        </div>
                      )}
                     
                     <h3 className="mb-2 text-xl font-bold text-white line-clamp-2 leading-tight group-hover:text-gold transition-colors">
                       {article.title}
                     </h3>
                     
                      {settings?.show_excerpt !== false && (
                        <p className="mb-6 text-sm text-muted-foreground line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}
                     
                     <div className="mt-auto flex items-center justify-between">
                       <Link
                         to="/noticias/$slug"
                         params={{ slug: article.slug }}
                         className="inline-flex items-center gap-2 text-sm font-bold text-gold hover:text-gold-bright transition-colors"
                       >
                         Ler artigo completo
                         <ArrowRight className="h-4 w-4" />
                       </Link>
                       
                       <Button size="sm" variant="ghost" className="text-white/40 hover:text-gold h-8 px-2">
                         <MessageSquare className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </div>

         <div className="mt-12 text-center">
            <div className="inline-flex flex-col md:flex-row items-center gap-4 p-6 rounded-2xl bg-gold/5 border border-gold/20 backdrop-blur-md">
                 <p className="text-sm text-white/80">Quer destacar seu criatório ou leilão com uma matéria exclusiva?</p>
                 <div className="flex gap-3">
                     <Link to="/sobre">
                         <Button size="sm" className="bg-gold text-emerald-deep hover:bg-gold-bright font-bold">
                             Entrar em contato
                         </Button>
                     </Link>
                    <Link to="/painel">
                        <Button size="sm" variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 font-bold">
                            Criar meu evento
                        </Button>
                    </Link>
                </div>
            </div>
         </div>
       </div>
     </section>
   )
 }