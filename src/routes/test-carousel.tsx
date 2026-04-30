 import { createFileRoute } from "@tanstack/react-router";
 import { LotCard } from "@/components/auctions/lot-card";
 import { lots } from "@/lib/mock-data";
 
 export const Route = createFileRoute("/test-carousel")({
   component: TestCarouselPage,
 });
 
 function TestCarouselPage() {
   console.log("Lots from mock data:", lots);
   const testLots = lots.filter(l => l.photos && l.photos.length > 1);
   console.log("Filtered test lots:", testLots);
 
   return (
     <div className="container mx-auto px-4 py-12">
       <h1 className="text-3xl font-bold mb-8">Teste do Carrossel</h1>
       {testLots.length === 0 ? (
         <p>Nenhum lote com múltiplas fotos encontrado.</p>
       ) : (
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {testLots.map(lot => (
             <div key={lot.id} className="min-h-[600px] border p-2">
               <LotCard 
                 lot={lot as any} 
                 settings={{ 
                   media_mode: 'gallery', 
                   displayed_fields: [
                     { key: "father", label: "Pai", enabled: true },
                     { key: "mother", label: "Mãe", enabled: true },
                     { key: "sex", label: "Sexo", enabled: true }
                   ] 
                 }} 
               />
             </div>
           ))}
         </div>
       )}
 
       <div className="mt-12">
         <h2 className="text-2xl font-bold mb-4">Teste de Vídeo</h2>
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {lots.filter(l => l.youtube_url).map(lot => (
             <div key={lot.id} className="min-h-[600px] border p-2">
               <LotCard 
                 lot={lot as any} 
                 settings={{ 
                   media_mode: 'video', 
                   displayed_fields: [
                     { key: "seller", label: "Vendedor", enabled: true }
                   ] 
                 }} 
               />
             </div>
           ))}
         </div>
       </div>
     </div>
   );
 }