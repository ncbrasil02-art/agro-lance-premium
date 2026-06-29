import type { ReactNode } from "react";
 import { useLocation } from "@tanstack/react-router";
import { Header } from "./header";
import { Footer } from "./footer";
 import { BottomNav } from "./bottom-nav";
import { FloatingElements } from "./FloatingElements";
import { PWAInstallProvider } from "./PWAInstallPrompt";

export function SiteShell({ children }: { children: ReactNode }) {
   const location = useLocation();
   const isAdmin = location.pathname.startsWith("/admin");
 
   if (isAdmin) {
     return <div className="flex min-h-screen flex-col">{children}</div>;
   }
 
  return (
    <PWAInstallProvider>
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      <FloatingElements />
      <Header />
        <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden">{children}</main>
      <Footer />
       <BottomNav />
    </div>
    </PWAInstallProvider>
  );
}
