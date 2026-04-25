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
    const [isCreating, setIsCreating] = useState(false);
    const [newAnimal, setNewAnimal] = useState({
      name: "",
      species: "Equino",
      breed: "",
      registration_number: "",
      sex: "M",
      location: ""
    });
 
    const handleCreate = async () => {
      if (!newAnimal.name || !newAnimal.breed) {
        toast.error("Preencha o nome e a raça");
        return;
      }
 
      try {
        const { error } = await supabase.from("animals").insert({
          name: newAnimal.name,
          species: newAnimal.species,
          breed: newAnimal.breed,
          registration_number: newAnimal.registration_number,
          sex: newAnimal.sex,
          location: newAnimal.location,
          internal_code: `AN-${Math.floor(Math.random() * 10000)}`
        });
 
        if (error) throw error;
        toast.success("Animal cadastrado com sucesso");
        setIsCreating(false);
        fetchAnimals();
      } catch (error: any) {
        toast.error("Erro ao cadastrar animal: " + error.message);
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
         <Dialog open={isCreating} onOpenChange={setIsCreating}>
           <DialogTrigger asChild>
             <Button className="bg-gold hover:bg-gold/90 text-emerald-deep">
               <PlusCircle className="mr-2 h-4 w-4" /> Novo Animal
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>Cadastrar Novo Animal</DialogTitle>
               <DialogDescription>
                 Preencha as informações básicas do animal.
               </DialogDescription>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="name">Nome</Label>
                 <Input value={newAnimal.name} onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="species">Espécie</Label>
                   <Select onValueChange={(v) => setNewAnimal({ ...newAnimal, species: v })} defaultValue={newAnimal.species}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Equino">Equino</SelectItem>
                       <SelectItem value="Bovino">Bovino</SelectItem>
                       <SelectItem value="Ovino">Ovino</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="sex">Sexo</Label>
                   <Select onValueChange={(v) => setNewAnimal({ ...newAnimal, sex: v })} defaultValue={newAnimal.sex}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="M">Macho</SelectItem>
                       <SelectItem value="F">Fêmea</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="breed">Raça</Label>
                 <Input value={newAnimal.breed} onChange={(e) => setNewAnimal({ ...newAnimal, breed: e.target.value })} />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="reg">Registro</Label>
                 <Input value={newAnimal.registration_number} onChange={(e) => setNewAnimal({ ...newAnimal, registration_number: e.target.value })} />
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
               <Button className="bg-gold text-emerald-deep" onClick={handleCreate}>
                 Salvar Animal
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
                           <Button variant="ghost" size="icon">
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