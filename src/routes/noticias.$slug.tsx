  import { createFileRoute, Link } from "@tanstack/react-router"
  import { generateMetaTags } from "@/utils/seo"
 import { supabase } from "@/integrations/supabase/client"
 import { OptimizedImage } from "@/components/ui/optimized-image"
 import { format } from "date-fns"
 import { ptBR } from "date-fns/locale"
  import { Calendar, ChevronLeft, Share2, Mail, User, Clock } from "lucide-react"
 import { Button } from "@/components/ui/button"

  export const Route = createFileRoute("/noticias/$slug")({
    head: (ctx: any) => {
      const post = ctx.loaderData?.post;
      const rootData = ctx.matches.find((m: any) => m.id === '__root__')?.loaderData as any;
      const seoSettings = rootData?.seoSettings;
      
      return generateMetaTags({
        title: post?.seo_title || post?.title,
        description: post?.seo_description || post?.excerpt,
        image: post?.featured_image,
        type: 'article',
        seoSettings,
        canonical: `/noticias/${post?.slug}`,
        ogTitle: post?.og_title,
        ogDescription: post?.og_description,
        ogImage: post?.og_image_url
      });
    },
    loader: async ({ params }: { params: any }) => {
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
    const { post } = Route.useLoaderData() as any

   if (!post) return <div className="container py-20 text-center">Post não encontrado</div>
 
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
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {post.published_at && format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {post.author_name}
                </div>
              )}
              {post.read_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.read_time} de leitura
                </div>
              )}
            </div>
           <div className="ml-auto flex gap-4">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Share2 className="h-4 w-4" /></Button>
           </div>
         </div>
       </div>

       <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-12">
         <OptimizedImage 
           src={post.featured_image || ""} 
           alt={post.title || ""}
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