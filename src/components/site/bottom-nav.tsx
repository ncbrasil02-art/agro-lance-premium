  import { useSiteSettings } from "@/hooks/useSiteSettings";
  import { cn } from "@/lib/utils";
 import { Link } from "@tanstack/react-router";
 import { Home, Calendar, Gavel, PlayCircle, Info } from "lucide-react";
 
   export function BottomNav() {
     const { aboutPage, homepage } = useSiteSettings();
     const isMobileMode = homepage?.mobile_mode_enabled;
 
    const navItems = [
      { to: "/", label: "Início", icon: Home, show: true },
      { to: "/eventos", label: "Eventos", icon: Calendar, show: true },
      { to: "/ao-vivo", label: "Ao Vivo", icon: PlayCircle, show: true },
      { to: "/lotes", label: "Lotes", icon: Gavel, show: true },
      { to: "/sobre", label: aboutPage?.title || "Sobre", icon: Info, show: aboutPage?.enabled !== false },
    ].filter(i => i.show);
 
    return (
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border/60 backdrop-blur-xl md:hidden transition-all duration-300",
        isMobileMode ? "bg-emerald-deep/95 border-gold/20 h-20 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]" : "bg-background/80"
      )}>
       {navItems.map((item) => (
         <Link
           key={item.to}
           to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 transition-all active:scale-95",
              isMobileMode ? "text-white/60" : "text-muted-foreground"
            )}
            activeProps={{ className: isMobileMode ? "text-gold" : "text-emerald-deep dark:text-gold" }}
           activeOptions={{ exact: item.to === "/" }}
            onClick={() => {
              if (isMobileMode && navigator.vibrate) {
                navigator.vibrate(10);
              }
            }}
         >
            <item.icon className={cn("h-6 w-6", isMobileMode && "h-7 w-7")} />
            <span className={cn("text-[10px] font-medium", isMobileMode && "text-[9px] font-black uppercase tracking-widest")}>{item.label}</span>
         </Link>
       ))}
     </nav>
   );
 }