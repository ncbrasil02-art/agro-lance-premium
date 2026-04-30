 import { createFileRoute } from "@tanstack/react-router";
 import { LotCard } from "@/components/auctions/lot-card";
 import { lots } from "@/lib/mock-data";
 
 export const Route = createFileRoute("/test-carousel")({
   component: TestCarouselPage,
 });
 
 function TestCarouselPage() {
   return (
     <div className="container mx-auto px-4 py-24 text-center">
       <h1 className="text-4xl font-bold text-gold">ROTA DE TESTE FUNCIONANDO</h1>
       <p className="mt-4">Se você está vendo isso, a rota está ativa.</p>
     </div>
   );
 }