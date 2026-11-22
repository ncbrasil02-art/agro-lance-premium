import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatBRL } from "@/utils/format";

export function HomeSaleLots({ directSales }: { directSales: any[] }) {
  if (!directSales?.length) return null;
  return <section className="container mx-auto px-4 py-12">
    <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div className="min-w-0"><p className="text-sm font-semibold text-primary">Compra direta</p><h2 className="mt-1 text-2xl font-semibold md:text-3xl">Animais à venda</h2></div>
      <Button asChild variant="outline"><Link to="/compra-direta">Ver catálogo<ArrowRight /></Link></Button>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {directSales.filter(Boolean).map(animal => <article key={animal.id} className="catalog-card flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
        <Link to="/compra-direta" aria-label={`Ver ficha de ${animal.name}`} className="relative block aspect-video overflow-hidden bg-muted"><OptimizedImage src={animal.photos?.[0] || ""} alt={`${animal.name}, ${animal.breed || "animal à venda"}`} width={800} className="absolute inset-0 h-full w-full" /></Link>
        <div className="flex flex-1 flex-col p-5"><p className="text-xs text-muted-foreground">{animal.breed}</p><h3 className="mt-2 min-h-14 text-xl font-semibold leading-snug">{animal.name}</h3><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{animal.location || "Consultar localização"}</p><div className="mt-auto pt-5"><p className="text-xs text-muted-foreground">Valor de venda</p><p className="mt-1 text-2xl font-semibold">{formatBRL(Number(animal.sale_price ?? animal.direct_sale_price ?? 0))}</p><Button asChild variant="outline" className="mt-4 h-11 w-full"><Link to="/compra-direta">Ver ficha<ArrowRight className="ml-auto" /></Link></Button></div></div>
      </article>)}
    </div>
  </section>;
}
