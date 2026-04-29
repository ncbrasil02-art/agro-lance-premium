 import { createFileRoute, Navigate } from "@tanstack/react-router";
 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Loader2 } from "lucide-react";
 import { ShieldCheck, Trophy, Users, Radio, Check } from "lucide-react";
 
 const iconMap: Record<string, any> = {
   Radio,
   ShieldCheck,
   Trophy,
   Users,
   Check
 };

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Premium Agro Leilões" },
      { name: "description", content: "Conheça a Premium Agro Leilões, plataforma referência em leilões agropecuários no Brasil." },
      { property: "og:title", content: "Sobre a Premium Agro" },
      { property: "og:description", content: "Tecnologia, curadoria e tradição para o mercado agropecuário." },
    ],
  }),
  component: AboutPage,
});

 function AboutPage() {
   const [settings, setSettings] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     async function fetchSettings() {
       const { data } = await supabase
         .from("site_settings")
         .select("value")
         .eq("key", "about_page")
         .single();
       
       setSettings(data?.value || { enabled: true, title: "Sobre" });
       setIsLoading(false);
     }
     fetchSettings();
   }, []);
 
   if (isLoading) {
     return (
       <div className="flex min-h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-gold" />
       </div>
     );
   }
 
   if (settings && !settings.enabled) {
     return <Navigate to="/" />;
   }
 
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
       <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{settings?.title || "Sobre"} a <span className="text-gradient-gold">Premium Agro</span></h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Somos a plataforma brasileira que está redefinindo a experiência dos leilões agropecuários — unindo
        tradição rural, curadoria genética rigorosa e tecnologia de tempo real.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {[
          { icon: Radio, title: "Tempo real", desc: "Lances instantâneos com WebSocket de baixa latência." },
          { icon: ShieldCheck, title: "Segurança total", desc: "Aprovação manual de cadastros e contratos digitais." },
          { icon: Trophy, title: "Curadoria premium", desc: "Avaliação veterinária e genealógica dos animais." },
          { icon: Users, title: "Comunidade qualificada", desc: "Compradores e vendedores verificados." },
        ].map((b) => (
          <div key={b.title} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-gradient">
              <b.icon className="h-5 w-5 text-emerald-deep" />
            </div>
            <h3 className="mt-4 font-semibold">{b.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
