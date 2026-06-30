import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { sendTestEmail, sendEmailByTemplate } from "@/lib/email.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Send, Mail, FileText, ClipboardList } from "lucide-react";

type SmtpRow = {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  reply_to: string | null;
  enabled: boolean;
};

type TemplateRow = {
  id: string;
  name: string;
  label: string;
  category: string;
  subject: string;
  header_html: string;
  body_html: string;
  footer_html: string;
  variables: string[];
  enabled: boolean;
};

type LogRow = {
  id: string;
  template_name: string | null;
  to_email: string;
  subject: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

export function EmailSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-gold" /> Sistema de E-mails</CardTitle>
        <CardDescription>Configure o SMTP da Hostinger, edite os templates e acompanhe envios.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="smtp">
          <TabsList>
            <TabsTrigger value="smtp"><Mail className="h-4 w-4 mr-1" /> SMTP</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-1" /> Templates</TabsTrigger>
            <TabsTrigger value="logs"><ClipboardList className="h-4 w-4 mr-1" /> Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="smtp" className="mt-4"><SmtpTab /></TabsContent>
          <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
          <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SmtpTab() {
  const [row, setRow] = useState<SmtpRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const testFn = useServerFn(sendTestEmail);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("email_smtp_settings").select("*").limit(1).maybeSingle();
    if (error) toast.error("Erro ao carregar: " + error.message);
    setRow(data as SmtpRow | null);
    setLoading(false);
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    const { error } = await supabase.from("email_smtp_settings").update({
      host: row.host, port: row.port, secure: row.secure,
      username: row.username, password: row.password,
      from_email: row.from_email, from_name: row.from_name,
      reply_to: row.reply_to, enabled: row.enabled,
    }).eq("id", row.id);
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Configurações salvas!");
  }

  async function test() {
    if (!testTo) { toast.error("Informe um e-mail destinatário."); return; }
    setTesting(true);
    try {
      await testFn({ data: { to: testTo } });
      toast.success("E-mail de teste enviado!");
    } catch (e: unknown) {
      toast.error("Falha: " + (e instanceof Error ? e.message : String(e)));
    }
    setTesting(false);
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-gold" />;
  if (!row) return <p className="text-sm text-muted-foreground">Nenhuma configuração encontrada.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <strong>Hostinger:</strong> use <code>smtp.hostinger.com</code> · porta <code>465</code> (SSL) ou <code>587</code> (TLS).
        Usuário/senha são os do e-mail criado no painel da Hostinger.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label>Host SMTP</Label><Input value={row.host} onChange={e => setRow({ ...row, host: e.target.value })} /></div>
        <div><Label>Porta</Label><Input type="number" value={row.port} onChange={e => setRow({ ...row, port: Number(e.target.value) })} /></div>
        <div className="flex items-center gap-2 mt-6"><Switch checked={row.secure} onCheckedChange={v => setRow({ ...row, secure: v })} /><Label>Conexão segura (SSL/TLS)</Label></div>
        <div className="flex items-center gap-2 mt-6"><Switch checked={row.enabled} onCheckedChange={v => setRow({ ...row, enabled: v })} /><Label>Ativar envio de e-mails</Label></div>
        <div><Label>Usuário SMTP</Label><Input value={row.username} onChange={e => setRow({ ...row, username: e.target.value })} placeholder="contato@seudominio.com.br" /></div>
        <div><Label>Senha SMTP</Label><Input type="password" value={row.password} onChange={e => setRow({ ...row, password: e.target.value })} /></div>
        <div><Label>E-mail remetente (From)</Label><Input value={row.from_email} onChange={e => setRow({ ...row, from_email: e.target.value })} placeholder="contato@seudominio.com.br" /></div>
        <div><Label>Nome remetente</Label><Input value={row.from_name} onChange={e => setRow({ ...row, from_name: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>Reply-To (opcional)</Label><Input value={row.reply_to ?? ""} onChange={e => setRow({ ...row, reply_to: e.target.value })} /></div>
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} className="bg-gold text-emerald-deep">
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Salvar
        </Button>
      </div>
      <div className="border-t pt-4 mt-6">
        <Label className="text-sm font-semibold">Teste de envio</Label>
        <div className="flex gap-2 mt-2">
          <Input placeholder="seu@email.com" value={testTo} onChange={e => setTestTo(e.target.value)} />
          <Button variant="outline" onClick={test} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Enviar teste
          </Button>
        </div>
      </div>
    </div>
  );
}

function TemplatesTab() {
  const [list, setList] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TemplateRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const sendFn = useServerFn(sendEmailByTemplate);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("email_templates").select("*").order("category").order("label");
    if (error) toast.error("Erro: " + error.message);
    setList((data as TemplateRow[]) ?? []);
    setLoading(false);
  }

  function select(t: TemplateRow) {
    setSelected(t);
    const vars: Record<string, string> = {};
    (t.variables || []).forEach(v => { vars[v] = sampleValueFor(v); });
    setPreviewData(vars);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("email_templates").update({
      subject: selected.subject,
      header_html: selected.header_html,
      body_html: selected.body_html,
      footer_html: selected.footer_html,
      enabled: selected.enabled,
    }).eq("id", selected.id);
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Template salvo!"); load(); }
  }

  async function sendTest() {
    if (!selected || !sendTo) { toast.error("Informe um destinatário."); return; }
    try {
      await sendFn({ data: { templateName: selected.name, to: sendTo, variables: previewData } });
      toast.success("Enviado!");
    } catch (e: unknown) {
      toast.error("Falha: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  function renderPreview(): string {
    if (!selected) return "";
    const apply = (s: string) => s.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, k) => previewData[k] ?? "");
    return apply(selected.header_html) + apply(selected.body_html) + apply(selected.footer_html);
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-gold" />;

  return (
    <div className="grid gap-4 md:grid-cols-[250px_1fr]">
      <div className="space-y-1 max-h-[600px] overflow-y-auto border rounded p-2">
        {list.map(t => (
          <button key={t.id} onClick={() => select(t)}
            className={`w-full text-left p-2 rounded text-sm hover:bg-muted ${selected?.id === t.id ? "bg-gold/10 border border-gold/30" : ""}`}>
            <div className="font-medium flex items-center gap-2">{t.label}{!t.enabled && <Badge variant="outline">off</Badge>}</div>
            <div className="text-xs text-muted-foreground">{t.category} · {t.name}</div>
          </button>
        ))}
      </div>
      <div>
        {!selected ? <p className="text-sm text-muted-foreground">Selecione um template para editar.</p> : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selected.label}</h3>
              <div className="flex items-center gap-2"><Switch checked={selected.enabled} onCheckedChange={v => setSelected({ ...selected, enabled: v })} /><Label className="text-xs">Ativo</Label></div>
            </div>
            <div><Label>Assunto</Label><Input value={selected.subject} onChange={e => setSelected({ ...selected, subject: e.target.value })} /></div>
            <div><Label>Cabeçalho (HTML)</Label><Textarea rows={4} className="font-mono text-xs" value={selected.header_html} onChange={e => setSelected({ ...selected, header_html: e.target.value })} /></div>
            <div><Label>Corpo (HTML)</Label><Textarea rows={10} className="font-mono text-xs" value={selected.body_html} onChange={e => setSelected({ ...selected, body_html: e.target.value })} /></div>
            <div><Label>Rodapé (HTML)</Label><Textarea rows={3} className="font-mono text-xs" value={selected.footer_html} onChange={e => setSelected({ ...selected, footer_html: e.target.value })} /></div>
            {selected.variables?.length > 0 && (
              <div className="rounded border p-3 bg-muted/30">
                <Label className="text-xs">Variáveis disponíveis (use {"{{nome}}"} no HTML/Assunto)</Label>
                <div className="grid gap-2 sm:grid-cols-2 mt-2">
                  {selected.variables.map(v => (
                    <div key={v}>
                      <Label className="text-xs text-muted-foreground">{v}</Label>
                      <Input value={previewData[v] ?? ""} onChange={e => setPreviewData({ ...previewData, [v]: e.target.value })} placeholder={`valor de exemplo para ${v}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={save} disabled={saving} className="bg-gold text-emerald-deep">
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Salvar
              </Button>
              <Input placeholder="destinatario@email.com" value={sendTo} onChange={e => setSendTo(e.target.value)} className="max-w-xs" />
              <Button variant="outline" onClick={sendTest}><Send className="h-4 w-4 mr-1" /> Enviar com este template</Button>
            </div>
            <div>
              <Label>Pré-visualização</Label>
              <div className="border rounded mt-1 bg-white">
                <iframe title="preview" srcDoc={renderPreview()} className="w-full h-[420px] rounded" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LogsTab() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("email_send_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) toast.error(error.message);
    setRows((data as LogRow[]) ?? []);
    setLoading(false);
  }

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-gold" />;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nenhum envio registrado ainda.</p>;

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {rows.map(r => (
        <div key={r.id} className="border rounded p-2 text-sm flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">{r.to_email}</span>
            <Badge variant={r.status === "sent" ? "default" : "destructive"}>{r.status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{r.template_name} · {r.subject}</div>
          {r.error_message && <div className="text-xs text-destructive">{r.error_message}</div>}
          <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
        </div>
      ))}
    </div>
  );
}