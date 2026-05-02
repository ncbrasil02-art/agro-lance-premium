 import { createFileRoute, Link } from "@tanstack/react-router"
 import { supabase } from "@/integrations/supabase/client"
 import { OptimizedImage } from "@/components/ui/optimized-image"
 import { format } from "date-fns"
 import { ptBR } from "date-fns/locale"
  import { Calendar, ArrowRight } from "lucide-react"
  import { generateMetaTags } from "@/utils/seo"
  import { NewsPageSkeleton } from "@/components/ui/page-skeleton"

   export const Route = createFileRoute("/noticias/")({
     pendingComponent: NewsPageSkeleton,
    head: ({ matches }) => {
      const rootData = matches.find(m => m.id === '__root__')?.loaderData as any;
      const seoSettings = rootData?.seoSettings;
      return generateMetaTags({
        title: "Notícias",
        description: "Acompanhe as últimas notícias, tendências e informações do mercado agropecuário brasileiro.",
        seoSettings,
        canonical: "/noticias"
      });
    },
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