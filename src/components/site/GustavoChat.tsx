import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  MessageCircle,
  X,
  Send,
  Phone,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function buildWhatsAppLink(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  const msg = encodeURIComponent(
    "Olá! Vim do chat do Gustavo Leilão e gostaria de falar com um atendente.",
  );
  return `https://wa.me/${full}?text=${msg}`;
}

type Thread = { id: string; title: string; updated_at: string };

function rowsToUIMessages(rows: Array<{ id: string; role: string; parts: unknown }>): UIMessage[] {
  return rows.map((r) => ({
    id: r.id,
    role: r.role as UIMessage["role"],
    parts: (Array.isArray(r.parts) ? r.parts : [{ type: "text", text: String(r.parts ?? "") }]) as UIMessage["parts"],
  }));
}

export function GustavoChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showThreads, setShowThreads] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const { siteInfo } = useSiteSettings();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const persistedIdsRef = useRef<Set<string>>(new Set());

  const { messages, sendMessage, status, setMessages } = useChat({
    id: activeThreadId ?? "anon",
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const phone = siteInfo?.phone || "(21) 99650-9905";
  const waLink = buildWhatsAppLink(phone);

  // Load threads list when user opens chat
  const loadThreads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_threads" as never)
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    setThreads((data as Thread[] | null) ?? []);
  }, [user]);

  useEffect(() => {
    if (open && user) loadThreads();
  }, [open, user, loadThreads]);

  // Auto-create/select first thread when opening
  useEffect(() => {
    if (!open || !user || activeThreadId) return;
    (async () => {
      const { data: existing } = await supabase
        .from("chat_threads" as never)
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        await selectThread((existing as Thread).id);
      } else {
        await createThread();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const selectThread = useCallback(async (id: string) => {
    setLoadingThread(true);
    setActiveThreadId(id);
    persistedIdsRef.current = new Set();
    const { data } = await supabase
      .from("chat_messages" as never)
      .select("id,role,parts,created_at")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });
    const msgs = rowsToUIMessages((data as never) ?? []);
    msgs.forEach((m) => persistedIdsRef.current.add(m.id));
    setInitialMessages(msgs);
    setMessages(msgs);
    setShowThreads(false);
    setLoadingThread(false);
  }, [setMessages]);

  const createThread = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chat_threads" as never)
      .insert({ user_id: user.id, title: "Nova conversa" })
      .select("id,title,updated_at")
      .single();
    if (error || !data) return;
    const t = data as Thread;
    setThreads((prev) => [t, ...prev]);
    persistedIdsRef.current = new Set();
    setInitialMessages([]);
    setMessages([]);
    setActiveThreadId(t.id);
    setShowThreads(false);
  }, [user, setMessages]);

  const deleteThread = useCallback(async (id: string) => {
    await supabase.from("chat_threads" as never).delete().eq("id", id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) {
      setActiveThreadId(null);
      setMessages([]);
    }
  }, [activeThreadId, setMessages]);

  // Persist new messages whenever they appear
  useEffect(() => {
    if (!user || !activeThreadId || isLoading) return;
    const fresh = messages.filter((m) => !persistedIdsRef.current.has(m.id));
    if (fresh.length === 0) return;
    (async () => {
      for (const m of fresh) {
        persistedIdsRef.current.add(m.id);
        await supabase.from("chat_messages" as never).insert({
          thread_id: activeThreadId,
          user_id: user.id,
          role: m.role,
          parts: m.parts as unknown as object,
        });
        // Update thread title from first user message
        if (m.role === "user") {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("").slice(0, 60);
          const current = threads.find((t) => t.id === activeThreadId);
          if (current && current.title === "Nova conversa" && text) {
            await supabase.from("chat_threads" as never).update({ title: text }).eq("id", activeThreadId);
            setThreads((prev) => prev.map((t) => (t.id === activeThreadId ? { ...t, title: text } : t)));
          }
        }
      }
    })();
  }, [messages, isLoading, user, activeThreadId, threads]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (open && !showThreads) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, showThreads, activeThreadId]);

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
              {user && (
                <button
                  onClick={() => setShowThreads((v) => !v)}
                  aria-label={showThreads ? "Voltar à conversa" : "Ver histórico"}
                  className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  {showThreads ? <ChevronLeft className="h-5 w-5" /> : <MessageSquare className="h-4 w-4" />}
                </button>
              )}
              {!user && (
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  G
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold leading-tight">Gustavo Leilão</div>
                <div className="text-xs opacity-90 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                  {showThreads ? "Histórico de conversas" : "Assistente virtual · online"}
                </div>
              </div>
              {user && !showThreads && (
                <button
                  onClick={createThread}
                  aria-label="Nova conversa"
                  className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
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

          {/* Threads list */}
          {showThreads && user && (
            <div className="flex-1 overflow-y-auto p-2 bg-muted/30">
              {threads.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Nenhuma conversa ainda.
                </div>
              )}
              <div className="space-y-1">
                {threads.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent transition-colors",
                      activeThreadId === t.id && "bg-accent",
                    )}
                  >
                    <button
                      onClick={() => selectThread(t.id)}
                      className="flex-1 text-left text-sm truncate"
                    >
                      {t.title}
                    </button>
                    <button
                      onClick={() => deleteThread(t.id)}
                      aria-label="Excluir conversa"
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {!showThreads && (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {!user && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200">
                Faça login para salvar seu histórico de conversas.
              </div>
            )}
            {loadingThread && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingThread && messages.length === 0 && (
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
          )}

          {/* Composer */}
          {!showThreads && (
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
          )}
        </div>
      )}
    </>
  );
}