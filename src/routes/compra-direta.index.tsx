import { createFileRoute } from "@tanstack/react-router";
import { generateMetaTags } from "@/utils/seo";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Search, Filter, ArrowRight, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { OfferDialog } from "@/components/auctions/OfferDialog";

 export const Route = createFileRoute("/compra-direta/")({
   head: ({ matches }) => {
     const rootData = matches.find(m => m.id === '__root__')?.loaderData as any;
     const seoSettings = rootData?.seoSettings;
     return generateMetaTags({
       title: "Compra Direta",
       description: "Venda direta de animais selecionados. Escolha seu animal e faça sua reserva.",
       seoSettings,
       canonical: "/compra-direta"
     });
   },
  loader: async () => {
    const { data: animals, error: animalsError } = await supabase
      .from("animals")
      .select("*, categories(name)")
      .eq("is_direct_sale", true)
      .order("created_at", { ascending: false });

    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (animalsError || categoriesError) {
      console.error("Error loading data:", animalsError || categoriesError);
      throw animalsError || categoriesError;
    }

    return { animals: animals || [], categories: categories || [] };
  },
  component: DirectSalePage,
  pendingComponent: PageSkeleton,
});

function DirectSalePage() {
  const { animals, categories } = Route.useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  
  const [buyerInfo, setBuyerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const filteredAnimals = useMemo(() => {
    return animals.filter((animal: any) => {
      const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || animal.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [animals, searchTerm, categoryFilter]);

  const handlePurchase = (animal: any) => {
    setSelectedAnimal(animal);
    setIsCheckoutOpen(true);
  };


  const confirmPurchase = async () => {
    if (!buyerInfo.name || !buyerInfo.email || !buyerInfo.phone) {
      toast.error("Por favor, preencha todas as informações de contato.");
      return;
    }

    try {
      const { error } = await supabase.from("direct_sales").insert({
        animal_id: selectedAnimal.id,
        buyer_name: buyerInfo.name,
        buyer_email: buyerInfo.email,
        buyer_phone: buyerInfo.phone,
        total_price: selectedAnimal.sale_price,
        status: "pending",
        shipping_details: { address: buyerInfo.address }
      });

      if (error) throw error;

      toast.success("Solicitação de compra enviada com sucesso! Entraremos em contato em breve para combinar a entrega.");
      setIsCheckoutOpen(false);
      setBuyerInfo({ name: "", email: "", phone: "", address: "" });
    } catch (error: any) {
      toast.error("Erro ao processar compra: " + error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient shadow-gold">
            <ShoppingCart className="h-6 w-6 text-emerald-deep" />
          </span>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-gradient-gold">Catálogo de Venda</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Venda direta de animais selecionados. Escolha seu animal e faça sua reserva de forma rápida e segura.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou raça..." 
            className="pl-10 h-12 bg-background/50 border-border/50 focus:border-gold/50 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gold" />
                <SelectValue placeholder="Todas Categorias" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAnimals.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-card/30 rounded-3xl border border-dashed border-border">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Nenhum animal disponível para venda direta no momento.</p>
          </div>
        ) : (
          filteredAnimals.map((animal: any) => (
            <Card key={animal.id} className="group overflow-hidden border-border/50 bg-card/30 hover:bg-card/50 transition-all duration-300 hover:shadow-xl hover:shadow-gold/5 rounded-2xl flex flex-col h-full">
              <div className="relative aspect-[4/3] overflow-hidden">
                {animal.photos && animal.photos.length > 0 ? (
                  <OptimizedImage 
                    src={animal.photos[0]} 
                    alt={animal.name} 
                    width={400}
                    aspectRatio="landscape"
                    className="group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground opacity-20" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white font-medium">
                    {animal.categories?.name || animal.species}
                  </Badge>
                  {animal.sale_status !== 'available' && (
                    <Badge variant="destructive" className="uppercase font-bold">
                      {animal.sale_status === 'reserved' ? 'Reservado' : 'Vendido'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardHeader className="p-5 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gold uppercase tracking-wider mb-1">{animal.breed}</p>
                    <CardTitle className="text-xl group-hover:text-gold transition-colors">{animal.name}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="text-xs font-medium">{animal.location || "N/A"}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-5 pt-0 flex-1">
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Sexo</p>
                    <p className="font-semibold">{animal.sex === 'M' ? 'Macho' : 'Fêmea'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Idade</p>
                    <p className="font-semibold">{animal.birth_date ? new Date().getFullYear() - new Date(animal.birth_date).getFullYear() + ' anos' : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-5 pt-0 mt-auto flex flex-col gap-3">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs text-muted-foreground">Preço à vista</p>
                    <p className="text-2xl font-black text-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(animal.sale_price || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="border-gold text-gold hover:bg-gold hover:text-emerald-deep font-bold h-12 rounded-xl disabled:opacity-50"
                    onClick={() => handleMakeOffer(animal)}
                    disabled={animal.sale_status !== 'available'}
                  >
                    Fazer Oferta
                  </Button>
                  <Button 
                    className="bg-gold-gradient text-emerald-deep font-bold h-12 rounded-xl shadow-gold hover:opacity-90 disabled:opacity-50 disabled:grayscale"
                    onClick={() => handlePurchase(animal)}
                    disabled={animal.sale_status !== 'available'}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Comprar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsCheckoutOfferOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-gold/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-gold" />
              Enviar Proposta
            </DialogTitle>
            <DialogDescription>
              Faça uma oferta de valor para o animal <strong>{selectedAnimal?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="offer_amount">Valor da Oferta (R$)</Label>
              <Input 
                id="offer_amount" 
                type="number"
                placeholder="0,00" 
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="text-xl font-bold text-emerald-deep"
              />
              <p className="text-[10px] text-muted-foreground italic">
                Preço sugerido: {selectedAnimal && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAnimal.sale_price)}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="offer_message">Mensagem Adicional (Opcional)</Label>
              <textarea 
                id="offer_message"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Condições de pagamento, frete, etc..."
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between items-center gap-4">
            <Button variant="ghost" onClick={() => setIsCheckoutOfferOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-gold text-emerald-deep font-bold px-8 rounded-xl shadow-gold h-12"
              onClick={submitOffer}
              disabled={isSubmittingOffer}
            >
              {isSubmittingOffer ? "Enviando..." : "Enviar Proposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-gold/20 shadow-2xl shadow-gold/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-gold" />
              Reserva de Animal
            </DialogTitle>
            <DialogDescription>
              Você está solicitando a compra de <strong>{selectedAnimal?.name}</strong>.
              Preencha seus dados para que nossa equipe entre em contato.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="buyer_name">Nome Completo</Label>
              <Input 
                id="buyer_name" 
                placeholder="Seu nome" 
                value={buyerInfo.name}
                onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="buyer_email">E-mail</Label>
                <Input 
                  id="buyer_email" 
                  type="email" 
                  placeholder="exemplo@email.com" 
                  value={buyerInfo.email}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="buyer_phone">WhatsApp / Telefone</Label>
                <Input 
                  id="buyer_phone" 
                  placeholder="(00) 00000-0000" 
                  value={buyerInfo.phone}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer_address">Endereço de Entrega (Opcional)</Label>
              <textarea 
                id="buyer_address"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Cidade - UF e detalhes para cotação de frete..."
                value={buyerInfo.address}
                onChange={(e) => setBuyerInfo({ ...buyerInfo, address: e.target.value })}
              />
            </div>
            
            <div className="bg-muted/50 p-4 rounded-2xl border border-border/50">
              <div className="flex justify-between items-center font-bold">
                <span>Total a Pagar:</span>
                <span className="text-xl text-gold">
                  {selectedAnimal && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAnimal.sale_price || 0)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                * O valor do frete será calculado após a confirmação do interesse.
              </p>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between items-center gap-4">
            <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)} className="rounded-xl">
              Voltar
            </Button>
            <Button 
              className="bg-gold-gradient text-emerald-deep font-bold px-8 rounded-xl shadow-gold h-12"
              onClick={confirmPurchase}
            >
              Confirmar Interesse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}