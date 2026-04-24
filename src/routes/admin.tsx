import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      <p className="mt-4 text-muted-foreground">
        Bem-vindo ao painel de administração. Em breve, você poderá gerenciar eventos, lotes e usuários aqui.
      </p>
    </div>
  );
}
