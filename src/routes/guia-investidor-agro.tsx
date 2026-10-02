import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileSearch, Gavel, Scale, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMetaTags } from "@/utils/seo";

export const Route = createFileRoute("/guia-investidor-agro")({
  head: ({ matches }) => {
    const rootData = matches.find((match) => match.id === "__root__")?.loaderData as any;
    const tags = generateMetaTags({
      title: "Como investir em gado de elite: guia completo",
      description: "Entenda como avaliar animais, documentos, custos e riscos antes de participar de um leilão de gado de elite.",
      seoSettings: rootData?.seoSettings,
      canonical: "/guia-investidor-agro",
    });
    return {
      ...tags,
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Como investir em gado de elite: guia completo",
          description: "Guia educativo para avaliar animais, documentos, custos e riscos em leilões de gado de elite.",
          author: { "@type": "Organization", name: "Premium Agro Leilões" },
          publisher: { "@type": "Organization", name: "Premium Agro Leilões", url: "https://plataformaleiloesagro.site" },
          mainEntityOfPage: "https://plataformaleiloesagro.site/guia-investidor-agro",
        }),
      }],
    };
  },
  component: InvestorGuide,
});

const steps = [
  { icon: FileSearch, title: "Estude o lote", text: "Leia a descrição, confira registro, genealogia, idade, raça, localização e os documentos disponibilizados pelo vendedor." },
  { icon: ShieldCheck, title: "Avalie saúde e procedência", text: "Analise exames, vacinação, histórico veterinário e condições informadas. Quando necessário, peça apoio técnico independente." },
  { icon: Scale, title: "Calcule o custo total", text: "Considere o lance, comissão, parcelas, transporte, seguro, manejo, alimentação e eventuais custos tributários antes de definir seu limite." },
  { icon: Gavel, title: "Participe com um limite", text: "Cadastre-se com antecedência, leia o regulamento e estabeleça um valor máximo. Não aumente sua oferta apenas pela pressão da disputa." },
];

function InvestorGuide() {
  return (
    <div className="bg-background">
      <section className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
          <p className="font-bold uppercase text-gold">Guia do investidor agro</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-foreground md:text-6xl">Como investir em gado de elite com critérios claros</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">Participar de um leilão exige análise do animal, do vendedor, das condições comerciais e do objetivo da compra. Este guia ajuda você a organizar essa decisão sem promessas de retorno.</p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-3xl font-bold">Antes de dar o primeiro lance</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {steps.map((step) => (
            <article key={step.title} className="rounded-lg border border-border bg-card p-6">
              <step.icon className="h-7 w-7 text-gold" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/30">
        <div className="container mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-3xl font-bold">Benefícios e riscos</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-gold">O que pode agregar valor</h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                {["Genética e registro compatíveis com seu objetivo", "Histórico sanitário documentado", "Características produtivas ou esportivas comprováveis", "Procedência e reputação do vendedor"].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />{item}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold">Riscos que exigem atenção</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">O preço do animal pode variar, e desempenho futuro não é garantido. Custos de manutenção, adaptação, transporte e saúde podem ser relevantes. Informações incompletas, documentação pendente e compras sem objetivo definido aumentam o risco.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-3xl font-bold">Checklist para o dia do leilão</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {["Confirme sua aprovação para participar.", "Leia o regulamento e as condições de pagamento.", "Separe os lotes de interesse e revise os documentos.", "Defina seu limite máximo por lote.", "Confira comissão, parcelas e logística.", "Registre dúvidas e fale com a equipe antes do lance."].map((item, index) => (
            <li key={item} className="flex items-start gap-4 rounded-lg border border-border p-5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold font-bold text-emerald-deep">{index + 1}</span><span className="pt-1 text-foreground">{item}</span></li>
          ))}
        </ol>
        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">Este conteúdo é educativo e não substitui avaliação veterinária, zootécnica, jurídica, contábil ou financeira independente.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/eventos"><Button size="lg" className="bg-gold text-emerald-deep hover:bg-gold-bright">Ver próximos leilões <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          <Link to="/lotes"><Button size="lg" variant="outline">Explorar lotes</Button></Link>
        </div>
      </section>
    </div>
  );
}