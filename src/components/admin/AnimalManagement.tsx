 import { Upload } from "lucide-react";
 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Plus, Search, Pencil, Trash2, Loader2, PlusCircle } from "lucide-react";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { toast } from "sonner";
 
  export function AnimalManagement() {
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingAnimal, setEditingAnimal] = useState<any>(null);
    const [formData, setFormData] = useState({
       name: "",
       species: "Equino",
       breed: "",
       registration_number: "",
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
       genealogy_father: "",
       genealogy_mother: ""
    });

    const resetForm = () => {
      setEditingAnimal(null);
      setFormData({
        name: "",
        species: "Equino",
        breed: "",
        registration_number: "",
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
        genealogy_father: "",
        genealogy_mother: ""
      });
    };

    const handleEdit = (animal: any) => {
      setEditingAnimal(animal);
      setFormData({
        name: animal.name || "",
        species: animal.species || "Equino",
        breed: animal.breed || "",
        registration_number: animal.registration_number || "",
        sex: animal.sex || "M",
        location: animal.location || "",
        youtube_url: animal.youtube_url || "",
        pedigree_url: animal.pedigree_url || "",
        color: animal.color || "",
        birth_date: animal.birth_date || "",
        photos_urls: animal.photos ? animal.photos.join(", ") : "",
        weight: animal.weight || "",
        height: animal.height || "",
        vaccination_records: animal.vaccination_records?.join(", ") || "",
        genealogy_father: animal.genealogy?.father || "",
        genealogy_mother: animal.genealogy?.mother || ""
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
              name: formData.name,
              species: formData.species,
              breed: formData.breed,
              registration_number: formData.registration_number,
              sex: formData.sex,
              location: formData.location,
              youtube_url: formData.youtube_url,
              pedigree_url: formData.pedigree_url,
              color: formData.color,
              birth_date: formData.birth_date || null,
              weight: formData.weight ? parseFloat(formData.weight as string) : null,
              height: formData.height ? parseFloat(formData.height as string) : null,
              vaccination_records: formData.vaccination_records ? formData.vaccination_records.split(",").map(s => s.trim()) : [],
              genealogy: { father: formData.genealogy_father, mother: formData.genealogy_mother },
              photos: formData.photos_urls ? formData.photos_urls.split(",").map(s => s.trim()).filter(Boolean) : []
            })
            .eq("id", editingAnimal.id);
          if (error) throw error;
          toast.success("Animal atualizado com sucesso");
        } else {
          const { error } = await supabase.from("animals").insert({
            name: formData.name,
            species: formData.species,
            breed: formData.breed,
            registration_number: formData.registration_number,
            sex: formData.sex,
            location: formData.location,
            youtube_url: formData.youtube_url,
            pedigree_url: formData.pedigree_url,
            color: formData.color,
            birth_date: formData.birth_date || null,
            weight: formData.weight ? parseFloat(formData.weight as string) : null,
            height: formData.height ? parseFloat(formData.height as string) : null,
            vaccination_records: formData.vaccination_records ? formData.vaccination_records.split(",").map(s => s.trim()) : [],
            genealogy: { father: formData.genealogy_father, mother: formData.genealogy_mother },
            internal_code: `AN-${Math.floor(Math.random() * 10000)}`,
            photos: formData.photos_urls ? formData.photos_urls.split(",").map(s => s.trim()).filter(Boolean) : []
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
   const [isLoading, setIsLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");
 
   const fetchAnimals = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("animals")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setAnimals(data || []);
     } catch (error: any) {
       toast.error("Erro ao carregar animais: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   useEffect(() => {
     fetchAnimals();
   }, []);
 
   const filteredAnimals = animals.filter(animal => 
     animal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     animal.registration_number?.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
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
         <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             placeholder="Buscar por nome ou registro..."
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
              <Button className="bg-gold hover:bg-gold/90 text-emerald-deep" onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
               <PlusCircle className="mr-2 h-4 w-4" /> Novo Animal
             </Button>
           </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
             <DialogHeader>
                <DialogTitle>{editingAnimal ? "Editar Animal" : "Cadastrar Novo Animal"}</DialogTitle>
               <DialogDescription>
                  Preencha as informações detalhadas do animal.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="name">Nome</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="species">Espécie</Label>
                    <Select onValueChange={(v) => setFormData({ ...formData, species: v })} value={formData.species}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Equino">Equino</SelectItem>
                        <SelectItem value="Bovino">Bovino</SelectItem>
                        <SelectItem value="Ovino">Ovino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="breed">Raça</Label>
                    <Input value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
                  </div>
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sex">Sexo</Label>
                    <Select onValueChange={(v) => setFormData({ ...formData, sex: v })} value={formData.sex}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Macho</SelectItem>
                        <SelectItem value="F">Fêmea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg">Registro</Label>
                    <Input value={formData.registration_number} onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })} />
                  </div>
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="color">Pelagem/Cor</Label>
                    <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="youtube">Link do Vídeo (YouTube)</Label>
                  <Input value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pedigree">Link da Genealogia (PDF ou Imagem)</Label>
                  <Input value={formData.pedigree_url} onChange={(e) => setFormData({ ...formData, pedigree_url: e.target.value })} placeholder="https://..." />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                     <Label htmlFor="father">Nome do Pai</Label>
                     <Input value={formData.genealogy_father} onChange={(e) => setFormData({ ...formData, genealogy_father: e.target.value })} placeholder="Nome do pai" />
                   </div>
                   <div className="grid gap-2">
                     <Label htmlFor="mother">Nome da Mãe</Label>
                     <Input value={formData.genealogy_mother} onChange={(e) => setFormData({ ...formData, genealogy_mother: e.target.value })} placeholder="Nome da mãe" />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                     <Label htmlFor="weight">Peso (kg)</Label>
                     <Input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="0.00" />
                   </div>
                   <div className="grid gap-2">
                     <Label htmlFor="height">Altura (m)</Label>
                     <Input type="number" step="0.01" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="0.00" />
                   </div>
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="vaccination">Registro de Vacinação (separados por vírgula)</Label>
                   <Input value={formData.vaccination_records} onChange={(e) => setFormData({ ...formData, vaccination_records: e.target.value })} placeholder="Gripe, Tétano, etc" />
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="photos">Fotos do Animal</Label>
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
                         const currentUrls = formData.photos_urls ? formData.photos_urls.split(", ") : [];
                         setFormData({ ...formData, photos_urls: [...currentUrls, ...uploadedUrls].join(", ") });
                         toast.dismiss(toastId);
                         toast.success("Fotos enviadas com sucesso!");
                       }}
                     />
                     <Button 
                       type="button" 
                       variant="outline" 
                       className="w-full border-dashed" 
                       onClick={() => document.getElementById('photo-upload')?.click()}
                     >
                       <Upload className="mr-2 h-4 w-4" /> Enviar Fotos
                     </Button>
                   </div>
                   <Input value={formData.photos_urls} onChange={(e) => setFormData({ ...formData, photos_urls: e.target.value })} placeholder="Ou cole as URLs separadas por vírgula" />
                 </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
             </div>
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
                   <TableHead>Nome</TableHead>
                   <TableHead>Espécie/Raça</TableHead>
                   <TableHead>Registro</TableHead>
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
                     <TableRow key={animal.id}>
                       <TableCell className="font-medium">{animal.name}</TableCell>
                       <TableCell>{animal.species} / {animal.breed}</TableCell>
                       <TableCell>{animal.registration_number}</TableCell>
                       <TableCell>{animal.sex === 'M' ? 'Macho' : 'Fêmea'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(animal)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(animal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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