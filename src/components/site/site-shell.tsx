import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
 import { BottomNav } from "./bottom-nav";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
       <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
       <BottomNav />
    </div>
  );
}
