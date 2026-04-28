 import { createFileRoute, Link } from "@tanstack/react-router"
 import { supabase } from "@/integrations/supabase/client"
 import { OptimizedImage } from "@/components/ui/optimized-image"
 import { format } from "date-fns"
 import { ptBR } from "date-fns/locale"
 import { Calendar, ArrowRight } from "lucide-react"

 export const Route = createFileRoute("/noticias")({
   loader: async () => {
     const { data: posts } = await supabase
       .from("posts")
       .select("*, category:categories(name)")
       .eq("status", "published")
       .order("published_at", { ascending: false })
     return { posts: posts || [] }
   },
   component: NewsIndex,
 })

 function NewsIndex() {
   const { posts } = Route.useLoaderData()

   return (
     <div className="container mx-auto px-4 py-20">
       <h1 className="text-4xl font-bold mb-4">Blog & Notícias</h1>
       <p className="text-muted-foreground mb-12 max-w-2xl">
         Acompanhe as últimas notícias, tendências e informações do mercado agropecuário brasileiro.
       </p>
       
       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
         {posts.map((post: any) => (
           <div key={post.id} className="group overflow-hidden rounded-2xl border bg-card">
             <div className="aspect-video overflow-hidden">
               <OptimizedImage
                 src={post.featured_image || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"}
                 alt={post.title}
                 className="h-full w-full object-cover transition-transform group-hover:scale-105"
               />
             </div>
             <div className="p-6">
               <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                 <Calendar className="h-3.5 w-3.5" />
                 {format(new Date(post.published_at), "dd/MM/yyyy", { locale: ptBR })}
                 <span className="text-gold font-bold ml-auto">{post.category?.name}</span>
               </div>
               <h2 className="text-xl font-bold mb-3 line-clamp-2">{post.title}</h2>
               <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{post.excerpt}</p>
               <Link 
                 to="/noticias/$slug" 
                 params={{ slug: post.slug }}
                 className="inline-flex items-center gap-2 text-gold font-bold hover:underline"
               >
                 Ler mais <ArrowRight className="h-4 w-4" />
               </Link>
             </div>
           </div>
         ))}
       </div>
     </div>
   )
 }

 *** Add File: src/routes/noticias.$slug.tsx
 import { createFileRoute, Link } from "@tanstack/react-router"
 import { supabase } from "@/integrations/supabase/client"
 import { OptimizedImage } from "@/components/ui/optimized-image"
 import { format } from "date-fns"
 import { ptBR } from "date-fns/locale"
 import { Calendar, ChevronLeft, Share2, Mail, MessageSquare } from "lucide-react"
 import { Button } from "@/components/ui/button"

 export const Route = createFileRoute("/noticias/$slug")({
   loader: async ({ params }) => {
     const { data: post } = await supabase
       .from("posts")
       .select("*, category:categories(name)")
       .eq("slug", params.slug)
       .single()
     return { post }
   },
   component: NewsDetail,
 })

 function NewsDetail() {
   const { post } = Route.useLoaderData()

   if (!post) return <div>Post não encontrado</div>

   return (
     <article className="container mx-auto px-4 py-20 max-w-4xl">
       <Link to="/noticias" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold mb-8">
         <ChevronLeft className="h-4 w-4" /> Voltar para o blog
       </Link>

       <div className="mb-8">
         <div className="flex items-center gap-3 text-gold font-bold mb-4 uppercase tracking-widest text-xs">
           {post.category?.name}
         </div>
         <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{post.title}</h1>
         
         <div className="flex items-center gap-6 text-sm text-muted-foreground border-y py-4">
           <div className="flex items-center gap-2">
             <Calendar className="h-4 w-4" />
             {format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
           </div>
           <div className="ml-auto flex gap-4">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Share2 className="h-4 w-4" /></Button>
           </div>
         </div>
       </div>

       <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-12">
         <OptimizedImage 
           src={post.featured_image} 
           alt={post.title}
           className="h-full w-full object-cover"
         />
       </div>

       <div className="prose prose-invert prose-gold max-w-none mb-16 whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
         {post.content}
       </div>

       <div className="bg-card border rounded-3xl p-10 md:p-16 text-center">
         <h3 className="text-2xl font-bold mb-4">Gostou desta matéria?</h3>
         <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
           Queremos ouvir sua história ou ajudar você a organizar o seu próximo grande evento.
         </p>
         <div className="flex flex-wrap justify-center gap-4">
           <Link to="/sobre">
             <Button size="lg" className="bg-gold text-emerald-deep hover:bg-gold-bright gap-2">
               <Mail className="h-4 w-4" /> Entrar em contato
             </Button>
           </Link>
           <Link to="/painel">
             <Button size="lg" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 gap-2">
               <Calendar className="h-4 w-4" /> Criar um Evento
             </Button>
           </Link>
         </div>
       </div>
     </article>
   )
 }