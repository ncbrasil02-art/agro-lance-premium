 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, PlusCircle, Newspaper, Image as ImageIcon, Eye } from "lucide-react";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { toast } from "sonner";
 
 export function PostManagement() {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingPost, setEditingPost] = useState<any>(null);
   const [formData, setFormData] = useState({
     title: "",
     excerpt: "",
     content: "",
     featured_image: "",
     category_id: "",
     status: "published"
   });
   const [posts, setPosts] = useState<any[]>([]);
   const [categories, setCategories] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
 
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
       status: "published"
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
       status: post.status || "published"
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
       const slug = formData.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
       
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
 
   const filteredPosts = posts.filter(post => 
     post.title?.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
             {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Lista"}
           </Button>
         </div>
         <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar notícia..."
             className="pl-10"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
         </div>
         <Dialog open={isDialogOpen} onOpenChange={(open) => {
           setIsDialogOpen(open);
           if (!open) resetForm();
         }}>
           <DialogTrigger asChild>
             <Button className="bg-gold hover:bg-gold/90 text-emerald-deep">
               <PlusCircle className="mr-2 h-4 w-4" /> Nova Notícia
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>{editingPost ? "Editar Notícia" : "Criar Nova Notícia"}</DialogTitle>
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
                       <SelectItem value="published">Publicado</SelectItem>
                       <SelectItem value="draft">Rascunho</SelectItem>
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
               <div className="grid gap-2">
                 <Label htmlFor="content">Conteúdo (Markdown suportado)</Label>
                 <Textarea 
                   id="content"
                   className="min-h-[200px]"
                   value={formData.content} 
                   onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                   placeholder="Conteúdo completo da notícia..."
                 />
               </div>
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
                           <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                             {post.status === 'published' ? 'Publicado' : 'Rascunho'}
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