import { Link } from "@tanstack/react-router";
import { ShoppingCart, ArrowRight, MapPin, Tag, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatBRL } from "@/utils/format";
import { useState } from "react";
import { OfferDialog } from "@/components/auctions/OfferDialog";

export function HomeSaleLots({ directSales }: { directSales: any[] }) {
  const [selectedForOffer, setSelectedForOffer] = useState<any>(null);
  if (!directSales || directSales.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 relative overflow-hidden">
      {/* Background elements for "chamativo" effect */}
      <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-emerald-deep/5 blur-3xl" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <ShoppingCart className="h-3.5 w-3.5" /> 
            Oportunidades Únicas
          </div>
          <h2 className="text-4xl font-black text-foreground uppercase italic tracking-tighter md:text-5xl">
            Venda <span className="text-gradient-gold">Direta</span> de Elite
          </h2>
          <p className="text-muted-foreground max-w-xl text-lg font-medium leading-relaxed">
            Garanta animais selecionados com preço fixo e genética comprovada, sem a necessidade de disputa em leilões.
          </p>
        </div>
        <Link to="/compra-direta">
          <Button variant="outline" className="border-gold/40 text-gold hover:bg-gold hover:text-emerald-deep gap-2 font-black uppercase italic text-xs tracking-widest h-14 px-8 rounded-2xl transition-all hover:scale-105 shadow-xl">
            Ver Catálogo Completo <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {directSales.map((animal: any) => (
          <Link key={animal.id} to="/compra-direta" className="group h-full">
            <Card className="overflow-hidden border-border/40 bg-card/40 hover:bg-card/60 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2.5rem] h-full flex flex-col border-b-8 border-b-gold/20 hover:border-b-gold group-hover:-translate-y-3">
              <div className="relative aspect-[4/3] overflow-hidden">
                <OptimizedImage 
                  src={animal.photos?.[0] || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"} 
                  alt={animal.name} 
                  className="group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute top-4 left-4">
                  <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1">
                    {animal.breed}
                  </Badge>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-bold uppercase tracking-wider">
                      <MapPin className="h-3 w-3 text-gold" />
                      {animal.location?.split('-')[0] || "Brasil"}
                   </div>
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold shadow-gold text-emerald-deep">
                      <Star className="h-4 w-4 fill-emerald-deep" />
                   </div>
                </div>
              </div>
              
              <CardContent className="p-6 flex-1 flex flex-col relative">
                {animal.accepts_offers && (
                  <div className="absolute -top-10 left-6">
                    <Button 
                      size="sm"
                      className="bg-emerald-bright text-white font-bold gap-1.5 rounded-full shadow-lg hover:scale-105 transition-transform h-9 px-4 border border-white/20"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedForOffer(animal);
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Fazer uma oferta
                    </Button>
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-3 w-3 text-gold" />
                    <span className="text-[9px] font-black text-gold uppercase tracking-[0.2em]">Oferta Exclusiva</span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter leading-none group-hover:text-gold transition-colors">{animal.name}</h3>
                </div>
                
                <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Valor de Venda</span>
                    <span className="text-2xl font-black text-foreground tracking-tighter">{formatBRL(animal.sale_price)}</span>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-emerald-deep transition-all duration-300 shadow-inner">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <OfferDialog 
        isOpen={!!selectedForOffer} 
        onOpenChange={(open) => !open && setSelectedForOffer(null)} 
        item={selectedForOffer ? {
          id: selectedForOffer.id,
          name: selectedForOffer.name,
          price: selectedForOffer.sale_price,
          type: 'animal'
        } : null}
      />
    </section>
  );
}