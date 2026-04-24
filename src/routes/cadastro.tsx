import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastre-se — Premium Agro Leilões" }] }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre-se para participar. Aprovação manual em até 24h.</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="João da Silva" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="voce@exemplo.com" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold">Criar conta</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="text-gold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
