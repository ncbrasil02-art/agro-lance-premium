 import { validateImage } from "@/utils/upload-validation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { Plus, Search, Pencil, Trash2, Loader2, PlusCircle, Building2, User, Upload, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { generateSlug } from "@/utils/slug";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function SellerManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<any>(null);
   const [formData, setFormData] = useState({
     name: "",
     type: "pessoa",
     email: "",
     phone: "",
     location: "",
     logo_url: ""
   });
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setSellers(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar vendedores: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const resetForm = () => {
    setEditingSeller(null);
     setFormData({
       name: "",
       type: "pessoa",
       email: "",
       phone: "",
       location: "",
       logo_url: ""
     });
  };

  const handleEdit = (seller: any) => {
    setEditingSeller(seller);
     setFormData({
       name: seller.name || "",
       type: seller.type || "pessoa",
       email: seller.email || "",
       phone: seller.phone || "",
       location: seller.location || "",
       logo_url: seller.logo_url || ""
     });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Preencha o nome");
      return;
    }

    try {
      const slug = editingSeller ? editingSeller.slug : `${generateSlug(formData.name)}-${Math.floor(Math.random() * 1000)}`;
      const dataToSave = { 
        ...formData, 
        slug,
        logo_url: formData.logo_url || null 
      };
      
      if (editingSeller) {
        const { error } = await supabase
          .from("sellers")
          .update(dataToSave)
          .eq("id", editingSeller.id);
        if (error) throw error;
        toast.success("Vendedor atualizado com sucesso");
      } else {
        const { error } = await supabase.from("sellers").insert(dataToSave);
        if (error) throw error;
        toast.success("Vendedor cadastrado com sucesso");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSellers();
    } catch (error: any) {
      toast.error("Erro ao salvar vendedor: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const { count } = await supabase
      .from("animals")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", id);

    const warning = count && count > 0
      ? `\n\nATENÇÃO: Este vendedor possui ${count} animal(is) vinculado(s). Todos os animais, lotes, lances e ofertas relacionados serão excluídos em cascata. Esta ação é IRREVERSÍVEL.`
      : "";

    if (!confirm(`Tem certeza que deseja excluir este vendedor?${warning}`)) return;

    try {
      const { error } = await supabase.from("sellers").delete().eq("id", id);
      if (error) throw error;
      toast.success(count && count > 0
        ? `Vendedor e ${count} animal(is) vinculado(s) excluídos com sucesso`
        : "Vendedor excluído com sucesso");
      fetchSellers();
    } catch (error: any) {
      toast.error("Erro ao excluir vendedor: " + error.message);
    }
  };

  const filteredSellers = sellers.filter(seller => 
    seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSellers} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Lista"}
          </Button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou local..."
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
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingSeller ? "Editar Vendedor" : "Cadastrar Novo Vendedor"}</DialogTitle>
              <DialogDescription>
                Vendedores podem ser fazendas ou pessoas físicas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de Vendedor</Label>
                <Select onValueChange={(v) => setFormData({ ...formData, type: v })} value={formData.type}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoa">Pessoa Física</SelectItem>
                    <SelectItem value="fazenda">Fazenda / Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nome / Razão Social</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Localização (Cidade/Estado)</Label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Ex: Uberaba - MG" />
              </div>
              <div className="grid gap-2">
                <Label>Logotipo do Vendedor</Label>
                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="h-16 w-16 rounded object-contain border bg-white" />
                  ) : (
                    <div className="h-16 w-16 rounded bg-muted border border-dashed flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !validateImage(file)) return;
                        const tid = toast.loading("Enviando logo...");
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `seller_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                          const { data, error } = await supabase.storage.from('public_assets').upload(fileName, file);
                          if (error) throw error;
                           const { data: { publicUrl } } = supabase.storage.from('public_assets').getPublicUrl(data.path);
                           if (!publicUrl) throw new Error("Não foi possível obter a URL pública");
                           setFormData(prev => ({ ...prev, logo_url: publicUrl }));
                          toast.success("Logo enviado!");
                        } catch (error: any) {
                          toast.error("Erro no upload: " + error.message);
                        } finally {
                          toast.dismiss(tid);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-10 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> 
                      {formData.logo_url ? "Trocar Logotipo" : "Upload Logotipo"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-gold hover:bg-gold/90 text-emerald-deep">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendedores</CardTitle>
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSellers.length > 0 ? (
                    filteredSellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>
                          {seller.type === "fazenda" ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase">
                              <Building2 className="h-3 w-3" /> Fazenda
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase">
                              <User className="h-3 w-3" /> Pessoa
                            </div>
                          )}
                        </TableCell>
                         <TableCell>
                           {seller.logo_url ? (
                             <img src={seller.logo_url} alt="" className="h-10 w-10 rounded object-contain border bg-white" />
                           ) : (
                             <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground/30" /></div>
                           )}
                         </TableCell>
                          <TableCell className="font-medium">{seller.name}</TableCell>
                          <TableCell>{seller.location || "--"}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {seller.email && <div>{seller.email}</div>}
                            {seller.phone && <div>{seller.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(seller)}>
                                    <Pencil className="h-4 w-4 text-blue-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar dados do vendedor</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(seller.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover vendedor</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum vendedor encontrado.
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