 import { useState, useEffect, ReactNode } from "react";
 import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
 import { SiteSettings } from "@/components/admin/SiteSettings";
 import { EventManagement } from "@/components/admin/EventManagement";
 import { LotManagement } from "@/components/admin/LotManagement";
 import { AnimalManagement } from "@/components/admin/AnimalManagement";
 import { SellerManagement } from "@/components/admin/SellerManagement";
 import { CategoryManagement } from "@/components/admin/CategoryManagement";
 import { EventRequestManagement } from "@/components/admin/EventRequestManagement";
 import { DirectSaleManagement } from "@/components/admin/DirectSaleManagement";
 import { UserManagement } from "@/components/admin/UserManagement";
 import { BidSecurityAudit } from "@/components/admin/BidSecurityAudit";
 import { PostManagement } from "@/components/admin/PostManagement";
 import { RLSSecurityTests } from "@/components/admin/RLSSecurityTests";
 import { SystemLogs } from "@/components/admin/SystemLogs";
 import { LiveAuctionControl } from "@/components/admin/LiveAuctionControl";
  import { AuditLogManagement } from "@/components/admin/AuditLogManagement";
  import { OfferManagement } from "@/components/admin/OfferManagement";
  import { ContractManagement } from "@/components/admin/ContractManagement";
  import { TransactionManagement } from "@/components/admin/TransactionManagement";
 import { InstallmentManagement } from "@/components/admin/InstallmentManagement";
import { SecurityAlertsBanner } from "@/components/admin/SecurityAlertsBanner";
import { SecurityAlerts } from "@/components/admin/SecurityAlerts";
  import { 
    Loader2, LayoutDashboard, Calendar, Gavel, Users, Settings,
     LogOut, Package, Zap, Menu, ExternalLink, Building2, Tag,
     ClipboardList, ShoppingCart, ShieldCheck, ShieldAlert, Newspaper, Info,
    MessageSquare, FileText
 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { useAuth } from "@/components/auth/auth-provider";
 import { Button } from "@/components/ui/button";
 import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
 import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
 
  type AdminTab = "dashboard" | "live" | "events" | "lots" | "animals" | "sellers" | "categories" | "event_requests" | "direct_sales" | "offers" | "contracts" | "users" | "security" | "rls_test" | "logs" | "audit" | "settings" | "posts" | "transactions" | "installments" | "alertas";
 
 const menuItems: { id: AdminTab; label: string; icon: ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { id: "alertas", label: "Central de Alertas", icon: <ShieldAlert className="mr-2 h-4 w-4 text-red-600" /> },
   { id: "live", label: "Leilão ao Vivo", icon: <Zap className="mr-2 h-4 w-4" /> },
   { id: "events", label: "Eventos", icon: <Calendar className="mr-2 h-4 w-4" /> },
   { id: "lots", label: "Lotes", icon: <Gavel className="mr-2 h-4 w-4" /> },
   { id: "animals", label: "Animais", icon: <Package className="mr-2 h-4 w-4" /> },
   { id: "categories", label: "Categorias", icon: <Tag className="mr-2 h-4 w-4" /> },
   { id: "event_requests", label: "Pedidos de Evento", icon: <ClipboardList className="mr-2 h-4 w-4" /> },
    { id: "direct_sales", label: "Vendas Diretas", icon: <ShoppingCart className="mr-2 h-4 w-4" /> },
    { id: "offers", label: "Ofertas/Propostas", icon: <MessageSquare className="mr-2 h-4 w-4" /> },
     { id: "contracts", label: "Contratos/Assinaturas", icon: <FileText className="mr-2 h-4 w-4" /> },
      { id: "installments", label: "Boletas (Carnê)", icon: <FileText className="mr-2 h-4 w-4" /> },
     { id: "transactions", label: "Transações", icon: <ShoppingCart className="mr-2 h-4 w-4" /> },
    { id: "sellers", label: "Vendedores", icon: <Building2 className="mr-2 h-4 w-4" /> },
   { id: "users", label: "Usuários", icon: <Users className="mr-2 h-4 w-4" /> },
   { id: "posts", label: "Notícias", icon: <Newspaper className="mr-2 h-4 w-4" /> },
   { id: "security", label: "Segurança", icon: <ShieldCheck className="mr-2 h-4 w-4" /> },
   { id: "rls_test", label: "Testes RLS", icon: <ShieldCheck className="mr-2 h-4 w-4" /> },
  { id: "audit", label: "Auditoria Completa", icon: <ClipboardList className="mr-2 h-4 w-4" /> },
   { id: "logs", label: "Logs de Erro", icon: <ClipboardList className="mr-2 h-4 w-4" /> },
   { id: "settings", label: "Configurações", icon: <Settings className="mr-2 h-4 w-4" /> }
 ];
 
 export const Route = createFileRoute("/admin")({
   component: AdminLayout,
 });
 
 interface SidebarProps {
   activeTab: AdminTab;
   setActiveTab: (tab: AdminTab) => void;
   signOut: () => void;
   onItemClick?: () => void;
 }
 
  function AdminSidebar({ activeTab, setActiveTab, signOut, onItemClick }: SidebarProps) {
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
     const [isMounted, setIsMounted] = useState(false);
     const { profile, isLoading: authLoading, signOut } = useAuth();
      const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
      const [settingsTab, setSettingsTab] = useState("geral");
     const [selectedEventId, setSelectedEventId] = useState<string>("all");
     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [stats, setStats] = useState({
      totalBids: 0,
      pendingUsers: 0,
      activeEvents: 0,
      soldTotal: 0
    });
     const [isLoadingStats, setIsLoadingStats] = useState(false);
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const [bidsRes, usersRes, eventsRes] = await Promise.all([
          supabase.from("bids").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_approved", false),
          supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "active")
        ]);
 
        setStats({
          totalBids: bidsRes.count || 0,
          pendingUsers: usersRes.count || 0,
          activeEvents: eventsRes.count || 0,
          soldTotal: 0 // Simplificado para este exemplo
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };
 
      useEffect(() => {
        setIsMounted(true);
        if (activeTab === "dashboard") {
          fetchStats();
        }
      }, [activeTab]);

   const handleManageLots = (eventId: string) => {
     setSelectedEventId(eventId);
     setActiveTab("lots");
   };

  if (!isMounted) return null;
  
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-gold" />
          <p className="text-sm font-bold uppercase tracking-widest text-gold animate-pulse">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShieldCheck className="mx-auto h-16 w-16 text-gold mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
          <p className="mt-2 text-muted-foreground">
            Você não tem permissão para acessar esta área. Se você é um administrador, certifique-se de estar logado com a conta correta.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/login">
              <Button className="w-full bg-gold text-emerald-deep font-bold">Ir para Login</Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="w-full">Voltar ao Início</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

       <main className="flex-1 p-4 md:p-8 pb-16 overflow-y-auto">
         <SecurityAlertsBanner />
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
                     <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats.totalBids}</div>
                     <p className="text-xs text-muted-foreground">Total acumulado</p>
                   </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Novos Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats.pendingUsers}</div>
                     <p className="text-xs text-muted-foreground">aguardando aprovação</p>
                   </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leilões Ativos</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{isLoadingStats ? "..." : stats.activeEvents}</div>
                     <p className="text-xs text-muted-foreground">em andamento</p>
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
                       <Button variant="outline" className="w-full border-gold/30" onClick={() => setActiveTab("posts")}>
                         <Newspaper className="mr-2 h-4 w-4 text-gold" /> Criar Artigos
                       </Button>
                       <Button 
                         variant="outline" 
                         className="w-full border-gold/30" 
                         onClick={() => {
                           setSettingsTab("content");
                           setActiveTab("settings");
                         }}
                       >
                         <Info className="mr-2 h-4 w-4 text-gold" /> Gerenciar Pág. Sobre
                       </Button>
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
                        className="w-full border-gold/50 text-gold hover:bg-gold/10"
                        onClick={async () => {
                          const { data: lot } = await supabase.from("lots").select("id, current_price, starting_price, bid_increment").eq("status", "active").limit(1).single();
                          if (!lot) {
                            toast.error("Nenhum lote ativo encontrado para lance de segurança.");
                            return;
                          }
                          const bidAmount = (lot.current_price || lot.starting_price) + lot.bid_increment;
                          const { error } = await supabase.from("bids").insert({
                            lot_id: lot.id,
                            user_id: profile?.id,
                            amount: bidAmount,
                            bid_type: "online"
                          });
                          if (error) toast.error("Erro ao efetuar lance: " + error.message);
                          else toast.success(`Lance de Segurança efetuado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bidAmount)}!`);
                        }}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" /> Lance de Segurança
                      </Button>
                     <Button variant="outline" className="w-full" onClick={() => setActiveTab("settings")}>Configurações</Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === "live" && <LiveAuctionControl />}
          {activeTab === "events" && <EventManagement onManageLots={handleManageLots} />}
          {activeTab === "lots" && (
            <LotManagement 
              initialEventId={selectedEventId} 
              onEventChange={setSelectedEventId} 
            />
          )}
          {activeTab === "animals" && <AnimalManagement />}
          {activeTab === "categories" && <CategoryManagement />}
           {activeTab === "event_requests" && <EventRequestManagement />}
            {activeTab === "direct_sales" && <DirectSaleManagement />}
            {activeTab === "offers" && <OfferManagement />}
            {activeTab === "contracts" && <ContractManagement />}
           {activeTab === "sellers" && <SellerManagement />}
             {activeTab === "users" && <UserManagement />}
             {activeTab === "posts" && <PostManagement />}
             {activeTab === "security" && <BidSecurityAudit />}
             {activeTab === "rls_test" && <RLSSecurityTests />}
             {activeTab === "audit" && <AuditLogManagement />}
             {activeTab === "logs" && <SystemLogs />}
                 {activeTab === "installments" && <InstallmentManagement />}
                 {activeTab === "alertas" && <SecurityAlerts />}
                {activeTab === "transactions" && <TransactionManagement />}
                {activeTab === "settings" && <SiteSettings initialTab={settingsTab} />}
       </main>
     </div>
   );
}
