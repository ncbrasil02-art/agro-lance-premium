import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Trophy, Users, Radio } from "lucide-react";

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
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Sobre a <span className="text-gradient-gold">Premium Agro</span></h1>
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
