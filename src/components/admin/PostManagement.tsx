 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, PlusCircle, Newspaper, Image as ImageIcon, Eye, Wand2, CheckCircle2, Clock, Sparkles, Maximize2, Minimize2 } from "lucide-react";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SerpPreview } from "./SerpPreview";
import { SeoAnalysis } from "./SeoAnalysis";
import { SocialPreview } from "./SocialPreview";
import { RichResultsPreview } from "./RichResultsPreview";
import { generateSlug, validateSlug } from "@/utils/slug";
 import { toast } from "sonner";
 
 export function PostManagement() {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingPost, setEditingPost] = useState<any>(null);
    const [formData, setFormData] = useState<any>({
      title: "",
      excerpt: "",
      content: "",
      featured_image: "",
      category_id: "",
      status: "draft",
      slug: "",
      seo_title: "",
      seo_description: "",
      og_title: "",
      og_description: "",
      og_image_url: "",
      author_name: "",
      read_time: ""
    });
   const [posts, setPosts] = useState<any[]>([]);
   const [categories, setCategories] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [isAiFixing, setIsAiFixing] = useState(false);
   const [isGenerating, setIsGenerating] = useState(false);
   const [aiPrompt, setAiPrompt] = useState("");
   const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
   const [isFullScreen, setIsFullScreen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
 
   const handleAutoFix = async () => {
     if (!formData.title) {
       toast.error("Preencha ao menos o título para usar a IA");
       return;
     }
     setIsAiFixing(true);
     try {
       const { data, error } = await supabase.functions.invoke('seo-fixer', {
         body: { type: 'Notícia', title: formData.title, content: formData.content || formData.excerpt }
       });
       if (error) throw error;
       setFormData({
         ...formData,
         seo_title: data.seo_title,
         seo_description: data.seo_description,
         og_title: data.og_title,
         og_description: data.og_description
       });
       toast.success("SEO otimizado com IA!");
     } catch (error: any) {
       toast.error("Erro ao otimizar: " + error.message);
     } finally {
       setIsAiFixing(false);
     }
   };

   const handleGenerateAi = async () => {
     if (!aiPrompt) {
       toast.error("Descreva o tema do artigo");
       return;
     }
     setIsGenerating(true);
     try {
       const { data, error } = await supabase.functions.invoke('generate-article', {
         body: { prompt: aiPrompt }
       });
       if (error) throw error;
       
       setFormData({
         ...formData,
         title: data.title,
         excerpt: data.excerpt,
         content: data.content,
         status: 'pending_review'
       });
       
       setIsAiDialogOpen(false);
       setIsDialogOpen(true);
       toast.success("Artigo gerado! Revise e publique.");
     } catch (error: any) {
       toast.error("Erro ao gerar: " + error.message);
     } finally {
       setIsGenerating(false);
     }
   };

   const fetchData = async () => {
     setIsLoading(true);
     try {
       const [postsRes, catsRes] = await Promise.all([
         supabase.from("posts").select("*, category:categories(name)").order("created_at", { ascending: false }),
         supabase.from("categories").select("id, name").order("name")
       ]);
 
       if (postsRes.error) throw postsRes.error;
       if (catsRes.error) throw catsRes.error;
 
       setPosts(postsRes.data || []);
       setCategories(catsRes.data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar dados: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     fetchData();
   }, []);
 
   const resetForm = () => {
     setEditingPost(null);
      setFormData({
        title: "",
        excerpt: "",
        content: "",
        featured_image: "",
        category_id: "",
        status: "draft",
        slug: "",
        seo_title: "",
        seo_description: "",
        og_title: "",
        og_description: "",
        og_image_url: "",
        author_name: "",
        read_time: ""
      });
   };
 
   const handleEdit = (post: any) => {
     setEditingPost(post);
      setFormData({
        title: post.title || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        featured_image: post.featured_image || "",
        category_id: post.category_id || "",
        status: post.status || "draft",
        slug: post.slug || "",
        seo_title: post.seo_title || "",
        seo_description: post.seo_description || "",
        og_title: post.og_title || "",
        og_description: post.og_description || "",
        og_image_url: post.og_image_url || "",
        author_name: post.author_name || "",
        read_time: post.read_time || ""
      });
     setIsDialogOpen(true);
   };
 
   const handleSave = async () => {
     if (!formData.title || !formData.content) {
       toast.error("Preencha o título e o conteúdo");
       return;
     }
 
     setIsSaving(true);
    try {
      let slug = formData.slug?.trim();
      if (!slug) {
        slug = generateSlug(formData.title);
      } else {
        slug = generateSlug(slug); // Ensure it's valid format even if manual
      }
      
      if (!validateSlug(slug)) {
        toast.error("Link inválido. Tente usar apenas letras, números e hifens.");
        return;
      }

      const dataToSave = {
        ...formData,
        slug,
        published_at: formData.status === "published" ? new Date().toISOString() : null
      };
 
       if (editingPost) {
         const { error } = await supabase
           .from("posts")
           .update(dataToSave)
           .eq("id", editingPost.id);
         if (error) throw error;
         toast.success("Notícia atualizada com sucesso");
       } else {
         const { error } = await supabase.from("posts").insert(dataToSave);
         if (error) throw error;
         toast.success("Notícia cadastrada com sucesso");
       }
 
       setIsDialogOpen(false);
       resetForm();
       fetchData();
     } catch (error: any) {
       toast.error("Erro ao salvar notícia: " + error.message);
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleDelete = async (id: string) => {
     if (!confirm("Tem certeza que deseja excluir esta notícia?")) return;
     
     try {
       const { error } = await supabase.from("posts").delete().eq("id", id);
       if (error) throw error;
       toast.success("Notícia excluída com sucesso");
       fetchData();
     } catch (error: any) {
       toast.error("Erro ao excluir notícia: " + error.message);
     }
   };
 
    const filteredPosts = posts.filter(post => {
      const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
             {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Lista"}
           </Button>
         </div>
          <div className="flex flex-1 items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar notícia..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="pending_review">Pendente de Revisão</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
         </div>
          <div className="flex gap-2">
            <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">
                  <Sparkles className="mr-2 h-4 w-4" /> Gerar com IA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerar Artigo com IA</DialogTitle>
                  <DialogDescription>
                    Descreva o tema ou envie um fato e nossa IA criará um rascunho completo.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <Label>O que você quer escrever?</Label>
                  <Textarea 
                    placeholder="Ex: Resultados do Leilão de Touros Nelore em Uberaba, destacando recorde de preços..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    className="bg-gold text-emerald-deep w-full" 
                    onClick={handleGenerateAi}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Gerar Rascunho para Aprovação
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
               <DialogTrigger asChild>
                 <Button className="bg-gold hover:bg-gold/90 text-emerald-deep">
                   <PlusCircle className="mr-2 h-4 w-4" /> Nova Notícia
                 </Button>
               </DialogTrigger>
             <DialogContent className={`${isFullScreen ? "sm:max-w-[95vw] h-[95vh]" : "sm:max-w-[700px] max-h-[90vh]"} overflow-y-auto transition-all duration-300`}>
             <DialogHeader>
                 <div className="flex items-center justify-between pr-8">
                   <DialogTitle>{editingPost ? "Editar Notícia" : "Criar Nova Notícia"}</DialogTitle>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     onClick={() => setIsFullScreen(!isFullScreen)}
                     title={isFullScreen ? "Reduzir" : "Tela Cheia"}
                   >
                     {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                   </Button>
                 </div>
               <DialogDescription>
                 Preencha os campos abaixo para publicar uma notícia no site.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-6 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="title">Título</Label>
                 <Input 
                   id="title"
                   value={formData.title} 
                   onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                   placeholder="Título da notícia"
                 />
               </div>
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label>Categoria</Label>
                   <Select 
                     value={formData.category_id} 
                     onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Selecione uma categoria" />
                     </SelectTrigger>
                     <SelectContent>
                       {categories.map((cat) => (
                         <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="grid gap-2">
                   <Label>Status</Label>
                   <Select 
                     value={formData.status} 
                     onValueChange={(val) => setFormData({ ...formData, status: val })}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Status" />
                     </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="pending_review">Pendente de Revisão</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="image">URL da Imagem de Destaque</Label>
                 <Input 
                   id="image"
                   value={formData.featured_image} 
                   onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })} 
                   placeholder="https://exemplo.com/imagem.jpg"
                 />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="excerpt">Resumo (Exibido na lista)</Label>
                 <Textarea 
                   id="excerpt"
                   value={formData.excerpt} 
                   onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} 
                   placeholder="Breve resumo da notícia"
                 />
               </div>
                <Tabs defaultValue="editor" className="w-full">
                   <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="editor">Conteúdo</TabsTrigger>
                    <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
                    <TabsTrigger value="social">Social / OG</TabsTrigger>
                    <TabsTrigger value="rich">Rich Results</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                   <TabsContent value="editor" className={`space-y-4 pt-4 ${isFullScreen ? "h-[calc(95vh-250px)]" : ""}`}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="author_name">Autor</Label>
                        <Input 
                          id="author_name"
                          value={formData.author_name} 
                          onChange={(e) => setFormData({ ...formData, author_name: e.target.value })} 
                          placeholder="Nome do autor"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="read_time">Tempo de Leitura</Label>
                        <Input 
                          id="read_time"
                          value={formData.read_time} 
                          onChange={(e) => setFormData({ ...formData, read_time: e.target.value })} 
                          placeholder="Ex: 5 min"
                        />
                      </div>
                    </div>
                     <div className={`grid gap-2 ${isFullScreen ? "h-full" : ""}`}>
                      <Label htmlFor="content">Conteúdo (Markdown suportado)</Label>
                      <Textarea 
                        id="content"
                         className={`${isFullScreen ? "flex-1 min-h-[400px]" : "min-h-[300px]"} font-mono`}
                        value={formData.content} 
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                        placeholder="Conteúdo completo da notícia..."
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="seo" className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug (URL amigável)</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="slug"
                          value={formData.slug} 
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                          placeholder="exemplo-de-link-seo"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title) })}
                          type="button"
                        >
                          Gerar da Titulo
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                       <div className="flex items-center justify-between">
                         <Label htmlFor="seo_title">SEO Title (Título da Aba)</Label>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-7 text-[10px] uppercase font-bold text-emerald-600 gap-1"
                           onClick={handleAutoFix}
                           disabled={isAiFixing}
                           type="button"
                         >
                           {isAiFixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                           Auto-completar com IA
                         </Button>
                       </div>
                      <Input 
                        id="seo_title"
                        value={formData.seo_title} 
                        onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })} 
                        placeholder="Título para buscadores"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="seo_description">SEO Description</Label>
                      <Textarea 
                        id="seo_description"
                        value={formData.seo_description} 
                        onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })} 
                        placeholder="Meta descrição para o Google"
                      />
                    </div>

                     <div className="pt-4 border-t">
                       <SeoAnalysis 
                         title={formData.seo_title || formData.title}
                         description={formData.seo_description || formData.excerpt}
                         content={formData.content}
                         image={formData.featured_image}
                          ogTitle={formData.og_title}
                          ogDescription={formData.og_description}
                       />
                       <div className="mt-6">
                         <SerpPreview 
                           title={formData.seo_title || formData.title}
                           description={formData.seo_description || formData.excerpt}
                           slug={formData.slug}
                           basePath="/noticias"
                         />
                       </div>
                     </div>
                  </TabsContent>
                  <TabsContent value="social" className="space-y-4 pt-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="og_title">Título Open Graph (Opcional)</Label>
                        <Input 
                          id="og_title"
                          value={formData.og_title} 
                          onChange={(e) => setFormData({ ...formData, og_title: e.target.value })} 
                          placeholder="Override do título para redes sociais"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="og_description">Descrição Open Graph (Opcional)</Label>
                        <Textarea 
                          id="og_description"
                          value={formData.og_description} 
                          onChange={(e) => setFormData({ ...formData, og_description: e.target.value })} 
                          placeholder="Override da descrição para redes sociais"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="og_image_url">Imagem Open Graph (Opcional)</Label>
                        <Input 
                          id="og_image_url"
                          value={formData.og_image_url} 
                          onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })} 
                          placeholder="URL da imagem específica para compartilhamento"
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <SocialPreview 
                        title={formData.og_title || formData.seo_title || formData.title}
                        description={formData.og_description || formData.seo_description || formData.excerpt}
                        image={formData.og_image_url || formData.featured_image}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="rich" className="space-y-4 pt-4">
                    <RichResultsPreview 
                      type="article"
                      title={formData.seo_title || formData.title}
                      data={{
                        author: formData.author_name || "Premium Agro",
                        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                      }}
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="pt-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-6 bg-muted/20 min-h-[400px]">
                      <h1 className="text-2xl font-bold mb-4">{formData.title || "Título da Notícia"}</h1>
                      {formData.featured_image && (
                        <img src={formData.featured_image} alt="" className="w-full h-48 object-cover rounded-lg mb-4" />
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-4 border-b">
                        <span>{formData.author_name || "Autor Anônimo"}</span>
                        <span>•</span>
                        <span>{formData.read_time || "5 min"} de leitura</span>
                      </div>
                      <div className="whitespace-pre-wrap">
                        {formData.content || "Sem conteúdo para exibir."}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
               <Button onClick={handleSave} className="bg-gold hover:bg-gold/90 text-emerald-deep" disabled={isSaving}>
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                 Salvar
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>Notícias Cadastradas</CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="flex h-32 items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-gold" />
             </div>
           ) : (
             <div className="rounded-md border">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Notícia</TableHead>
                     <TableHead>Categoria</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Data</TableHead>
                     <TableHead className="text-right">Ações</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredPosts.length > 0 ? (
                     filteredPosts.map((post) => (
                       <TableRow key={post.id}>
                         <TableCell className="font-medium">
                           <div className="flex items-center gap-3">
                             {post.featured_image ? (
                               <img src={post.featured_image} alt="" className="h-10 w-10 rounded object-cover border" />
                             ) : (
                               <div className="h-10 w-10 rounded bg-muted flex items-center justify-center border">
                                 <ImageIcon className="h-4 w-4 text-muted-foreground" />
                               </div>
                             )}
                             <div className="max-w-[300px] truncate">
                               {post.title}
                             </div>
                           </div>
                         </TableCell>
                         <TableCell>{post.category?.name || "Sem categoria"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 
                              post.status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {post.status === 'published' ? 'Publicado' : 
                               post.status === 'pending_review' ? 'Pendente' : 'Rascunho'}
                            </span>
                          </TableCell>
                         <TableCell className="text-muted-foreground text-xs">
                           {new Date(post.created_at).toLocaleDateString('pt-BR')}
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <a href={`/noticias/${post.slug}`} target="_blank" rel="noreferrer">
                                     <Button variant="ghost" size="icon">
                                       <Eye className="h-4 w-4 text-gray-500" />
                                     </Button>
                                   </a>
                                 </TooltipTrigger>
                                 <TooltipContent>Ver no site</TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                                     <Pencil className="h-4 w-4 text-blue-500" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>Editar notícia</TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                                     <Trash2 className="h-4 w-4 text-red-500" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>Excluir notícia</TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))
                   ) : (
                     <TableRow>
                       <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                         Nenhuma notícia encontrada.
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }