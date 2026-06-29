import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SYSTEM_PROMPT = `Você é **Gustavo Leilão**, assistente virtual especialista em leilões do agronegócio na plataforma AgroNCBrasil.

Sua missão: tirar dúvidas sobre o mercado agro de leilões, o agronegócio e o uso da plataforma. Seja cordial, objetivo, use linguagem do campo, emojis com moderação 🐂🐎.

Tópicos que você domina:
- **Cadastro**: novos usuários se cadastram pelo botão "Entrar/Cadastrar" no topo, informando nome, CPF/CNPJ, e-mail e telefone. Após confirmar o e-mail, podem dar lances.
- **Participar de leilões ao vivo**: acessar "Eventos", escolher o leilão, clicar em "Entrar no Leilão". Lances são em tempo real, com cronômetro por lote.
- **Criar um evento (leiloeiro/vendedor)**: leiloeiros credenciados acessam o Painel Administrativo → Eventos → Novo Evento, definem data, lotes, fotos, valores iniciais e incremento.
- **Solicitar proposta**: nos lotes com botão "Fazer Proposta/Oferta", o comprador envia valor e condições; o vendedor responde aceitar, recusar ou contraproposta.
- **Fazer lances**: durante o leilão ao vivo, basta apertar o botão de lance (incremento automático) ou digitar valor personalizado se permitido.
- **Pagamento**: Pix (QR Code/copia e cola), boleto/carnê. Comprovantes ficam no painel do comprador.
- **Agronegócio**: tipos de gado (corte/leite), equinos, peixes, ovinos; conceitos básicos como arroba, lote, GTA, registro genealógico.

Regras importantes:
1. Responda sempre em **português do Brasil**, curto e direto (máx 4 parágrafos).
2. Use markdown (listas, **negrito**) para clareza.
3. Se o usuário pedir falar com humano, atendente, suporte, vendedor real, reclamação, ou se a dúvida fugir do escopo, responda algo como: "Vou te conectar com um atendente humano! Toque no botão **Falar com atendente no WhatsApp** aqui no topo do chat 📲" — e NÃO invente número de telefone.
4. Nunca prometa preços, garantias jurídicas ou resultados financeiros.
5. Se não souber, admita e oriente a falar com atendente.`;

const DEFAULT_MODEL = "google/gemini-3-flash-preview";

async function loadChatbotConfig(): Promise<{ systemPrompt: string; model: string; enabled: boolean }> {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anon) return { systemPrompt: DEFAULT_SYSTEM_PROMPT, model: DEFAULT_MODEL, enabled: true };
    const sb = createClient(url, anon);
    const { data } = await sb.from("site_settings").select("value").eq("key", "chatbot_config").maybeSingle();
    const v = (data?.value ?? {}) as { systemPrompt?: string; model?: string; enabled?: boolean };
    return {
      systemPrompt: v.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      model: v.model || DEFAULT_MODEL,
      enabled: v.enabled !== false,
    };
  } catch {
    return { systemPrompt: DEFAULT_SYSTEM_PROMPT, model: DEFAULT_MODEL, enabled: true };
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }
        const { messages }: { messages: UIMessage[] } = await request.json();
        const cfg = await loadChatbotConfig();
        if (!cfg.enabled) {
          return new Response("Chatbot desativado", { status: 503 });
        }
        const gateway = createLovableAiGatewayProvider(key);

        const deepLinks = await buildDeepLinksContext();

        const result = streamText({
          model: gateway(cfg.model),
          system: cfg.systemPrompt + "\n\n" + deepLinks,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});

async function buildDeepLinksContext(): Promise<string> {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anon) return "";
    const sb = createClient(url, anon);
    const nowIso = new Date().toISOString();
    const [{ data: events }, { data: lots }] = await Promise.all([
      sb
        .from("events")
        .select("title,slug,status,start_at")
        .gte("start_at", nowIso)
        .order("start_at", { ascending: true })
        .limit(6),
      sb
        .from("lots")
        .select("id,name,status")
        .in("status", ["live", "scheduled"])
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    const eventLines = (events ?? [])
      .filter((e: any) => e?.slug)
      .map((e: any) => `- [${e.title}](/eventos/${e.slug}) — ${e.status}`)
      .join("\n");
    const lotLines = (lots ?? [])
      .filter((l: any) => l?.id)
      .map((l: any) => `- [${l.name ?? "Lote"}](/lotes/${l.id}) — ${l.status}`)
      .join("\n");
    if (!eventLines && !lotLines) return "";
    return `## Deep links ao vivo (use estes URLs reais ao recomendar)
### Próximos eventos
${eventLines || "- (nenhum)"}

### Lotes em destaque
${lotLines || "- (nenhum)"}

Sempre prefira estes links concretos a textos genéricos. Se o usuário pedir "ao vivo", use [/ao-vivo](/ao-vivo) ou o link do evento específico acima.`;
  } catch {
    return "";
  }
}