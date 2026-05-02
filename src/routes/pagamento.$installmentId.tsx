 import { createFileRoute, Link } from "@tanstack/react-router";
 import { PixPaymentStatus } from "@/components/payment/PixPaymentStatus";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { ChevronLeft, Receipt } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { PageSkeleton } from "@/components/ui/page-skeleton";
 
  export const Route = createFileRoute("/pagamento/$installmentId")({
    pendingComponent: PageSkeleton,
   component: PaymentStatusPage,
 });
 
 function PaymentStatusPage() {
   const { installmentId } = Route.useParams();
 
   return (
     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
       <Card className="w-full max-w-md bg-white shadow-xl border-none overflow-hidden">
         <CardHeader className="bg-emerald-deep text-white p-6">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" asChild>
               <Link to="/painel">
                 <ChevronLeft className="h-6 w-6" />
               </Link>
             </Button>
             <CardTitle className="text-xl flex items-center gap-2">
               <Receipt className="h-6 w-6 text-gold" />
               Status do Pagamento
             </CardTitle>
           </div>
         </CardHeader>
         <CardContent className="p-0">
           <PixPaymentStatus 
             installmentId={installmentId} 
             onSuccess={() => {
               toast.success("Pagamento confirmado!");
             }}
           />
         </CardContent>
       </Card>
     </div>
   );
 }
 
 import { toast } from "sonner";