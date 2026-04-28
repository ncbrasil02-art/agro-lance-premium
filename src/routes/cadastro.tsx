import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormSkeleton } from "@/components/ui/form-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
 import { useState } from "react";
 import { maskCPF, maskPhone } from "@/utils/masks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastre-se — Premium Agro Leilões" }] }),
  component: SignupPage,
  pendingComponent: FormSkeleton,
});

function SignupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    address: "",
    cep: "",
    nationality: "Brasileira",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            cpf: formData.cpf,
            phone: formData.phone,
            address: formData.address,
            cep: formData.cep,
            nationality: formData.nationality,
          },
        },
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso!", {
        description: "Você receberá um e-mail de confirmação. Lembre-se que sua conta passará por uma aprovação manual por nossa equipe para que você possa dar lances.",
        duration: 8000,
      });
      navigate({ to: "/login" });
    } catch (error: any) {
      let message = error.message;
      if (message === "User already registered") {
        message = "Este e-mail já está cadastrado em nossa plataforma. Tente fazer login ou recuperar sua senha.";
      }
      
      toast.error("Erro ao criar conta", {
        description: message || "Verifique se todos os campos estão corretos e tente novamente.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre-se para participar. Aprovação manual em até 24h.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input 
              id="name" 
              placeholder="João da Silva" 
              className="mt-1.5" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF</Label>
               <Input 
                 id="cpf" 
                 placeholder="000.000.000-00" 
                 className="mt-1.5 text-sm" 
                 value={formData.cpf}
                 onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                 required
                 maxLength={14}
               />
            </div>
            <div>
              <Label htmlFor="phone">Celular (WhatsApp)</Label>
               <Input 
                 id="phone" 
                 placeholder="(00) 00000-0000" 
                 className="mt-1.5 text-sm" 
                 value={formData.phone}
                 onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                 required
                 maxLength={15}
               />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input 
                id="address" 
                placeholder="Rua, nº, Bairro..." 
                className="mt-1.5 text-sm" 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input 
                id="cep" 
                placeholder="00000-000" 
                className="mt-1.5 text-sm" 
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="voce@exemplo.com" 
              className="mt-1.5" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="mt-1.5" 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Criar conta
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="text-gold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
