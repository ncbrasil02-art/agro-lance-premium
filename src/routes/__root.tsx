 import { Outlet, Link, HeadContent, Scripts, useRouter, createRootRouteWithContext } from "@tanstack/react-router";
 import { useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { ErrorFallback } from "@/components/ui/error-fallback";
 import { setupGlobalErrorLogging } from "@/utils/error-logger";
function GlobalErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <ErrorFallback error={error} />
    </div>
  );
}

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteShell } from "@/components/site/site-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { generateMetaTags } from "@/utils/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O conteúdo que você procura não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-emerald-deep shadow-gold transition-smooth hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

    export const Route = createRootRouteWithContext<{
     siteInfo: any;
     theme: any;
      homepage: any;
      animations: any;
      seoSettings: any;
      lot_card_settings: any;
    }>()({
   loader: async () => {
     try {
       const { data, error } = await supabase
         .from("site_settings")
         .select("key, value");
       
       if (error) throw error;
       
        const info = data.find((i: any) => i.key === "site_info")?.value as any;
        const theme = data.find((i: any) => i.key === "theme")?.value as any;
        const homepage = data.find((i: any) => i.key === "homepage_sections")?.value as any;
         const seoSettings = data.find((i: any) => i.key === "seo_settings")?.value as any;
         const animations = data.find((i: any) => i.key === "animations")?.value as any;
         const lot_card_settings = data.find((i: any) => i.key === "lot_card_settings")?.value as any;
         
         return { siteInfo: info, theme, homepage, seoSettings, animations, lot_card_settings };
      } catch (error) {
        console.error("Error loading root settings:", error);
        return { siteInfo: null, theme: null, homepage: null, animations: null, seoSettings: null, lot_card_settings: null };
      }
   },
   head: ({ loaderData }) => {
     const seoSettings = loaderData?.seoSettings;
     const tags = generateMetaTags({ seoSettings });
     
     return {
       meta: [
         { charSet: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
          { name: "apple-mobile-web-app-capable", content: "yes" },
          { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
         ...tags.meta
       ],
        links: [
           { rel: "manifest", href: "/manifest.json" },
           { rel: "apple-touch-icon", href: "/favicon.ico" },
          { rel: "stylesheet", href: appCss },
          { rel: "preconnect", href: "https://fonts.googleapis.com" },
          { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
          { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" },
          ...tags.links
        ],
     };
   },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: GlobalErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}` }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
   useEffect(() => {
     const cleanup = setupGlobalErrorLogging();
     return () => cleanup?.();
   }, []);
 
  return (
    <AuthProvider>
      <ThemeProvider>
        <SiteShell>
          <Outlet />
        </SiteShell>
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
}
