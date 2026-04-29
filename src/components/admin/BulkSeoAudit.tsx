import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSEO } from "@/utils/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldCheck, Globe, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function BulkSeoAudit() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    healthy: 0
  });

  const runAudit = async () => {
    setIsLoading(true);
    try {
      const [animals, posts, events] = await Promise.all([
        supabase.from("animals").select("id, name, seo_title, seo_description, photos, og_title, og_description, og_image_url"),
        supabase.from("posts").select("id, title, seo_title, seo_description, featured_image, og_title, og_description, og_image_url, content"),
        supabase.from("events").select("id, name, seo_title, seo_description, banner_url, og_title, og_description, og_image_url")
      ]);

      const allItems: any[] = [];
      
      animals.data?.forEach(a => {
        const issues = analyzeSEO(a.seo_title || a.name, a.seo_description || "", "", a.photos?.[0], a.og_title, a.og_description);
        allItems.push({ id: a.id, name: a.name, type: 'Animal', issues });
      });

      posts.data?.forEach(p => {
        const issues = analyzeSEO(p.seo_title || p.title, p.seo_description || "", p.content || "", p.featured_image, p.og_title, p.og_description);
        allItems.push({ id: p.id, name: p.title, type: 'Notícia', issues });
      });

      events.data?.forEach(e => {
        const issues = analyzeSEO(e.seo_title || e.name, e.seo_description || "", "", e.banner_url, e.og_title, e.og_description);
        allItems.push({ id: e.id, name: e.name, type: 'Evento', issues });
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
      toast.success("Auditoria de SEO concluída!");
    } catch (error: any) {
      toast.error("Erro na auditoria: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Detalhes da Auditoria em Lote</CardTitle>
            <CardDescription>Analise individual de cada item do site para otimização SEO.</CardDescription>
          </div>
          <Button onClick={runAudit} disabled={isLoading} className="bg-gold text-emerald-deep">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refazer Auditoria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
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
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {item.issues.length === 0 ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                              <CheckCircle2 className="h-3 w-3" /> Perfeito
                            </span>
                          ) : (
                            item.issues.slice(0, 2).map((issue: any, i: number) => (
                              <Badge 
                                key={i} 
                                variant="secondary" 
                                className={`text-[9px] font-bold uppercase ${
                                  issue.level === 'error' ? 'text-red-500 bg-red-500/5 border-red-500/20' : 
                                  issue.level === 'warn' ? 'text-amber-500 bg-amber-500/5 border-amber-500/20' : 
                                  'text-blue-500 bg-blue-500/5 border-blue-500/20'
                                }`}
                              >
                                {issue.level === 'error' ? <AlertCircle className="h-2 w-2 mr-1" /> : 
                                 issue.level === 'warn' ? <AlertTriangle className="h-2 w-2 mr-1" /> : 
                                 <Info className="h-2 w-2 mr-1" />}
                                {issue.message}
                              </Badge>
                            ))
                          )}
                          {item.issues.length > 2 && (
                            <Badge variant="outline" className="text-[9px]">+{item.issues.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase gap-1 text-muted-foreground hover:text-gold">
                          Corrigir <ArrowRight className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      {isLoading ? "Auditoria em andamento..." : "Nenhum dado encontrado para auditoria."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { RefreshCw } from "lucide-react";
