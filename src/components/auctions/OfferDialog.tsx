import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { MessageSquare, DollarSign, Loader2, TrendingUp, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";

interface OfferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    name: string;
    price: number;
    type: 'lot' | 'animal';
  } | null;
}

export function OfferDialog({ isOpen, onOpenChange, item }: OfferDialogProps) {
   const [amount, setAmount] = useState<string>("");
   const [amountError, setAmountError] = useState(false);
   const [installments, setInstallments] = useState<string>("30");
   const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const offerAmount = parseFloat(amount);
    
    if (!item) return;

    if (isNaN(offerAmount) || offerAmount <= 0) {
      setAmountError(true);
      toast.error("Por favor, insira um valor válido para a proposta.");
      return;
    }

    setAmountError(false);

    if (item.price > 0 && offerAmount < item.price * 0.1) {
      toast.error("Valor da proposta muito baixo em relação ao valor de referência.");
      return;
    }

    if (message.length > 500) {
      toast.error("A observação é muito longa (máximo 500 caracteres).");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para enviar uma proposta.");
        return;
      }

       const finalMessage = `Proposta de ${formatBRL(offerAmount)} em ${installments === "1" ? "À Vista" : installments + "x"}. ${message}`.trim();

       const offerData: any = {
         user_id: user.id,
         amount: offerAmount,
         description: finalMessage,
         status: "pending"
       };

      if (item.type === 'lot') {
        offerData.lot_id = item.id;
      } else {
        offerData.animal_id = item.id;
      }

       const { data: newOffer, error } = await supabase.from("offers").insert(offerData).select().single();
       if (!error && newOffer) {
         // Notify admin
         const { data: adminProfiles } = await supabase
           .from("profiles")
           .select("id")
           .eq("role", "admin");

         if (adminProfiles && adminProfiles.length > 0) {
           const adminNotifications = adminProfiles.map(admin => ({
             user_id: admin.id,
             title: "Nova Proposta Recebida",
             message: `Uma nova proposta de ${formatBRL(offerAmount)} foi feita por ${user.email?.split('@')[0]} para ${item.name}.`,
             link: "/admin"
           }));

           await supabase.from("notifications").insert(adminNotifications);
         }
       }


      if (error) throw error;

      toast.success("Proposta enviada com sucesso! O vendedor será notificado.");
      onOpenChange(false);
      setAmount("");
      setMessage("");
    } catch (error: any) {
      toast.error("Erro ao enviar proposta: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl border-gold/20 bg-emerald-deep text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic text-gold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-gold" />
            Enviar Proposta
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Faça uma oferta de valor para <strong>{item?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="offer_amount" className="text-[10px] font-black uppercase tracking-widest text-gold/60">Valor Total da Proposta</Label>
              <span className="text-[10px] text-white/40 italic">Ref: {item && formatBRL(item.price)}</span>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
              <Input 
                id="offer_amount" 
                type="number"
                placeholder="0,00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 pl-10 bg-white/5 border-white/10 text-xl font-bold text-white focus:ring-gold"
              />
            </div>
            
            <div className="flex gap-2 mt-1">
              {[0, 0.05, 0.10].map((percent) => {
                const quickVal = item ? Math.round(item.price * (1 + percent)) : 0;
                return (
                  <Button 
                    key={percent}
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-8 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-gold hover:text-emerald-deep"
                    onClick={() => setAmount(quickVal.toString())}
                  >
                    {percent === 0 ? "Valor Atual" : `+${percent * 100}%`}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gold/60">Forma de Pagamento / Parcelas</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "À Vista", value: "1" },
                { label: "15x", value: "15" },
                { label: "30x", value: "30" }
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={installments === opt.value ? "default" : "outline"}
                  className={`h-10 text-xs font-bold ${installments === opt.value ? "bg-gold text-emerald-deep" : "border-white/10 bg-white/5 text-white"}`}
                  onClick={() => setInstallments(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {amount && parseFloat(amount) > 0 && installments !== "1" && (
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {installments}x de {formatBRL(parseFloat(amount) / parseInt(installments))}
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="offer_message" className="text-[10px] font-black uppercase tracking-widest text-gold/60">Observações (Opcional)</Label>
            <Textarea 
              id="offer_message"
              className="flex min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/20 text-sm"
              placeholder="Ex: Frete por minha conta, permuta em outros animais..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between items-center gap-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/60 hover:text-white hover:bg-white/5">
            Cancelar
          </Button>
          <Button 
            className="bg-gold text-emerald-deep font-black uppercase italic px-8 h-12 rounded-xl shadow-gold hover:scale-105 transition-all"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Enviar Proposta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}