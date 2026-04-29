import { Share2 } from "lucide-react";

interface SocialPreviewProps {
  title: string;
  description: string;
  image?: string;
  siteUrl?: string;
}

export function SocialPreview({ title, description, image, siteUrl = "agro-ncbrasil.lovable.app" }: SocialPreviewProps) {
  const displayTitle = title || "Título da Página";
  const displayDesc = description || "Adicione uma meta descrição para ver como seu conteúdo aparecerá no Facebook, WhatsApp e LinkedIn.";
  const displayImage = image || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80";

  return (
    <div className="space-y-3 p-0 border rounded-2xl bg-white dark:bg-zinc-900 shadow-sm max-w-[500px] overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b bg-muted/5">
        <div className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
          <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prévia Redes Sociais</span>
      </div>

      <div className="bg-[#f0f2f5] dark:bg-zinc-800 p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border overflow-hidden shadow-sm">
          <div className="aspect-[1200/630] w-full overflow-hidden bg-muted">
            <img src={displayImage} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-3 bg-[#f0f2f5] dark:bg-zinc-800">
            <div className="text-[12px] text-muted-foreground uppercase mb-1">{siteUrl}</div>
            <h3 className="text-[16px] font-bold leading-tight line-clamp-2 mb-1">{displayTitle}</h3>
            <p className="text-[14px] text-muted-foreground leading-normal line-clamp-1">{displayDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
