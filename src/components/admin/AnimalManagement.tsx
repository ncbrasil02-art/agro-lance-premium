 import { Upload } from "lucide-react";
 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Loader2, PlusCircle, Check, ShoppingCart, DollarSign, Filter } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Checkbox } from "@/components/ui/checkbox";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { toast } from "sonner";
 
 const VETERINARY_CHECKLIST = [
   { id: "prognata", label: "Prognata?" },
   { id: "aerofagico", label: "Aerofágico?" },
   { id: "criptorquidico", label: "Criptorquídico?" },
   { id: "cirurgia_neurectomia", label: "Cirurgia de neurectomia" },
   { id: "laminite", label: "Laminite?" },
   { id: "cirurgia_colica", label: "Já fez Cirurgia de Cólica?" },
   { id: "dpco", label: "DPCO?" },
   { id: "cirurgia_grave", label: "Já fez Cirurgia Grave?" },
   { id: "cicatrizes", label: "Tem Cicatrizes?" },
   { id: "hypp", label: "HYPP?" },
 ];
 
 export function AnimalManagement() {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingAnimal, setEditingAnimal] = useState<any>(null);
  const [customHealthItem, setCustomHealthItem] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  
      const [formData, setFormData] = useState<any>({
         seller_id: "",
         category_id: "",
        name: "",
        species: "Equino",
        breed: "",
        registration_number: "",
        registration_1cc: "",
        registration_2: "",
        chip_number: "",
        book: "",
        blood_typing: "",
        blood_percentage: "",
        sex: "M",
        location: "",
       youtube_url: "",
       pedigree_url: "",
       color: "",
       birth_date: "",
       photos_urls: "",
       weight: "",
       height: "",
         vaccination_records: "",
         veterinary_history: {},
          other_veterinary_info: "",
           genealogy_father: "",
           genealogy_mother: "",
           genealogy_grandfather_paternal: "",
           genealogy_grandmother_paternal: "",
           genealogy_grandfather_maternal: "",
           genealogy_grandmother_maternal: "",
           genealogy_great_grandfather_pp: "",
           genealogy_great_grandmother_pp: "",
           genealogy_great_grandfather_pm: "",
           genealogy_great_grandmother_pm: "",
           genealogy_great_grandfather_mp: "",
           genealogy_great_grandmother_mp: "",
           genealogy_great_grandfather_mm: "",
           genealogy_great_grandmother_mm: "",
           description: "",
          is_direct_sale: false,
           sale_price: "",
           sale_status: "available",
           accepts_offers: false
    });

     const resetForm = () => {
       setEditingAnimal(null);
        setFormData({
          seller_id: "",
          category_id: "",
         name: "",
         species: "Equino",
         breed: "",
         registration_number: "",
         registration_1cc: "",
         registration_2: "",
         chip_number: "",
         book: "",
         blood_typing: "",
         blood_percentage: "",
         sex: "M",
         location: "",
        youtube_url: "",
        pedigree_url: "",
        color: "",
        birth_date: "",
        photos_urls: "",
        weight: "",
        height: "",
         vaccination_records: "",
         veterinary_history: {},
          other_veterinary_info: "",
           genealogy_father: "",
           genealogy_mother: "",
           genealogy_grandfather_paternal: "",
           genealogy_grandmother_paternal: "",
           genealogy_grandfather_maternal: "",
           genealogy_grandmother_maternal: "",
           genealogy_great_grandfather_pp: "",
           genealogy_great_grandmother_pp: "",
           genealogy_great_grandfather_pm: "",
           genealogy_great_grandmother_pm: "",
           genealogy_great_grandfather_mp: "",
           genealogy_great_grandmother_mp: "",
           genealogy_great_grandfather_mm: "",
           genealogy_great_grandmother_mm: "",
           description: "",
          is_direct_sale: false,
           sale_price: "",
           sale_status: "available",
           accepts_offers: false
      });
    };

     const handleEdit = (animal: any) => {
       setEditingAnimal(animal);
        setFormData({
          seller_id: animal.seller_id || "",
          category_id: animal.category_id || "",
         name: animal.name || "",
         species: animal.species || "Equino",
         breed: animal.breed || "",
         registration_number: animal.registration_number || "",
         registration_1cc: animal.registration_1cc || "",
         registration_2: animal.registration_2 || "",
         chip_number: animal.chip_number || "",
         book: animal.book || "",
         blood_typing: animal.blood_typing || "",
         blood_percentage: animal.blood_percentage || "",
         sex: animal.sex || "M",
         location: animal.location || "",
        youtube_url: animal.youtube_url || "",
        pedigree_url: animal.pedigree_url || "",
        color: animal.color || "",
        birth_date: animal.birth_date || "",
        photos_urls: animal.photos ? animal.photos.join(", ") : "",
        weight: animal.weight || "",
        height: animal.height || "",
         vaccination_records: Array.isArray(animal.vaccination_records) ? animal.vaccination_records.join(", ") : (animal.vaccination_records || ""),
         veterinary_history: animal.veterinary_history || {},
         other_veterinary_info: animal.veterinary_history?.other_info || "",
         genealogy_father: animal.genealogy?.father || "",
          genealogy_mother: animal.genealogy?.mother || "",
          genealogy_grandfather_paternal: animal.genealogy?.grandfather_paternal || "",
          genealogy_grandmother_paternal: animal.genealogy?.grandmother_paternal || "",
          genealogy_grandfather_maternal: animal.genealogy?.grandfather_maternal || "",
          genealogy_grandmother_maternal: animal.genealogy?.grandmother_maternal || "",
          genealogy_great_grandfather_pp: animal.genealogy?.great_grandfather_pp || "",
          genealogy_great_grandmother_pp: animal.genealogy?.great_grandmother_pp || "",
          genealogy_great_grandfather_pm: animal.genealogy?.great_grandfather_pm || "",
          genealogy_great_grandmother_pm: animal.genealogy?.great_grandmother_pm || "",
          genealogy_great_grandfather_mp: animal.genealogy?.great_grandfather_mp || "",
          genealogy_great_grandmother_mp: animal.genealogy?.great_grandmother_mp || "",
          genealogy_great_grandfather_mm: animal.genealogy?.great_grandfather_mm || "",
          genealogy_great_grandmother_mm: animal.genealogy?.great_grandmother_mm || "",
         description: animal.description || "",
         is_direct_sale: animal.is_direct_sale || false,
          sale_price: animal.sale_price || "",
          sale_status: animal.sale_status || "available",
          accepts_offers: animal.accepts_offers || false
      });
      setIsDialogOpen(true);
    };
 
    const handleSave = async () => {
      if (!formData.name || !formData.breed) {
        toast.error("Preencha o nome e a raça");
        return;
      }
 
      try {
        if (editingAnimal) {
          const { error } = await supabase
            .from("animals")
             .update({
               seller_id: formData.seller_id || null,
               category_id: formData.category_id || null,
              name: formData.name,
              species: formData.species,
               breed: formData.breed,
               registration_number: formData.registration_number,
               registration_1cc: formData.registration_1cc,
               registration_2: formData.registration_2,
               chip_number: formData.chip_number,
               book: formData.book,
               blood_typing: formData.blood_typing,
               blood_percentage: formData.blood_percentage,
               sex: formData.sex,
              location: formData.location,
              youtube_url: formData.youtube_url,
              pedigree_url: formData.pedigree_url,
              color: formData.color,
              birth_date: formData.birth_date || null,
               weight: formData.weight ? parseFloat(formData.weight as string) : null,
               height: formData.height ? parseFloat(formData.height as string) : null,
               default_bid_increment: formData.default_bid_increment ? parseFloat(formData.default_bid_increment as string) : 1000,
                 vaccination_records: formData.vaccination_records ? formData.vaccination_records.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
                 veterinary_history: { ...formData.veterinary_history, other_info: formData.other_veterinary_info },
               genealogy: { 
                 father: formData.genealogy_father, 
                 mother: formData.genealogy_mother,
                 grandfather_paternal: formData.genealogy_grandfather_paternal,
                 grandmother_paternal: formData.genealogy_grandmother_paternal,
                 grandfather_maternal: formData.genealogy_grandfather_maternal,
                 grandmother_maternal: formData.genealogy_grandmother_maternal,
                 great_grandfather_pp: formData.genealogy_great_grandfather_pp,
                 great_grandmother_pp: formData.genealogy_great_grandmother_pp,
                 great_grandfather_pm: formData.genealogy_great_grandfather_pm,
                 great_grandmother_pm: formData.genealogy_great_grandmother_pm,
                 great_grandfather_mp: formData.genealogy_great_grandfather_mp,
                 great_grandmother_mp: formData.genealogy_great_grandmother_mp,
                 great_grandfather_mm: formData.genealogy_great_grandfather_mm,
                 great_grandmother_mm: formData.genealogy_great_grandmother_mm
               },
               photos: formData.photos_urls ? formData.photos_urls.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
               description: formData.description,
                is_direct_sale: formData.is_direct_sale,
                accepts_offers: formData.accepts_offers,
               sale_price: formData.sale_price ? parseFloat(formData.sale_price as string) : null,
               sale_status: formData.sale_status
            })
            .eq("id", editingAnimal.id);
          if (error) throw error;
          toast.success("Animal atualizado com sucesso");
        } else {
           const { error } = await supabase.from("animals").insert({
             seller_id: formData.seller_id || null,
             category_id: formData.category_id || null,
            name: formData.name,
            species: formData.species,
             breed: formData.breed,
             registration_number: formData.registration_number,
             registration_1cc: formData.registration_1cc,
             registration_2: formData.registration_2,
             chip_number: formData.chip_number,
             book: formData.book,
             blood_typing: formData.blood_typing,
             blood_percentage: formData.blood_percentage,
             sex: formData.sex,
            location: formData.location,
            youtube_url: formData.youtube_url,
            pedigree_url: formData.pedigree_url,
            color: formData.color,
            birth_date: formData.birth_date || null,
             weight: formData.weight ? parseFloat(formData.weight as string) : null,
             height: formData.height ? parseFloat(formData.height as string) : null,
             default_bid_increment: formData.default_bid_increment ? parseFloat(formData.default_bid_increment as string) : 1000,
               vaccination_records: formData.vaccination_records ? formData.vaccination_records.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
               veterinary_history: { ...formData.veterinary_history, other_info: formData.other_veterinary_info },
              genealogy: { 
                father: formData.genealogy_father, 
                mother: formData.genealogy_mother,
                grandfather_paternal: formData.genealogy_grandfather_paternal,
                grandmother_paternal: formData.genealogy_grandmother_paternal,
                grandfather_maternal: formData.genealogy_grandfather_maternal,
                grandmother_maternal: formData.genealogy_grandmother_maternal,
                great_grandfather_pp: formData.genealogy_great_grandfather_pp,
                great_grandmother_pp: formData.genealogy_great_grandmother_pp,
                great_grandfather_pm: formData.genealogy_great_grandfather_pm,
                great_grandmother_pm: formData.genealogy_great_grandmother_pm,
                great_grandfather_mp: formData.genealogy_great_grandfather_mp,
                great_grandmother_mp: formData.genealogy_great_grandmother_mp,
                great_grandfather_mm: formData.genealogy_great_grandfather_mm,
                great_grandmother_mm: formData.genealogy_great_grandmother_mm
              },
             internal_code: `AN-${Math.floor(Math.random() * 10000)}`,
             photos: formData.photos_urls ? formData.photos_urls.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
             description: formData.description,
              is_direct_sale: formData.is_direct_sale,
              accepts_offers: formData.accepts_offers,
             sale_price: formData.sale_price ? parseFloat(formData.sale_price as string) : null,
             sale_status: formData.sale_status
          });
          if (error) throw error;
          toast.success("Animal cadastrado com sucesso");
        }
 
        setIsDialogOpen(false);
        resetForm();
        fetchAnimals();
      } catch (error: any) {
        toast.error("Erro ao salvar animal: " + error.message);
      }
    };
    const [animals, setAnimals] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);

    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      if (data) setCategories(data);
    };

    const fetchSellers = async () => {
      const { data } = await supabase.from("sellers").select("id, name").order("name");
      if (data) setSellers(data);
    };

   const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
 
    const fetchAnimals = async () => {
      setIsLoading(true);
      console.log("Fetching animals...");
      try {
         const { data, error } = await supabase
           .from("animals")
           .select("*, categories!animals_category_id_fkey(name)")
           .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching animals:", error);
          throw error;
        }
        console.log("Animals loaded:", data?.length || 0);
        setAnimals(data || []);
      } catch (error: any) {
        console.error("Catch error fetching animals:", error);
        toast.error("Erro ao carregar animais: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
 
    useEffect(() => {
      fetchAnimals();
      fetchCategories();
      fetchSellers();
    }, []);
 
   const filteredAnimals = animals.filter(animal => {
     const matchesSearch = animal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          animal.registration_number?.toLowerCase().includes(searchQuery.toLowerCase());
     
     if (statusFilter === "all") return matchesSearch;
     if (statusFilter === "direct_sale") return matchesSearch && animal.is_direct_sale;
     if (statusFilter === "auction_only") return matchesSearch && !animal.is_direct_sale;
     return matchesSearch && animal.sale_status === statusFilter;
   });
 
   const handleDelete = async (id: string) => {
     if (!confirm("Tem certeza que deseja excluir este animal?")) return;
     
     try {
       const { error } = await supabase.from("animals").delete().eq("id", id);
       if (error) throw error;
       toast.success("Animal excluído com sucesso");
       fetchAnimals();
     } catch (error: any) {
       toast.error("Erro ao excluir animal: " + error.message);
     }
   };
 
   return (
     <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAnimals} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Lista"}
            </Button>
          </div>
          <div className="flex flex-1 items-center gap-4 max-w-2xl">
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
              <Filter className="h-3 w-3 ml-2 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 w-[150px] text-xs">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Animais</SelectItem>
                  <SelectItem value="direct_sale">Venda Direta</SelectItem>
                  <SelectItem value="auction_only">Apenas Leilão</SelectItem>
                  <SelectItem value="available">Status: Disponível</SelectItem>
                  <SelectItem value="reserved">Status: Reservado</SelectItem>
                  <SelectItem value="sold">Status: Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar por nome ou registro..."
             className="pl-10"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
           <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold/90 text-emerald-deep" onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
               <PlusCircle className="mr-2 h-4 w-4" /> Novo Animal
             </Button>
           </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
             <DialogHeader>
                <DialogTitle>{editingAnimal ? "Editar Animal" : "Cadastrar Novo Animal"}</DialogTitle>
               <DialogDescription>
                  Preencha as informações detalhadas do animal.
               </DialogDescription>
             </DialogHeader>
               <Tabs defaultValue="geral" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-4">
                    <TabsTrigger value="geral" className="text-xs">Geral</TabsTrigger>
                    <TabsTrigger value="registros" className="text-xs">Registros</TabsTrigger>
                    <TabsTrigger value="genealogia" className="text-xs">Genealogia</TabsTrigger>
                    <TabsTrigger value="saude" className="text-xs">Saúde</TabsTrigger>
                    <TabsTrigger value="midia" className="text-xs">Mídia</TabsTrigger>
                    <TabsTrigger value="venda" className="text-xs">Venda</TabsTrigger>
                  </TabsList>

                  <TabsContent value="venda" className="space-y-4 animate-in fade-in slide-in-from-left-2">
                   <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
                     <Checkbox 
                       id="is_direct_sale" 
                       checked={formData.is_direct_sale}
                       onCheckedChange={(checked) => setFormData({ ...formData, is_direct_sale: !!checked })}
                     />
                     <div className="grid gap-1.5 leading-none">
                       <Label htmlFor="is_direct_sale" className="text-sm font-medium leading-none cursor-pointer">
                         Disponível para Venda Direta
                       </Label>
                       <p className="text-xs text-muted-foreground">
                         Ao marcar esta opção, o animal aparecerá na área de "Compra de Animais" do site.
                       </p>
                     </div>
                   </div>

                    <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
                      <Checkbox 
                        id="accepts_offers" 
                        checked={formData.accepts_offers}
                        onCheckedChange={(checked) => setFormData({ ...formData, accepts_offers: !!checked })}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="accepts_offers" className="text-sm font-medium leading-none cursor-pointer">
                          Habilitar Ofertas Informais
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Permite que usuários enviem propostas de compra para este animal.
                        </p>
                      </div>
                    </div>

                    {formData.is_direct_sale && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                       <div className="grid gap-2">
                         <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
                         <div className="relative">
                           <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input 
                             id="sale_price" 
                             type="number" 
                             className="pl-9"
                             value={formData.sale_price} 
                             onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} 
                             placeholder="0,00"
                           />
                         </div>
                       </div>
                       <div className="grid gap-2">
                         <Label htmlFor="sale_status">Status da Venda</Label>
                         <Select onValueChange={(v) => setFormData({ ...formData, sale_status: v })} value={formData.sale_status}>
                           <SelectTrigger id="sale_status"><SelectValue /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="available">Disponível</SelectItem>
                             <SelectItem value="reserved">Reservado</SelectItem>
                             <SelectItem value="sold">Vendido</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
                   )}
                  </TabsContent>

                <TabsContent value="registros" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="reg_main">Registro Principal</Label>
                      <Input id="reg_main" value={formData.registration_number} onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                       <Label htmlFor="reg1cc">Registro 1CC</Label>
                       <Input id="reg1cc" value={formData.registration_1cc} onChange={(e) => setFormData({ ...formData, registration_1cc: e.target.value })} placeholder="Ex: 123456" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reg2">Registro Secundário</Label>
                        <Input id="reg2" value={formData.registration_2} onChange={(e) => setFormData({ ...formData, registration_2: e.target.value })} placeholder="Outros registros ou associações" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="chip">Informe o Chip</Label>
                      <Input id="chip" value={formData.chip_number} onChange={(e) => setFormData({ ...formData, chip_number: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="livro">Livro</Label>
                      <Input id="livro" value={formData.book} onChange={(e) => setFormData({ ...formData, book: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tipagem">Tipagem</Label>
                      <Input id="tipagem" value={formData.blood_typing} onChange={(e) => setFormData({ ...formData, blood_typing: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="grau">Grau Sangue</Label>
                      <Input id="grau" value={formData.blood_percentage} onChange={(e) => setFormData({ ...formData, blood_percentage: e.target.value })} />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="geral" className="space-y-4 pt-4">
                 <div className="grid gap-2">
                   <Label htmlFor="name">Nome</Label>
                   <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="description">Descrição / Bio</Label>
                   <textarea 
                     id="description"
                     className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     value={formData.description} 
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                     placeholder="Fale um pouco sobre as qualidades do animal..."
                   />
                 </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select onValueChange={(v) => setFormData({ ...formData, category_id: v })} value={formData.category_id}>
                        <SelectTrigger id="category"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="species">Espécie</Label>
                      <Select onValueChange={(v) => setFormData({ ...formData, species: v })} value={formData.species}>
                        <SelectTrigger id="species"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Equino">Equino</SelectItem>
                          <SelectItem value="Bovino">Bovino</SelectItem>
                          <SelectItem value="Ovino">Ovino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="breed">Raça</Label>
                      <Input id="breed" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sex">Sexo</Label>
                    <Select onValueChange={(v) => setFormData({ ...formData, sex: v })} value={formData.sex}>
                      <SelectTrigger id="sex"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Macho</SelectItem>
                        <SelectItem value="F">Fêmea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="grid gap-2">
                     <Label htmlFor="birth_date">Data de Nascimento</Label>
                     <Input id="birth_date" type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} />
                   </div>
                   <div className="grid gap-2">
                     <Label htmlFor="color">Pelagem/Cor</Label>
                     <Input id="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="grid gap-2">
                     <Label htmlFor="location">Localização</Label>
                     <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Fazenda, Cidade - UF" />
                   </div>
                   <div className="grid gap-2">
                     <Label htmlFor="seller">Vendedor</Label>
                     <Select onValueChange={(v) => setFormData({ ...formData, seller_id: v })} value={formData.seller_id}>
                       <SelectTrigger id="seller">
                         <SelectValue placeholder="Selecione o vendedor" />
                       </SelectTrigger>
                       <SelectContent>
                         {sellers.map((seller) => (
                           <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                    <div className="grid gap-2">
                      <Label htmlFor="default_bid_increment">Incremento Padrão de Lance (R$)</Label>
                      <Input 
                        id="default_bid_increment" 
                        type="number" 
                        value={formData.default_bid_increment} 
                        onChange={(e) => setFormData({ ...formData, default_bid_increment: e.target.value })} 
                        placeholder="1000" 
                      />
                      <p className="text-[10px] text-muted-foreground">Valor sugerido para lances quando este animal for alocado em um lote.</p>
                    </div>
                  </div>
                </TabsContent>
                
                 <TabsContent value="genealogia" className="space-y-6 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm border-b pb-1">1ª Geração (Pais)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="father">Pai</Label>
                        <Input id="father" value={formData.genealogy_father} onChange={(e) => setFormData({ ...formData, genealogy_father: e.target.value })} placeholder="Nome do pai" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="mother">Mãe</Label>
                        <Input id="mother" value={formData.genealogy_mother} onChange={(e) => setFormData({ ...formData, genealogy_mother: e.target.value })} placeholder="Nome da mãe" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-sm border-b pb-1">2ª Geração (Avós)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label className="text-xs text-muted-foreground">Avô Paterno</Label>
                          <Input value={formData.genealogy_grandfather_paternal} onChange={(e) => setFormData({ ...formData, genealogy_grandfather_paternal: e.target.value })} placeholder="Pai do pai" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs text-muted-foreground">Avó Paterna</Label>
                          <Input value={formData.genealogy_grandmother_paternal} onChange={(e) => setFormData({ ...formData, genealogy_grandmother_paternal: e.target.value })} placeholder="Mãe do pai" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label className="text-xs text-muted-foreground">Avô Materno</Label>
                          <Input value={formData.genealogy_grandfather_maternal} onChange={(e) => setFormData({ ...formData, genealogy_grandfather_maternal: e.target.value })} placeholder="Pai da mãe" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs text-muted-foreground">Avó Materna</Label>
                          <Input value={formData.genealogy_grandmother_maternal} onChange={(e) => setFormData({ ...formData, genealogy_grandmother_maternal: e.target.value })} placeholder="Mãe da mãe" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-sm border-b pb-1">3ª Geração (Bisavós)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Paternos */}
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold text-gold/60">Linha Paterna</Label>
                        <div className="grid gap-2">
                          <Label className="text-[9px]">Pai do Avô Pat.</Label>
                          <Input size={1} className="h-8 text-xs" value={formData.genealogy_great_grandfather_pp} onChange={(e) => setFormData({ ...formData, genealogy_great_grandfather_pp: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[9px]">Mãe do Avô Pat.</Label>
                          <Input size={1} className="h-8 text-xs" value={formData.genealogy_great_grandmother_pp} onChange={(e) => setFormData({ ...formData, genealogy_great_grandmother_pp: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[9px]">Pai da Avó Pat.</Label>
                          <Input size={1} className="h-8 text-xs" value={formData.genealogy_great_grandfather_pm} onChange={(e) => setFormData({ ...formData, genealogy_great_grandfather_pm: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[9px]">Mãe da Avó Pat.</Label>
                          <Input size={1} className="h-8 text-xs" value={formData.genealogy_great_grandmother_pm} onChange={(e) => setFormData({ ...formData, genealogy_great_grandmother_pm: e.target.value })} />
                        </div>
                      </div>
                      {/* Maternos */}
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold text-gold/60">Linha Materna</Label>
                        <div className="grid gap-2">
                          <Label className="text-[9px]">Pai do Avô Mat.</Label>
                          <Input size={1} className="h-8 text-xs" value={formData.genealogy_great_grandfather_mp} onChange={(e) => setFormData({ ...formData, genealogy_great_grandfather_mp: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[9px]">Mãe do Avô Mat.</Label>
                          <Input size={1} className="h-8 text-xs" value={formData.genealogy_great_grandmother_mp} onChange={(e) => setFormData({ ...formData, genealogy_great_grandmother_mp: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[9px]">Pai da Avó Mat.</Label>
                          <Input size={1} className="h-8 text-xs" value={formData.genealogy_great_grandfather_mm} onChange={(e) => setFormData({ ...formData, genealogy_great_grandfather_mm: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[9px]">Mãe da Avó Mat.</Label>
                          <Input size={1} className="h-8 text-xs" value={formData.genealogy_great_grandmother_mm} onChange={(e) => setFormData({ ...formData, genealogy_great_grandmother_mm: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-bold text-sm">Medidas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="weight">Peso (kg)</Label>
                        <Input id="weight" type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="0.00" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="height">Altura (m)</Label>
                        <Input id="height" type="number" step="0.01" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
               
               <TabsContent value="saude" className="space-y-4 pt-4">
                 <div className="grid gap-4">
                   <Label className="text-base font-bold">Histórico Veterinário</Label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 border rounded-md p-4 bg-muted/30">
                     {[...VETERINARY_CHECKLIST, ...Object.keys(formData.veterinary_history || {}).filter(k => k !== 'other_info' && !VETERINARY_CHECKLIST.find(i => i.id === k)).map(k => ({ id: k, label: k }))].map((item) => (
                       <div key={item.id} className="flex items-center space-x-2">
                         <Checkbox 
                           id={item.id} 
                           checked={formData.veterinary_history?.[item.id] || false}
                           onCheckedChange={(checked) => {
                             setFormData({
                               ...formData,
                               veterinary_history: {
                                 ...formData.veterinary_history,
                                 [item.id]: !!checked
                               }
                             });
                           }}
                         />
                         <Label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                           {item.label}
                         </Label>
                       </div>
                     ))}
                   </div>
                   
                   <div className="flex gap-2">
                     <Input 
                       placeholder="Adicionar outro item (ex: Anemia)" 
                       value={customHealthItem} 
                       onChange={(e) => setCustomHealthItem(e.target.value)}
                       className="flex-1"
                     />
                     <Button 
                       type="button" 
                       variant="outline" 
                       size="sm"
                       onClick={() => {
                         if (!customHealthItem) return;
                         setFormData({
                           ...formData,
                           veterinary_history: {
                             ...formData.veterinary_history,
                             [customHealthItem]: true
                           }
                         });
                         setCustomHealthItem("");
                       }}
                     >
                       <Plus className="h-4 w-4 mr-1" /> Adicionar
                     </Button>
                   </div>

                   <div className="grid gap-2">
                     <Label htmlFor="other_vet">Outras Observações Veterinárias</Label>
                     <textarea 
                       id="other_vet"
                       className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                       value={formData.other_veterinary_info} 
                       onChange={(e) => setFormData({ ...formData, other_veterinary_info: e.target.value })} 
                       placeholder="Adicione mais informações se necessário..."
                     />
                   </div>
                   
                   <div className="grid gap-2">
                     <Label htmlFor="vaccination">Vacinas Realizadas (separadas por vírgula)</Label>
                     <Input id="vaccination" value={formData.vaccination_records} onChange={(e) => setFormData({ ...formData, vaccination_records: e.target.value })} placeholder="Gripe, Tétano, etc" />
                   </div>
                 </div>
               </TabsContent>
               
               <TabsContent value="midia" className="space-y-4 pt-4">
                 <div className="grid gap-2">
                   <Label htmlFor="youtube">Link do Vídeo (YouTube)</Label>
                   <Input id="youtube" value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                 </div>
                 
                 <div className="grid gap-4 pt-2">
                   <Label className="text-base font-bold">Galeria de Fotos</Label>
                   {formData.photos_urls && (
                     <div className="grid grid-cols-4 gap-2 mb-2">
                        {formData.photos_urls.split(",").map((url: string, i: number) => (
                          <div key={i} className="relative aspect-square group">
                            <OptimizedImage 
                              src={url.trim()} 
                              alt="" 
                              width={200}
                              aspectRatio="square"
                              className="h-full w-full rounded-md border" 
                            />
                            <button 
                             type="button"
                             onClick={() => {
                                const urls = formData.photos_urls.split(",").map((u: string) => u.trim()).filter(Boolean);
                               urls.splice(i, 1);
                               setFormData({ ...formData, photos_urls: urls.join(", ") });
                             }}
                             className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Trash2 className="h-3 w-3" />
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                   <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        id="photo-upload" 
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files) return;
                          const toastId = toast.loading("Enviando fotos...");
                          const uploadedUrls = [];
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${Math.random()}.${fileExt}`;
                            const { data, error } = await supabase.storage.from('animals').upload(fileName, file);
                            if (error) {
                              toast.error(`Erro no upload: ${error.message}`);
                              continue;
                            }
                            const { data: { publicUrl } } = supabase.storage.from('animals').getPublicUrl(data.path);
                            uploadedUrls.push(publicUrl);
                          }
                           const currentUrls = formData.photos_urls ? formData.photos_urls.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                          setFormData({ ...formData, photos_urls: [...currentUrls, ...uploadedUrls].join(", ") });
                          toast.dismiss(toastId);
                          toast.success(`${uploadedUrls.length} fotos enviadas!`);
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 border-dashed" 
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload de Fotos
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFormData({ ...formData, photos_urls: "" })}
                        className="text-[10px]"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                 </div>
                 
                 <div className="grid gap-2 pt-2">
                   <Label htmlFor="docs">Documentos / Pedigree</Label>
                   <div className="flex gap-2">
                     <Input 
                       type="file" 
                       accept=".pdf,image/*" 
                       className="hidden" 
                       id="doc-upload" 
                       onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (!file) return;
                         const toastId = toast.loading("Enviando documento...");
                         const fileExt = file.name.split('.').pop();
                         const fileName = `${Math.random()}.${fileExt}`;
                         const { data, error } = await supabase.storage.from('documents').upload(fileName, file);
                         if (error) {
                           toast.error(`Erro no upload: ${error.message}`);
                         } else {
                           const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path);
                           setFormData({ ...formData, pedigree_url: publicUrl });
                           toast.success("Documento enviado!");
                         }
                         toast.dismiss(toastId);
                       }}
                     />
                     <Button 
                       type="button" 
                       variant="outline" 
                       className="flex-1 border-dashed" 
                       onClick={() => document.getElementById('doc-upload')?.click()}
                     >
                       <Upload className="mr-2 h-4 w-4" /> Upload Documento
                     </Button>
                     {formData.pedigree_url && (
                       <Button variant="ghost" size="sm" asChild>
                         <a href={formData.pedigree_url} target="_blank" rel="noreferrer">Ver</a>
                       </Button>
                     )}
                   </div>
                 </div>
               </TabsContent>
             </Tabs>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-gold text-emerald-deep" onClick={handleSave}>
                  {editingAnimal ? "Salvar Alterações" : "Salvar Animal"}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle>Animais Cadastrados</CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="flex justify-center py-8">
               <Loader2 className="h-8 w-8 animate-spin text-gold" />
             </div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                    <TableHead className="w-[80px]">Foto</TableHead>
                    <TableHead>Nome</TableHead>
                     <TableHead>Categoria/Raça</TableHead>
                     <TableHead>Venda Direta</TableHead>
                    <TableHead>Nº Registro</TableHead>
                   <TableHead>Sexo</TableHead>
                   <TableHead className="text-right">Ações</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredAnimals.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                       Nenhum animal encontrado.
                     </TableCell>
                   </TableRow>
                 ) : (
                    filteredAnimals.map((animal) => (
                       <TableRow key={animal.id} className={animal.sale_status === 'sold' ? "opacity-60 bg-muted/20" : ""}>
                         <TableCell>
                           {animal.photos && animal.photos.length > 0 ? (
                             <OptimizedImage 
                               src={animal.photos[0]} 
                               alt={animal.name} 
                               width={80}
                               aspectRatio="square"
                               className="h-10 w-10 rounded-md border"
                             />
                           ) : (
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground border border-dashed">
                              Sem foto
                            </div>
                          )}
                        </TableCell>
                         <TableCell className="font-medium">
                           <div>{animal.name}</div>
                           {animal.categories?.name && (
                             <div className="text-[10px] text-muted-foreground uppercase">{animal.categories.name}</div>
                           )}
                         </TableCell>
                         <TableCell>{animal.species} / {animal.breed}</TableCell>
                         <TableCell>
                           {animal.is_direct_sale ? (
                             <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                 <ShoppingCart className="h-3 w-3" />
                                 Sim
                               </div>
                               <div className="text-[10px] font-bold">
                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animal.sale_price || 0)}
                               </div>
                               <div className={`text-[9px] uppercase px-1 rounded-full w-fit ${
                                 animal.sale_status === 'available' ? "bg-emerald-100 text-emerald-700" :
                                 animal.sale_status === 'reserved' ? "bg-amber-100 text-amber-700" :
                                 "bg-red-100 text-red-700"
                               }`}>
                                 {animal.sale_status === 'available' ? 'Disponível' : 
                                  animal.sale_status === 'reserved' ? 'Reservado' : 'Vendido'}
                               </div>
                             </div>
                           ) : (
                             <span className="text-xs text-muted-foreground">Não</span>
                           )}
                         </TableCell>
                       <TableCell>{animal.registration_number}</TableCell>
                       <TableCell>{animal.sex === 'M' ? 'Macho' : 'Fêmea'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button variant="ghost" size="icon" onClick={() => handleEdit(animal)}>
                                   <Pencil className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>Editar informações do animal</TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(animal.id)}>
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>Excluir registro permanentemente</TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                      </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }