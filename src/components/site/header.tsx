import { Link } from "@tanstack/react-router";
import { Gavel, Moon, Sun, Menu, X, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useAuth } from "../auth/auth-provider";
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

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {profile?.role === "admin" && (
                <Link to="/admin" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Painel Admin
                  </Button>
                </Link>
              )}
              {!user ? (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">Entrar</Button>
                  </Link>
                  <Link to="/cadastro" className="flex-1" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-gold-gradient text-emerald-deep">Cadastre-se</Button>
                  </Link>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  className="w-full text-destructive flex items-center justify-center gap-2" 
                  onClick={() => { signOut(); setOpen(false); }}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
