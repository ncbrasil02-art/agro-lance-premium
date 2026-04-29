import { Star, MapPin, Calendar, DollarSign, ExternalLink, Info } from "lucide-react";

interface RichResultsPreviewProps {
  type: 'article' | 'product' | 'event';
  title: string;
  data: {
    author?: string;
    date?: string;
    price?: number;
    currency?: string;
    availability?: string;
    location?: string;
    startDate?: string;
    rating?: number;
    reviews?: number;
  };
}

export function RichResultsPreview({ type, title, data }: RichResultsPreviewProps) {
  return (
    <div className="space-y-3 p-0 border rounded-2xl bg-white dark:bg-zinc-900 shadow-sm max-w-[500px] overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b bg-muted/5">
        <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20">
          <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prévia de Resultados Ricos (Rich Results)</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Google Style Result */}
        <div className="space-y-1">
          <div className="text-[#202124] dark:text-[#bdc1c6] text-[20px] leading-tight hover:underline cursor-pointer mb-1">
            {title || "Título do Resultado"}
          </div>
          
          {type === 'article' && (
            <div className="flex items-center gap-2 text-[14px] text-[#4d5156] dark:text-[#9aa0a6] leading-snug">
              <span className="font-bold">{data.author || "Autor"}</span>
              <span>•</span>
              <span>{data.date || "29 de abr. de 2026"}</span>
            </div>
          )}

          {type === 'product' && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#4d5156] dark:text-[#9aa0a6]">
              <div className="flex items-center gap-0.5 text-[#fabb05]">
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <span className="ml-1 font-medium text-[#4d5156] dark:text-[#9aa0a6]">5,0 ({data.reviews || 12})</span>
              </div>
              <span>•</span>
              <span className="font-bold text-[#202124] dark:text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: data.currency || 'BRL' }).format(data.price || 0)}
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{data.availability || "Em estoque"}</span>
            </div>
          )}

          {type === 'event' && (
            <div className="mt-2 space-y-2 border-t pt-2">
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center bg-muted/50 rounded p-1 min-w-[45px]">
                  <span className="text-[10px] uppercase font-bold text-red-500">ABR</span>
                  <span className="text-lg font-bold leading-none">29</span>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-[14px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    {title}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-[#70757a] dark:text-[#9aa0a6]">
                    <MapPin className="h-3 w-3" />
                    {data.location || "Arena Digital"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-900/30 rounded-xl">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>Otimização JSON-LD:</strong> Estes dados são extraídos automaticamente para o Google gerar snippets enriquecidos, aumentando o CTR (clique) em até 30%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
