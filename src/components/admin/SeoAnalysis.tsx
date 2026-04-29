import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { analyzeSEO } from "@/utils/seo";

interface SeoAnalysisProps {
  title: string;
  description: string;
  content?: string;
}

export function SeoAnalysis({ title, description, content }: SeoAnalysisProps) {
  const issues = analyzeSEO(title, description, content);

  if (issues.length === 0 && title && description) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
        <CheckCircle2 className="h-4 w-4" />
        SEO básico validado com sucesso!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
        Análise de SEO
      </h4>
      {issues.map((issue, idx) => (
        <div 
          key={idx} 
          className={`flex items-start gap-2 p-3 rounded-lg border text-xs leading-relaxed ${
            issue.level === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
            issue.level === 'warn' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
            'bg-blue-500/10 border-blue-500/20 text-blue-500'
          }`}
        >
          {issue.level === 'error' ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : 
           issue.level === 'warn' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> : 
           <Info className="h-4 w-4 mt-0.5 shrink-0" />}
          {issue.message}
        </div>
      ))}
    </div>
  );
}
