import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSEO } from "@/utils/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
 import { Loader2, Search, AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldCheck, Globe, ArrowRight, RefreshCw, History, Calendar, Play, Wand2, Download, FileJson } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function BulkSeoAudit() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeAudit, setActiveAudit] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    healthy: 0
  });

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('seo_audits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setAuditHistory(data || []);
  };

   const exportToCSV = () => {
     if (results.length === 0) {
       toast.error("Nenhum dado para exportar.");
       return;
     }
     
     setIsExporting(true);
     try {
       const headers = ["Tipo", "Nome", "Status", "Problemas"];
       const rows = results.map(item => [
         item.type,
         item.name,
         item.issues.length === 0 ? "Otimizado" : `${item.issues.length} problemas`,
         item.issues.map((i: any) => i.message).join(" | ")
       ]);
 
       const csvContent = [
         headers.join(","),
         ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
       ].join("\n");
 
       const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
       const url = URL.createObjectURL(blob);
       const link = document.createElement("a");
       link.setAttribute("href", url);
       link.setAttribute("download", `relatorio-seo-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`);
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       
       toast.success("Relatório exportado com sucesso!");
     } catch (error: any) {
       toast.error("Erro ao exportar: " + error.message);
     } finally {
       setIsExporting(false);
     }
   };
 
   const runAudit = async () => {
    setIsLoading(true);
    try {
      const [animals, posts, events] = await Promise.all([
        supabase.from("animals").select("id, name, seo_title, seo_description, photos, og_title, og_description"),
        supabase.from("posts").select("id, title, seo_title, seo_description, featured_image, og_title, og_description, content"),
        supabase.from("events").select("id, name, seo_title, seo_description, banner_url, og_title, og_description")
      ]);

      const allItems: any[] = [];
      
      animals.data?.forEach(a => {
        const issues = analyzeSEO(a.seo_title || a.name, a.seo_description || "", "", a.photos?.[0], a.og_title || undefined, a.og_description || undefined);
        allItems.push({ id: a.id, name: a.name, type: 'Animal', issues, rawContent: a.seo_description });
      });

      posts.data?.forEach(p => {
        const issues = analyzeSEO(p.seo_title || p.title, p.seo_description || "", p.content || "", p.featured_image || undefined, p.og_title || undefined, p.og_description || undefined);
        allItems.push({ id: p.id, name: p.title, type: 'Notícia', issues, rawContent: p.content });
      });

      events.data?.forEach(e => {
        const issues = analyzeSEO(e.seo_title || e.name, e.seo_description || "", "", e.banner_url || undefined, e.og_title || undefined, e.og_description || undefined);
        allItems.push({ id: e.id, name: e.name, type: 'Evento', issues, rawContent: e.seo_description });
      });

      setResults(allItems);
      
      const stats = allItems.reduce((acc, item) => {
        acc.total++;
        if (item.issues.some((i: any) => i.level === 'error')) acc.errors++;
        else if (item.issues.some((i: any) => i.level === 'warn')) acc.warnings++;
        else acc.healthy++;
        return acc;
      }, { total: 0, errors: 0, warnings: 0, healthy: 0 });
      
      setSummary(stats);
      toast.success("Auditoria de SEO local concluída!");
    } catch (error: any) {
      toast.error("Erro na auditoria: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const autoFixItem = async (item: any) => {
    setIsFixing(item.id);
    try {
      const { data: aiFix, error: aiError } = await supabase.functions.invoke('seo-fixer', {
        body: { 
          type: item.type, 
          title: item.name, 
          content: item.rawContent || item.name 
        }
      });

      if (aiError) throw aiError;

      const table = item.type === 'Animal' ? 'animals' : item.type === 'Notícia' ? 'posts' : 'events';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({
          seo_title: aiFix.seo_title,
          seo_description: aiFix.seo_description,
          og_title: aiFix.og_title,
          og_description: aiFix.og_description
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      toast.success(`${item.type} otimizado com sucesso!`);
      runAudit();
    } catch (error: any) {
      toast.error("Erro ao otimizar: " + error.message);
    } finally {
      setIsFixing(null);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isAuditing && activeAudit?.id) {
      interval = setInterval(async () => {
        const { data } = await supabase
          .from('seo_audits')
          .select('*')
          .eq('id', activeAudit.id)
          .single();
        
        if (data) {
          setActiveAudit(data);
          if (data.status === 'completed' || data.status === 'failed') {
            setIsAuditing(false);
            fetchHistory();
            toast.success("Auditoria do servidor concluída!");
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isAuditing, activeAudit?.id]);

  const triggerServerAudit = async () => {
    setIsAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-audit');
      if (error) throw error;
      
      const { data: auditData } = await supabase
        .from('seo_audits')
        .select('*')
        .eq('id', data.auditId)
        .single();
      
      setActiveAudit(auditData);
      toast.info("Auditoria iniciada no servidor...");
    } catch (error: any) {
      toast.error("Erro ao disparar auditoria: " + error.message);
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    runAudit();
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-emerald-500/60 tracking-widest">Total Auditado</CardDescription>
            <CardTitle className="text-3xl font-black">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-red-500/60 tracking-widest">Críticos (Erros)</CardDescription>
            <CardTitle className="text-3xl font-black text-red-500">{summary.errors}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-amber-500/60 tracking-widest">Melhorias (Alertas)</CardDescription>
            <CardTitle className="text-3xl font-black text-amber-500">{summary.warnings}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-emerald-500/60 tracking-widest">Otimizados</CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-500">{summary.healthy}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Detalhes da Auditoria em Lote</CardTitle>
                <CardDescription>Analise individual de cada item do site para otimização SEO.</CardDescription>
              </div>
             <div className="flex gap-2">
               <Button onClick={exportToCSV} disabled={isLoading || results.length === 0} size="sm" variant="outline" className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                 <Download className="h-4 w-4" />
                 Exportar CSV
               </Button>
               <Button onClick={runAudit} disabled={isLoading} size="sm" variant="outline" className="gap-2">
                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                 Atualizar
               </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status / Problemas</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length > 0 ? (
                      results.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{item.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {item.issues.length === 0 ? (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                                  <CheckCircle2 className="h-3 w-3" /> Perfeito
                                </span>
                              ) : (
                                item.issues.slice(0, 1).map((issue: any, i: number) => (
                                  <Badge 
                                    key={i} 
                                    variant="secondary" 
                                    className={`text-[9px] font-bold uppercase ${
                                      issue.level === 'error' ? 'text-red-500 bg-red-500/5 border-red-500/20' : 
                                      issue.level === 'warn' ? 'text-amber-500 bg-amber-500/5 border-amber-500/20' : 
                                      'text-blue-500 bg-blue-500/5 border-blue-500/20'
                                    }`}
                                  >
                                    {issue.message}
                                  </Badge>
                                ))
                              )}
                              {item.issues.length > 1 && (
                                <Badge variant="outline" className="text-[9px]">+{item.issues.length - 1}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             {item.issues.length > 0 && (
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="h-8 text-[10px] font-bold uppercase gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                 onClick={() => autoFixItem(item)}
                                 disabled={isFixing === item.id}
                                >
                                 {isFixing === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                 Auto-corrigir
                               </Button>
                             )}
                             <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase gap-1 text-muted-foreground hover:text-gold">
                               Ver <ArrowRight className="h-3 w-3" />
                             </Button>
                           </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          {isLoading ? "Auditoria em andamento..." : "Nenhum dado encontrado."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-gold/20 bg-gold/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" /> Auditoria Recorrente
              </CardTitle>
              <CardDescription>Configure verificações automáticas periódicas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-white/10 border border-gold/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">Status do Agendamento</span>
                  <Badge className="bg-emerald-500 text-white">Ativo (Sugestão)</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Para habilitar a auditoria recorrente, configure um <strong>Cron Job</strong> no Supabase para chamar a Edge Function <code>seo-audit</code> diariamente.
                </p>
                {!isAuditing ? (
                  <Button 
                    onClick={triggerServerAudit} 
                    className="w-full bg-gold text-emerald-deep font-bold gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Rodar agora no Servidor
                  </Button>
                ) : (
                  <div className="space-y-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-emerald-600">
                      <span>{activeAudit?.progress_message || 'Processando...'}</span>
                      <span>{activeAudit?.total_items ? Math.round((activeAudit.processed_items / activeAudit.total_items) * 100) : 0}%</span>
                    </div>
                    <Progress value={activeAudit?.total_items ? (activeAudit.processed_items / activeAudit.total_items) * 100 : 0} className="h-1.5" />
                    <p className="text-[9px] text-muted-foreground italic text-center">Não feche esta aba para acompanhar em tempo real.</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase flex items-center gap-2">
                  <History className="h-4 w-4 text-gold" /> Histórico Recente
                </h4>
                <div className="space-y-2">
                  {auditHistory.length > 0 ? auditHistory.map((audit) => (
                    <div key={audit.id} className="p-3 rounded-lg border bg-background/50 text-[11px] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{format(new Date(audit.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        <Badge variant="outline" className="text-[9px] uppercase">{audit.status}</Badge>
                      </div>
                      <div className="flex gap-3 text-muted-foreground">
                        <span className="text-emerald-500">✔ {audit.healthy_count}</span>
                        <span className="text-amber-500">⚠ {audit.warning_count}</span>
                        <span className="text-red-500">✖ {audit.error_count}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-[11px] text-muted-foreground italic">Nenhum histórico disponível.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
