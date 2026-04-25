 import { useState, ReactNode } from "react";
 import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
 import { useAuth } from "@/components/auth/auth-provider";
 import { Loader2, LayoutDashboard, Calendar, Gavel, Users, Settings, LogOut, Package, Zap, Menu, ExternalLink } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { Button } from "@/components/ui/button";
 import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
 import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

 import { EventManagement } from "@/components/admin/EventManagement";
 import { LotManagement } from "@/components/admin/LotManagement";
 import { AnimalManagement } from "@/components/admin/AnimalManagement";
 
 type AdminTab = "dashboard" | "events" | "lots" | "animals" | "users" | "settings";
 
 interface SidebarProps {
   activeTab: AdminTab;
   setActiveTab: (tab: AdminTab) => void;
   signOut: () => void;
   onItemClick?: () => void;
 }
 
 function AdminSidebar({ activeTab, setActiveTab, signOut, onItemClick }: SidebarProps) {
   const menuItems: { id: AdminTab; label: string; icon: ReactNode }[] = [
     { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
     { id: "events", label: "Eventos", icon: <Calendar className="mr-2 h-4 w-4" /> },
     { id: "lots", label: "Lotes", icon: <Gavel className="mr-2 h-4 w-4" /> },
     { id: "animals", label: "Animais", icon: <Package className="mr-2 h-4 w-4" /> },
     { id: "users", label: "Usuários", icon: <Users className="mr-2 h-4 w-4" /> },
     { id: "settings", label: "Configurações", icon: <Settings className="mr-2 h-4 w-4" /> },
   ];
 
   return (
     <div className="flex h-full flex-col py-4">
       <div className="mb-8 flex items-center gap-2 px-2 font-bold text-xl text-gold">
         <Gavel className="h-6 w-6" />
         <span>Elite Admin</span>
       </div>
       <nav className="flex-1 space-y-2">
         {menuItems.map((item) => (
           <Button 
             key={item.id}
             variant="ghost" 
             className={`w-full justify-start ${activeTab === item.id ? "text-gold bg-gold/5" : ""}`}
             onClick={() => {
               setActiveTab(item.id);
               onItemClick?.();
             }}
           >
             {item.icon} {item.label}
           </Button>
         ))}
       </nav>
       <div className="pt-4 border-t">
         <Link to="/">
           <Button variant="ghost" className="w-full justify-start gap-2">
             <ExternalLink className="h-4 w-4" /> Ver Site
           </Button>
         </Link>
         <Button 
           variant="ghost" 
           className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
           onClick={signOut}
         >
           <LogOut className="mr-2 h-4 w-4" /> Sair
         </Button>
       </div>
     </div>
   );
 }
 
function AdminLayout() {
   const { profile, isLoading, signOut } = useAuth();
   const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
   const [selectedEventId, setSelectedEventId] = useState<string>("all");

   const handleManageLots = (eventId: string) => {
     setSelectedEventId(eventId);
     setActiveTab("lots");
   };

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30 flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
        <div className="flex items-center gap-2 font-bold text-lg text-gold">
          <Gavel className="h-5 w-5" />
          <span>Elite Admin</span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <AdminSidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              signOut={signOut} 
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r bg-card p-6 hidden md:block">
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          signOut={signOut} 
        />
      </aside>

      <main className="flex-1 p-4 md:p-8 pb-16">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground md:text-base">Bem-vindo de volta, {profile?.full_name}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link to="/">Ver Site</Link>
          </Button>
        </header>

          {activeTab === "dashboard" && (
            <>
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
                   <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Button className="w-full bg-gold hover:bg-gold/90 text-emerald-deep" onClick={() => setActiveTab("events")}>
                        <Calendar className="mr-2 h-4 w-4" /> Gerenciar Eventos
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("animals")}>
                        <Package className="mr-2 h-4 w-4" /> Cadastrar Animais
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("lots")}>
                        <Gavel className="mr-2 h-4 w-4" /> Alocar Lotes
                      </Button>
                     <Button 
                       variant="outline" 
                       className="w-full"
                       onClick={async () => {
                         const { data: lot } = await supabase.from("lots").select("id, current_price, starting_price, bid_increment").eq("status", "active").limit(1).single();
                         if (!lot) {
                           toast.error("Nenhum lote ativo encontrado para simular lance.");
                           return;
                         }
                         const bidAmount = (lot.current_price || lot.starting_price) + lot.bid_increment;
                         const { error } = await supabase.from("bids").insert({
                           lot_id: lot.id,
                           user_id: profile?.id,
                           amount: bidAmount,
                           bid_type: "online"
                         });
                         if (error) toast.error("Erro ao simular lance: " + error.message);
                         else toast.success(`Lance simulado de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bidAmount)}!`);
                       }}
                     >
                       <Zap className="mr-2 h-4 w-4" /> Simular Lance Rápido
                     </Button>
                     <Button variant="outline" className="w-full" onClick={() => setActiveTab("settings")}>Configurações</Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === "events" && <EventManagement onManageLots={handleManageLots} />}
          {activeTab === "lots" && (
            <LotManagement 
              initialEventId={selectedEventId} 
              onEventChange={setSelectedEventId} 
            />
          )}
          {activeTab === "animals" && <AnimalManagement />}
          {activeTab === "users" && (
            <Card>
              <CardHeader><CardTitle>Usuários</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground">Módulo de gestão de usuários em desenvolvimento.</p></CardContent>
            </Card>
          )}
           {activeTab === "settings" && (
             <Card>
               <CardHeader><CardTitle>Configurações</CardTitle></CardHeader>
               <CardContent>
                 <p className="text-muted-foreground">Configurações da plataforma em desenvolvimento.</p>
                 <div className="mt-8 pt-8 border-t text-[10px] text-muted-foreground">
                   <p>Debug Info:</p>
                   <p>User ID: {profile?.id}</p>
                   <p>Role: {profile?.role}</p>
                   <p>Environment: {import.meta.env.MODE}</p>
                 </div>
               </CardContent>
             </Card>
           )}
       </main>
     </div>
   );
}
