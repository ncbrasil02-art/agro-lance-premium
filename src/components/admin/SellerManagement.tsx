import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Loader2, PlusCircle, Building2, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function SellerManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "pessoa",
    email: "",
    phone: "",
    location: ""
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
      location: ""
    });
  };

  const handleEdit = (seller: any) => {
    setEditingSeller(seller);
    setFormData({
      name: seller.name || "",
      type: seller.type || "pessoa",
      email: seller.email || "",
      phone: seller.phone || "",
      location: seller.location || ""
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Preencha o nome");
      return;
    }

    try {
      if (editingSeller) {
        const { error } = await supabase
          .from("sellers")
          .update(formData)
          .eq("id", editingSeller.id);
        if (error) throw error;
        toast.success("Vendedor atualizado com sucesso");
      } else {
        const { error } = await supabase.from("sellers").insert(formData);
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
    if (!confirm("Tem certeza que deseja excluir este vendedor?")) return;
    
    try {
      const { error } = await supabase.from("sellers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Vendedor excluído com sucesso");
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
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(seller)}>
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(seller.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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