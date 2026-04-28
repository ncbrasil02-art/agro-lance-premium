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

 export function ArticleCarousel({ articles }: { articles: Article[] }) {
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

   return (
     <section className="bg-emerald-deep/20 py-16 border-t border-gold/10 overflow-hidden">
       <div className="container mx-auto px-4">
         <div className="mb-10 flex items-center justify-between">
           <div>
             <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
               Blog & <span className="text-gradient-gold uppercase italic">Notícias</span>
             </h2>
             <p className="mt-2 text-muted-foreground">Fique por dentro das principais novidades do mercado agropecuário.</p>
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
                 <div className="group h-full flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-white/10">
                   <div className="relative aspect-[16/9] overflow-hidden">
                     <OptimizedImage
                       src={article.featured_image || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"}
                       alt={article.title}
                       className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                     />
                     {article.category?.name && (
                       <div className="absolute left-4 top-4 rounded-full bg-gold/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-deep">
                         {article.category.name}
                       </div>
                     )}
                   </div>
                   
                   <div className="flex flex-1 flex-col p-6">
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
                     
                     <h3 className="mb-2 text-xl font-bold text-white line-clamp-2 leading-tight group-hover:text-gold transition-colors">
                       {article.title}
                     </h3>
                     
                     <p className="mb-6 text-sm text-muted-foreground line-clamp-3">
                       {article.excerpt}
                     </p>
                     
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