import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Premium Agro Leilões" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user && !isAuthLoading) {
      console.log("Usuário já está logado, redirecionando...");
      navigate({ to: "/" });
    }
  }, [user, isAuthLoading, navigate]);

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Por favor, digite seu e-mail primeiro.");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success("E-mail de recuperação enviado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar e-mail");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentativa de login iniciada para:", email.trim());
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Erro no login do Supabase:", error);
        throw error;
      }

      console.log("Login realizado com sucesso no Supabase para:", email.trim());
      toast.success("Login realizado com sucesso!");
      navigate({ to: "/" });
    } catch (error: any) {
      console.error("Erro capturado no handleSubmit:", error);
      // Traduzir mensagens comuns
      let message = error.message;
      if (message === "Invalid login credentials") {
        message = "E-mail ou senha incorretos.";
      } else if (message === "Email not confirmed") {
        message = "Por favor, confirme seu e-mail antes de entrar.";
      }
      toast.error(message || "Erro ao entrar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta para participar dos leilões.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="voce@exemplo.com" 
              className="mt-1.5" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
            <Button 
              type="button" 
              variant="link" 
              className="w-full text-xs text-muted-foreground"
              onClick={handleResetPassword}
            >
              Esqueceu a senha?
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Novo por aqui? <Link to="/cadastro" className="text-gold hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
