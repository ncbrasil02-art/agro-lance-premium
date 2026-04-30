 import { createFileRoute } from "@tanstack/react-router";
 import { LotCard } from "@/components/auctions/lot-card";
 import { lots } from "@/lib/mock-data";
 
 export const Route = createFileRoute("/test-carousel")({
   component: TestCarouselPage,
 });
 
 function TestCarouselPage() {
   return (
     <div style={{ backgroundColor: 'red', color: 'white', padding: '100px', fontSize: '50px' }}>
       TESTE DE ROTA
     </div>
   );
 }