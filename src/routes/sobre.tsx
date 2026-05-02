import { generateMetaTags } from "@/utils/seo";
 import { createFileRoute, Navigate } from "@tanstack/react-router";
 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Loader2 } from "lucide-react";
import { ShieldCheck, Trophy, Users, Radio, Check, Star, Award, Heart, Shield, Zap, Target, Sparkles } from "lucide-react";
 
const iconMap: Record<string, any> = {
  Radio,
  ShieldCheck,
  Trophy,
  Users,
  Check,
  Star,
  Award,
  Heart,
  Shield,
  Zap,
  Target,
  Sparkles
};

 import { PageSkeleton } from "@/components/ui/page-skeleton";
 
 export const Route = createFileRoute("/sobre")({
   pendingComponent: PageSkeleton,
   loader: async () => {
     const { data } = await supabase
       .from("site_settings")
       .select("value")
       .eq("key", "about_page")
       .single();
     return { initialSettings: data?.value || { enabled: true, title: "Sobre" } };
   },
  head: ({ matches }) => {
    const rootData = matches.find(m => m.id === '__root__')?.loaderData as any;
    const seoSettings = rootData?.seoSettings;
    return generateMetaTags({
      title: seoSettings?.about_title || "Sobre",
      description: seoSettings?.about_description,
      seoSettings,
      canonical: "/sobre",
      ogTitle: seoSettings?.about_og_title,
      ogDescription: seoSettings?.about_og_description,
      ogImage: seoSettings?.about_og_image
    });
  },
  component: AboutPage,
});

  function AboutPage() {
    const { initialSettings } = Route.useLoaderData();
    const [settings] = useState<any>(initialSettings);
 
   if (settings && !settings.enabled) {
     return <Navigate to="/" />;
   }
 
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        {settings?.title || "Sobre"} a <span className="text-gradient-gold">Premium Agro</span>
      </h1>
      <p className="mt-6 text-lg text-muted-foreground whitespace-pre-wrap">
        {settings?.content || "Somos a plataforma brasileira que está redefinindo a experiência dos leilões agropecuários — unindo tradição rural, curadoria genética rigorosa e tecnologia de tempo real."}
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {(settings?.features || [
          { icon: "Radio", title: "Tempo real", desc: "Lances instantâneos com WebSocket de baixa latência." },
          { icon: "ShieldCheck", title: "Segurança total", desc: "Aprovação manual de cadastros e contratos digitais." },
          { icon: "Trophy", title: "Curadoria premium", desc: "Avaliação veterinária e genealógica dos animais." },
          { icon: "Users", title: "Comunidade qualificada", desc: "Compradores e vendedores verificados." },
        ]).map((b: any, idx: number) => {
          const Icon = iconMap[b.icon] || Check;
          return (
            <div key={idx} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-gradient">
                <Icon className="h-5 w-5 text-emerald-deep" />
              </div>
              <h3 className="mt-4 font-semibold">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
