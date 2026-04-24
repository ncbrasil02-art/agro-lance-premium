import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastre-se — Premium Agro Leilões" }] }),
  component: SignupPage,
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
          },
        },
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso! Você receberá um e-mail de confirmação. Lembre-se que sua conta passará por uma aprovação manual para liberar lances.");
      navigate({ to: "/login" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
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
                className="mt-1.5" 
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Celular (WhatsApp)</Label>
              <Input 
                id="phone" 
                placeholder="(00) 00000-0000" 
                className="mt-1.5" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
