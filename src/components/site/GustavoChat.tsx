import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send, Phone, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

function buildWhatsAppLink(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  const msg = encodeURIComponent(
    "Olá! Vim do chat do Gustavo Leilão e gostaria de falar com um atendente.",
  );
  return `https://wa.me/${full}?text=${msg}`;
}

export function GustavoChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { siteInfo } = useSiteSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const phone = siteInfo?.phone || "(21) 99650-9905";
  const waLink = buildWhatsAppLink(phone);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  const suggestions = [
    "Como me cadastro?",
    "Como dou um lance?",
    "Como crio um evento?",
    "Quais formas de pagamento?",
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir chat com Gustavo Leilão"
        className={cn(
          "fixed z-50 bottom-20 right-4 md:bottom-6 md:right-6",
          "h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl",
          "flex items-center justify-center transition-all hover:scale-110",
          "ring-4 ring-primary/20",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden",
            "bottom-36 right-4 left-4 md:left-auto md:bottom-24 md:right-6",
            "md:w-[380px] h-[70vh] md:h-[560px] max-h-[640px]",
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                G
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold leading-tight">Gustavo Leilão</div>
                <div className="text-xs opacity-90 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                  Assistente virtual · online
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="opacity-80 hover:opacity-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-xs font-medium bg-white/15 hover:bg-white/25 rounded-lg py-2 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Falar com atendente no WhatsApp
            </a>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="bg-background rounded-2xl rounded-tl-sm p-3 text-sm shadow-sm">
                  Olá! 👋 Sou o <strong>Gustavo Leilão</strong>, seu assistente sobre leilões do
                  agronegócio. Posso ajudar com cadastro, lances, eventos, propostas e pagamentos.
                  Como posso te ajudar hoje?
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage({ text: s })}
                      className="text-xs bg-background border border-border rounded-full px-3 py-1.5 hover:bg-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-background rounded-tl-sm",
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{text}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                        <ReactMarkdown>{text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-background rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Gustavo está digitando...
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border p-2 flex items-center gap-2 bg-background"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo sobre leilões..."
              className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-9 w-9 shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}