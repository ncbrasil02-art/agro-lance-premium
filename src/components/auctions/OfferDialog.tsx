import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, DollarSign, Loader2 } from "lucide-react";
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
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const offerAmount = parseFloat(amount);
    if (isNaN(offerAmount) || offerAmount <= 0) {
      toast.error("Por favor, insira um valor válido para a proposta.");
      return;
    }

    if (!item) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para enviar uma proposta.");
        return;
      }

      const offerData: any = {
        user_id: user.id,
        amount: offerAmount,
        description: message || `Proposta para ${item.name}`,
        status: "pending"
      };

      if (item.type === 'lot') {
        offerData.lot_id = item.id;
      } else {
        offerData.animal_id = item.id;
      }

      const { error } = await supabase.from("offers").insert(offerData);

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
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="offer_amount" className="text-[10px] font-black uppercase tracking-widest text-gold/60">Valor da Proposta (R$)</Label>
            <Input 
              id="offer_amount" 
              type="number"
              placeholder="0,00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 bg-white/5 border-white/10 text-xl font-bold text-white focus:ring-gold"
            />
            <p className="text-[10px] text-white/40 italic">
              Valor atual/referência: {item && formatBRL(item.price)}
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="offer_message" className="text-[10px] font-black uppercase tracking-widest text-gold/60">Mensagem Adicional (Opcional)</Label>
            <Textarea 
              id="offer_message"
              className="flex min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/20"
              placeholder="Ex: Pagamento em 12x, frete por minha conta..."
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