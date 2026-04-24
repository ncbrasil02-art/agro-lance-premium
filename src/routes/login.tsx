import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Premium Agro Leilões" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta para participar dos leilões.</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="voce@exemplo.com" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold">Entrar</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Novo por aqui? <Link to="/cadastro" className="text-gold hover:underline">Cadastre-se</Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">Autenticação real será ativada com Lovable Cloud.</p>
      </div>
    </div>
  );
}
