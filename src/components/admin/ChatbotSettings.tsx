import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Loader2, Save, Plus, Trash2 } from "lucide-react";

export type ChatbotConfig = {
  enabled: boolean;
  name: string;
  welcome: string;
  suggestions: string[];
  systemPrompt: string;
  whatsappMessage: string;
  model: string;
};

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  enabled: true,
  name: "Gustavo Leilão",
  welcome:
    "Olá! 👋 Sou o **Gustavo Leilão**, seu assistente sobre leilões do agronegócio. Posso ajudar com cadastro, lances, eventos, propostas e pagamentos. Como posso te ajudar hoje?",
  suggestions: [
    "Como me cadastro?",
    "Como dou um lance?",
    "Como crio um evento?",
    "Quais formas de pagamento?",
  ],
  systemPrompt: `Você é **Gustavo Leilão**, assistente virtual especialista em leilões do agronegócio na plataforma AgroNCBrasil.

Sua missão: tirar dúvidas sobre o mercado agro de leilões, o agronegócio e o uso da plataforma. Seja cordial, objetivo, use linguagem do campo, emojis com moderação 🐂🐎.

## Páginas da plataforma (use sempre links markdown relativos)
- [Início](/) — destaques, próximos eventos, lotes em destaque, notícias.
- [Eventos](/eventos) — lista de leilões agendados, ao vivo e encerrados.
- [Evento específico](/eventos/SLUG) — encarte, lotes e botão "Entrar no Leilão".
- [Lotes](/lotes) — catálogo geral de lotes com filtros.
- [Detalhe do lote](/lotes/ID) — fotos, dados do animal, lances e ofertas.
- [Ao vivo](/ao-vivo) — transmissão e pregão em tempo real.
- [Compra direta](/compra-direta) — animais à venda fora do leilão.
- [Notícias](/noticias) — conteúdo do agronegócio.
- [Sobre](/sobre) — informações institucionais.
- [Cadastro](/cadastro) — criar conta de comprador/vendedor.
- [Login](/login) — acessar a conta.
- [Meu painel](/painel) — lances, pagamentos, propostas e documentos do usuário.
- [Pagamento da parcela](/pagamento/ID) — Pix, boleto e cartão de uma parcela.

Sempre que indicar uma ação (cadastrar, dar lance, ver encarte, pagar, entrar no leilão), inclua o link markdown da página correspondente. Quando não souber o SLUG/ID, oriente o usuário a abrir [Eventos](/eventos) ou [Lotes](/lotes) e escolher.

Regras:
1. Responda sempre em português do Brasil, curto e direto (máx 4 parágrafos).
2. Use markdown (listas, **negrito**, links) para clareza e sempre que possível direcione com link interno.
3. Se o usuário pedir falar com humano/atendente, oriente a tocar no botão "Falar com atendente no WhatsApp" no topo do chat — NÃO invente números.
4. Nunca prometa preços, garantias jurídicas ou resultados financeiros.
5. Se não souber, admita e oriente a falar com atendente.`,
  whatsappMessage:
    "Olá! Vim do chat do Gustavo Leilão e gostaria de falar com um atendente.",
  model: "google/gemini-3-flash-preview",
};

export function ChatbotSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ChatbotConfig>(DEFAULT_CHATBOT_CONFIG);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "chatbot_config")
        .maybeSingle();
      if (data?.value) {
        setConfig({ ...DEFAULT_CHATBOT_CONFIG, ...(data.value as Partial<ChatbotConfig>) });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "chatbot_config",
        value: config as unknown as never,
        description: "Configuração do chatbot Gustavo Leilão",
      },
      { onConflict: "key" },
    );
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Configurações do chatbot salvas!");
    }
  };

  const setSuggestion = (i: number, value: string) => {
    setConfig((c) => ({
      ...c,
      suggestions: c.suggestions.map((s, idx) => (idx === i ? value : s)),
    }));
  };

  const addSuggestion = () =>
    setConfig((c) => ({ ...c, suggestions: [...c.suggestions, "Nova sugestão"] }));

  const removeSuggestion = (i: number) =>
    setConfig((c) => ({ ...c, suggestions: c.suggestions.filter((_, idx) => idx !== i) }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Configuração do Chatbot</h2>
          <p className="text-sm text-muted-foreground">
            Personalize o assistente virtual Gustavo Leilão.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geral</CardTitle>
          <CardDescription>Visibilidade e identidade do bot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Chatbot ativo</Label>
              <p className="text-xs text-muted-foreground">
                Quando desativado, o botão flutuante não aparece no site.
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Nome do assistente</Label>
            <Input
              value={config.name}
              onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Modelo de IA</Label>
            <Input
              value={config.model}
              onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
              placeholder="google/gemini-3-flash-preview"
            />
            <p className="text-xs text-muted-foreground">
              Identificador do modelo no Lovable AI Gateway.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensagem de boas-vindas</CardTitle>
          <CardDescription>Texto exibido ao abrir uma nova conversa. Suporta markdown.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={config.welcome}
            onChange={(e) => setConfig((c) => ({ ...c, welcome: e.target.value }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sugestões iniciais</CardTitle>
          <CardDescription>Atalhos clicáveis mostrados no início da conversa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {config.suggestions.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input value={s} onChange={(e) => setSuggestion(i, e.target.value)} />
              <Button variant="ghost" size="icon" onClick={() => removeSuggestion(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSuggestion}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar sugestão
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt do sistema</CardTitle>
          <CardDescription>
            Define a personalidade, regras e conhecimento do bot. Use markdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={14}
            className="font-mono text-xs"
            value={config.systemPrompt}
            onChange={(e) => setConfig((c) => ({ ...c, systemPrompt: e.target.value }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensagem do WhatsApp</CardTitle>
          <CardDescription>
            Texto pré-preenchido quando o usuário clica em "Falar com atendente".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            value={config.whatsappMessage}
            onChange={(e) => setConfig((c) => ({ ...c, whatsappMessage: e.target.value }))}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={save} disabled={saving} size="lg" className="shadow-lg">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}