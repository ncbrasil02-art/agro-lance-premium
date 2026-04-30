   import { useSiteSettings } from "@/hooks/useSiteSettings";
   import { useHomeRealtime } from "@/hooks/useRealtimeEvent";
   import { useRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
  import { Gavel, Menu, X, User as UserIcon, LogOut, LayoutDashboard, UserPlus, LogIn, UserCircle } from "lucide-react";
 import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useAuth } from "../auth/auth-provider";
import { NotificationBell } from "./NotificationBell";
 import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
   import { RefreshCw, Zap, ZapOff, WifiOff } from "lucide-react";

    export function Header() {
      const router = useRouter();
      const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
 
      useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
 
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
 
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }, []);
 
     const { theme } = useTheme();
    const { siteInfo, homepage, aboutPage } = useSiteSettings();
 
     const { delaySeconds, isPolling } = useHomeRealtime(() => {
       router.invalidate();
     });
 
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
 
   const nav = [
     { to: "/", label: "Início", show: true },
     { to: "/eventos", label: "Eventos", show: true },
     { to: "/compra-direta", label: "Venda Direta", show: homepage?.show_sale_menu !== false },
     { to: "/lotes", label: "Lotes", show: true },
     { to: "/ao-vivo", label: "Ao Vivo", show: true },
      { to: "/sobre", label: aboutPage?.title || "Sobre", show: aboutPage?.enabled !== false },
   ].filter(i => i.show);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold group">
          {siteInfo?.logo_url ? (
            <img src={siteInfo.logo_url} alt={siteInfo.name} className="h-10 object-contain transition-transform group-hover:scale-105" />
          ) : (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient shadow-gold">
                <Gavel className="h-5 w-5 text-emerald-deep" />
              </span>
              <span className="text-lg tracking-tight">
                <span className="text-foreground">{siteInfo?.name?.split(' ')?.[0] || "Premium"}</span>
                <span className="text-gradient-gold">{siteInfo?.name?.split(' ')?.slice(1)?.join(' ') || "Agro"}</span>
              </span>
             </>
           )}
          </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

         <div className="flex items-center gap-4">
           <TooltipProvider>
             <Tooltip>
               <TooltipTrigger asChild>
                 <div className={`hidden lg:flex items-center gap-2 cursor-help px-3 py-1.5 rounded-full bg-secondary/50 border border-border/40 transition-smooth hover:bg-secondary ${!isOnline ? 'border-destructive/40' : ''}`}>
                   {!isOnline ? (
                     <WifiOff className="h-3.5 w-3.5 text-destructive animate-pulse" />
                   ) : isPolling ? (
                     <ZapOff className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                   ) : (
                     <Zap className="h-3.5 w-3.5 text-emerald-500" />
                   )}
                   <span className={`text-[10px] font-bold uppercase tracking-wider ${!isOnline ? 'text-destructive' : isPolling ? 'text-amber-500' : 'text-emerald-500'}`}>
                     {!isOnline ? 'Offline' : isPolling ? 'Polling' : 'Realtime'}
                   </span>
                   {delaySeconds > 0 && (
                     <span className="text-[10px] font-medium text-muted-foreground border-l border-border/60 pl-2">
                       {delaySeconds}s
                     </span>
                   )}
                 </div>
               </TooltipTrigger>
               <TooltipContent side="bottom" className="text-xs max-w-xs">
                 <div className="space-y-1.5">
                   <p className="font-bold flex items-center gap-1.5">
                     {!isOnline ? <WifiOff className="h-3 w-3" /> : isPolling ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                     Status da Conexão
                   </p>
                   <p className="text-muted-foreground">
                     {!isOnline 
                       ? "Você está desconectado da internet. Algumas atualizações podem falhar."
                       : isPolling 
                         ? "Sincronizando via polling automático devido a instabilidade no WebSocket." 
                         : "Conectado via WebSocket. Recebendo atualizações instantâneas."}
                   </p>
                   {delaySeconds > 0 && (
                     <p className="pt-1 border-t border-border/40 text-[10px]">
                       Última atualização: {delaySeconds} segundos atrás
                     </p>
                   )}
                 </div>
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
 
            <div className="flex items-center gap-1.5 md:gap-2">
           {user && <NotificationBell userId={user.id} />}
 
           {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-secondary">
                      {(profile?.full_name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <Link to="/painel">
                   <DropdownMenuItem className="cursor-pointer">
                     <UserCircle className="mr-2 h-4 w-4" />
                     <span>Minha Conta</span>
                   </DropdownMenuItem>
                 </Link>
                 <DropdownMenuSeparator />
                {profile?.role === "admin" && (
                  <>
                    <Link to="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Painel Admin</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="hidden md:block">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
               <Link to="/cadastro" className="hidden md:block">
                 <Button size="sm" className="shimmer-button text-emerald-deep hover:opacity-90 shadow-gold animate-blink-fast">Cadastre-se</Button>
               </Link>
            </>
          )}

           {!user && (
             <Sheet open={open} onOpenChange={setOpen}>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                   <Menu className="h-5 w-5" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="right" className="w-[80%] p-0">
                 <SheetHeader className="p-6 border-b">
                   <SheetTitle className="text-left flex items-center gap-2">
                     <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient">
                       <Gavel className="h-4 w-4 text-emerald-deep" />
                     </span>
                     Premium Agro
                   </SheetTitle>
                 </SheetHeader>
                 <div className="flex flex-col p-6 gap-4">
                   <div className="grid gap-2">
                     <p className="text-sm font-medium text-muted-foreground px-2">Acesso</p>
                     <Link to="/login" onClick={() => setOpen(false)}>
                       <Button variant="ghost" className="w-full justify-start gap-2">
                         <LogIn className="h-4 w-4" /> Entrar
                       </Button>
                     </Link>
                   <Link to="/cadastro" onClick={() => setOpen(false)}>
                     <Button className="w-full justify-start gap-2 shimmer-button text-emerald-deep animate-blink-fast">
                       <UserPlus className="h-4 w-4" /> Criar Conta
                     </Button>
                   </Link>
                   </div>
                   
                   <div className="grid gap-2 mt-4">
                     <p className="text-sm font-medium text-muted-foreground px-2">Navegação</p>
                     {nav.map((item) => (
                       <Link
                         key={item.to}
                         to={item.to}
                         onClick={() => setOpen(false)}
                         className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                         activeProps={{ className: "bg-secondary text-foreground" }}
                       >
                         {item.label}
                       </Link>
                     ))}
                   </div>
                 </div>
               </SheetContent>
             </Sheet>
            )}
           </div>
         </div>
       </div>
     </header>
  );
}
