 import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
 import { useAuth } from "@/components/auth/auth-provider";
 import { Loader2, LayoutDashboard, Calendar, Gavel, Users, Settings, LogOut } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
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
     <div className="flex min-h-screen bg-muted/30">
       {/* Sidebar Sidebar */}
       <aside className="w-64 border-r bg-card p-6 hidden md:block">
         <div className="mb-8 flex items-center gap-2 font-bold text-xl text-gold">
           <Gavel className="h-6 w-6" />
           <span>Elite Admin</span>
         </div>
         <nav className="space-y-2">
           <Button variant="ghost" className="w-full justify-start text-gold bg-gold/5">
             <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
           </Button>
           <Button variant="ghost" className="w-full justify-start">
             <Calendar className="mr-2 h-4 w-4" /> Eventos
           </Button>
           <Button variant="ghost" className="w-full justify-start">
             <Gavel className="mr-2 h-4 w-4" /> Lotes
           </Button>
           <Button variant="ghost" className="w-full justify-start">
             <Users className="mr-2 h-4 w-4" /> Usuários
           </Button>
           <Button variant="ghost" className="w-full justify-start">
             <Settings className="mr-2 h-4 w-4" /> Configurações
           </Button>
         </nav>
       </aside>
 
       <main className="flex-1 p-8">
         <header className="mb-8 flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold">Painel Administrativo</h1>
             <p className="text-muted-foreground">Bem-vindo de volta, {profile?.full_name}</p>
           </div>
           <Button variant="outline" asChild>
             <Link to="/">Ver Site</Link>
           </Button>
         </header>
 
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Total de Lances</CardTitle>
               <Gavel className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">124</div>
               <p className="text-xs text-muted-foreground">+12% desde ontem</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Novos Usuários</CardTitle>
               <Users className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">+12</div>
               <p className="text-xs text-muted-foreground">8 aguardando aprovação</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Leilões Ativos</CardTitle>
               <Calendar className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">2</div>
               <p className="text-xs text-muted-foreground">Elite 2024, Fazenda Real</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Lotes Arrematados</CardTitle>
               <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">48</div>
               <p className="text-xs text-muted-foreground">Total R$ 1.2M</p>
             </CardContent>
           </Card>
         </div>
 
         <div className="mt-8">
           <Card>
             <CardHeader>
               <CardTitle>Ações Rápidas</CardTitle>
               <CardDescription>Gerencie o conteúdo principal do seu leilão.</CardDescription>
             </CardHeader>
             <CardContent className="grid gap-4 md:grid-cols-3">
               <Button className="w-full bg-gold hover:bg-gold/90 text-emerald-deep">Criar Novo Evento</Button>
               <Button variant="outline" className="w-full">Gerenciar Usuários</Button>
               <Button variant="outline" className="w-full">Configurações Gerais</Button>
             </CardContent>
           </Card>
         </div>
       </main>
     </div>
   );
}
