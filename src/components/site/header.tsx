import { Link } from "@tanstack/react-router";
 import { Gavel, Moon, Sun, Menu, X, User as UserIcon, LogOut, LayoutDashboard, UserPlus, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useAuth } from "../auth/auth-provider";
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

const nav = [
  { to: "/", label: "Início" },
  { to: "/eventos", label: "Eventos" },
  { to: "/lotes", label: "Lotes" },
  { to: "/ao-vivo", label: "Ao Vivo" },
  { to: "/sobre", label: "Sobre" },
] as const;

export function Header() {
  const { theme, toggle } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient shadow-gold">
            <Gavel className="h-5 w-5 text-emerald-deep" />
          </span>
          <span className="text-lg tracking-tight">
            <span className="text-foreground">Premium</span>
            <span className="text-gradient-gold">Agro</span>
          </span>
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

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

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
                <Button size="sm" className="bg-gold-gradient text-emerald-deep hover:opacity-90 shadow-gold">Cadastre-se</Button>
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
                       <Button className="w-full justify-start gap-2 bg-gold-gradient text-emerald-deep">
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
    </header>
  );
}
