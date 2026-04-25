import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EventRequestDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    category: "",
    location: "",
    additional_info: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) {
      toast.error("Por favor, preencha nome e WhatsApp.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("event_requests").insert([formData]);
      if (error) throw error;
      
      toast.success("Solicitação enviada com sucesso! Entraremos em contato em breve.");
      setIsOpen(false);
      setFormData({
        name: "",
        whatsapp: "",
        category: "",
        location: "",
        additional_info: "",
      });
    } catch (error: any) {
      toast.error("Erro ao enviar solicitação: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gold hover:bg-gold-bright text-emerald-deep font-bold gap-2 shadow-gold animate-pulse">
          <CalendarPlus className="h-4 w-4" />
          Solicitar Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-emerald-deep border-gold/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic text-gold">Realize seu Evento Conosco</DialogTitle>
          <DialogDescription className="text-white/60">
            Preencha os dados abaixo e nossa equipe entrará em contato para organizar seu leilão.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome / Fazenda / Empresa</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              placeholder="Como devemos lhe chamar?"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp para Contato</Label>
            <Input 
              id="whatsapp" 
              value={formData.whatsapp} 
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} 
              placeholder="(00) 00000-0000"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria do Evento</Label>
              <Input 
                id="category" 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                placeholder="Ex: Cavalos, Gado..."
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Localização</Label>
              <Input 
                id="location" 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                placeholder="Cidade - UF"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="info">Mais Informações</Label>
            <Textarea 
              id="info" 
              value={formData.additional_info} 
              onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })} 
              placeholder="Conte-nos um pouco sobre o evento que deseja realizar..."
              className="bg-white/5 border-white/10 min-h-[100px]"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gold hover:bg-gold-bright text-emerald-deep font-black uppercase italic"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}