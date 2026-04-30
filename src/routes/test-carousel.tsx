 import { createFileRoute } from "@tanstack/react-router";
 import { LotCard } from "@/components/auctions/lot-card";
 import { lots } from "@/lib/mock-data";
 
 export const Route = createFileRoute("/test-carousel")({
   component: TestCarouselPage,
 });
 
 function TestCarouselPage() {
   // Use the lots from mock data which we updated with multiple photos
   const testLots = lots.filter(l => l.photos && l.photos.length > 1);
   
   return (
     <div className="container mx-auto px-4 py-12">
       <h1 className="text-3xl font-bold mb-8">Teste do Carrossel no Card do Lote</h1>
       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
         {testLots.map(lot => (
           <div key={lot.id} className="h-[500px]">
             <LotCard lot={lot as any} />
           </div>
         ))}
       </div>
 
       <div className="mt-12">
         <h2 className="text-2xl font-bold mb-4">Lote com Vídeo</h2>
         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {lots.filter(l => l.youtube_url).map(lot => (
             <div key={lot.id} className="h-[500px]">
               <LotCard 
                 lot={lot as any} 
                 settings={{ media_mode: 'video', displayed_fields: [] }} 
               />
             </div>
           ))}
         </div>
       </div>
     </div>
   );
 }