 import { createFileRoute } from "@tanstack/react-router";
 import { LotCard } from "@/components/auctions/lot-card";
 import { lots } from "@/lib/mock-data";
 
 export const Route = createFileRoute("/test-carousel")({
   component: TestCarouselPage,
 });
 
 function TestCarouselPage() {
   return (
     <div className="flex flex-col items-center justify-center py-20 bg-red-500">
       <h1 className="text-6xl font-black text-white">FUNCIONAL!</h1>
       <p className="text-white text-2xl">A ROTA DE TESTE ESTÁ SENDO EXIBIDA.</p>
       <div className="mt-10 p-10 bg-white rounded-3xl shadow-xl">
         <div className="w-[400px] h-[600px]">
           <LotCard 
             lot={lots[0] as any} 
             settings={{ media_mode: 'gallery', displayed_fields: [] }} 
           />
         </div>
       </div>
     </div>
   );
 }