  import { useSiteSettings } from "@/hooks/useSiteSettings";
 import { Link } from "@tanstack/react-router";
 import { Home, Calendar, Gavel, PlayCircle, Info } from "lucide-react";
 
  export function BottomNav() {
    const { aboutPage } = useSiteSettings();
 
    const navItems = [
      { to: "/", label: "Início", icon: Home, show: true },
      { to: "/eventos", label: "Eventos", icon: Calendar, show: true },
      { to: "/ao-vivo", label: "Ao Vivo", icon: PlayCircle, show: true },
      { to: "/lotes", label: "Lotes", icon: Gavel, show: true },
      { to: "/sobre", label: aboutPage?.title || "Sobre", icon: Info, show: aboutPage?.enabled !== false },
    ].filter(i => i.show);
 
   return (
     <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border/60 bg-background/80 backdrop-blur-xl md:hidden">
       {navItems.map((item) => (
         <Link
           key={item.to}
           to={item.to}
           className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
           activeProps={{ className: "text-emerald-deep dark:text-gold" }}
           activeOptions={{ exact: item.to === "/" }}
         >
           <item.icon className="h-5 w-5" />
           <span className="text-[10px] font-medium">{item.label}</span>
         </Link>
       ))}
     </nav>
   );
 }