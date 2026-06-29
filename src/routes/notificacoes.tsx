import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, ShieldAlert, Info, Check, Trash2, Loader2, ExternalLink, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/notificacoes")({
  component: NotificationsCenter,
  head: () => ({
    meta: [
      { title: "Central de Notificações" },
      { name: "description", content: "Acompanhe alertas de segurança, lances superados e atualizações da plataforma." },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="container py-12 text-center">
        <p className="text-destructive font-semibold">Erro ao carregar notificações.</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <Button className="mt-4" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="container py-12">Página não encontrada.</div>,
});

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function NotificationsCenter() {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "security" | "prefs">("all");
  const [savingPref, setSavingPref] = useState<string | null>(null);

  const updatePref = async (key: string, value: boolean) => {
    if (!user?.id) return;
    setSavingPref(key);
    const { error } = await supabase.from("profiles").update({ [key]: value } as any).eq("id", user.id);
    setSavingPref(null);
    if (error) return toast.error("Erro ao salvar", { description: error.message });
    await refreshProfile();
    toast.success("Preferência atualizada");
  };

  const load = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Erro ao carregar notificações", { description: error.message });
    } else {
      setItems((data || []) as Notification[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    load(user.id);

    const ch = supabase
      .channel(`notif-center-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  const markRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Todas marcadas como lidas");
  };

  const removeOne = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = async () => {
    if (!user?.id) return;
    if (!confirm("Excluir todas as notificações?")) return;
    const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
    if (error) return toast.error(error.message);
    setItems([]);
    toast.success("Notificações removidas");
  };

  if (authLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h1 className="text-2xl font-bold mb-2">Central de Notificações</h1>
        <p className="text-muted-foreground mb-4">Entre na sua conta para ver suas notificações.</p>
        <Button asChild><Link to="/login">Entrar</Link></Button>
      </div>
    );
  }

  const unreadCount = items.filter((n) => !n.is_read).length;
  const filtered = items.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "security") return n.type === "security";
    return true;
  });

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-gold" /> Central de Notificações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Tudo em dia"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-1" /> Marcar todas
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} disabled={items.length === 0}>
            <Trash2 className="h-4 w-4 mr-1" /> Limpar
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">Não lidas ({unreadCount})</TabsTrigger>
          <TabsTrigger value="security">
            <ShieldAlert className="h-3 w-3 mr-1" /> Segurança
          </TabsTrigger>
          <TabsTrigger value="prefs">
            <Settings className="h-3 w-3 mr-1" /> Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prefs" className="space-y-4">
          <Card className="p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-base mb-1">Lance superado</h3>
              <p className="text-xs text-muted-foreground mb-3">Quando alguém cobrir um lance seu.</p>
              <div className="space-y-2 pl-1">
                <PrefRow label="Notificação no app (sino + toast)" k="pref_outbid_push" profile={profile} onChange={updatePref} saving={savingPref} />
                <PrefRow label="E-mail" k="pref_outbid_email" profile={profile} onChange={updatePref} saving={savingPref} />
                <PrefRow label="WhatsApp" k="pref_outbid_whatsapp" profile={profile} onChange={updatePref} saving={savingPref} />
                <PrefRow label="SMS" k="pref_outbid_sms" profile={profile} onChange={updatePref} saving={savingPref} />
              </div>
            </div>
            <div className="border-t pt-5">
              <h3 className="font-semibold text-base mb-1">Novos eventos</h3>
              <p className="text-xs text-muted-foreground mb-3">Quando um novo leilão for publicado.</p>
              <div className="space-y-2 pl-1">
                <PrefRow label="E-mail" k="pref_new_event_email" profile={profile} onChange={updatePref} saving={savingPref} />
                <PrefRow label="WhatsApp" k="pref_new_event_whatsapp" profile={profile} onChange={updatePref} saving={savingPref} />
                <PrefRow label="SMS" k="pref_new_event_sms" profile={profile} onChange={updatePref} saving={savingPref} />
              </div>
            </div>
            <div className="border-t pt-5">
              <h3 className="font-semibold text-base mb-1">Lotes seguidos</h3>
              <p className="text-xs text-muted-foreground mb-3">Atualizações em lotes que você está acompanhando.</p>
              <div className="space-y-2 pl-1">
                <PrefRow label="Receber atualizações" k="pref_followed_lot_update" profile={profile} onChange={updatePref} saving={savingPref} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground border-t pt-4">
              Alertas de segurança são sempre enviados e não podem ser desativados.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value={filter} className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhuma notificação aqui.</p>
            </Card>
          ) : (
            filtered.map((n) => {
              const isSecurity = n.type === "security";
              return (
                <Card
                  key={n.id}
                  className={`p-4 transition-colors ${
                    !n.is_read
                      ? isSecurity
                        ? "border-l-4 border-l-red-500 bg-red-50/50"
                        : "border-l-4 border-l-gold bg-gold/5"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isSecurity ? (
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                      ) : (
                        <Info className="h-5 w-5 text-gold" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold text-sm ${isSecurity ? "text-red-700" : ""}`}>
                          {n.title}
                        </h3>
                        {!n.is_read && (
                          <Badge variant="outline" className="text-[10px] shrink-0">Nova</Badge>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isSecurity ? "text-red-600" : "text-muted-foreground"}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        <div className="flex gap-1">
                          {n.link && (
                            <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                              <Link to={n.link} onClick={() => !n.is_read && markRead(n.id)}>
                                <ExternalLink className="h-3 w-3 mr-1" /> Ver
                              </Link>
                            </Button>
                          )}
                          {!n.is_read && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markRead(n.id)}>
                              <Check className="h-3 w-3 mr-1" /> Lida
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeOne(n.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}