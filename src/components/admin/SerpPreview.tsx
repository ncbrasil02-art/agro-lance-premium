import { Globe } from "lucide-react";

interface SerpPreviewProps {
  title: string;
  description: string;
  slug: string;
  basePath: string;
  siteUrl?: string;
}

export function SerpPreview({ title, description, slug, basePath, siteUrl = "https://agro-ncbrasil.lovable.app" }: SerpPreviewProps) {
  const displayTitle = title || "Título da Página";
  const displayUrl = `${siteUrl}${basePath}/${slug || "seu-link-aqui"}`;
  const displayDesc = description || "Adicione uma meta descrição para ver como seu conteúdo aparecerá nos resultados de busca do Google.";

  return (
    <div className="space-y-3 p-6 border rounded-2xl bg-white dark:bg-zinc-900 shadow-sm max-w-[600px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prévia do Google</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[14px] text-[#202124] dark:text-zinc-300 truncate">
          <span className="hover:underline cursor-pointer">{siteUrl}</span>
          <span className="text-zinc-400">›</span>
          <span className="truncate">{basePath.replace(/^\//, '')}</span>
          {slug && (
            <>
              <span className="text-zinc-400">›</span>
              <span className="truncate">{slug}</span>
            </>
          )}
        </div>
        
        <h3 className="text-[20px] text-[#1a0dab] dark:text-blue-400 hover:underline cursor-pointer font-medium leading-tight line-clamp-1">
          {displayTitle}
        </h3>
        
        <p className="text-[14px] text-[#4d5156] dark:text-zinc-400 leading-normal line-clamp-2">
          {displayDesc}
        </p>
      </div>
    </div>
  );
}
