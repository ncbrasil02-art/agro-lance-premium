import { Share2 } from "lucide-react";

interface SocialPreviewProps {
  title: string;
  description: string;
  image?: string;
  siteUrl?: string;
}

 export function SocialPreview({ title, description, image, siteUrl = "agropremium.com.br" }: SocialPreviewProps) {
  const displayTitle = title || "Título da Página";
  const displayDesc = description || "Adicione uma meta descrição para ver como seu conteúdo aparecerá nas redes sociais.";
  const displayImage = image || "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80";

  const dynamicImageUrl = `https://ccrslflbnxdazvadjlvj.supabase.co/functions/v1/og-image?title=${encodeURIComponent(displayTitle)}&imageUrl=${encodeURIComponent(displayImage)}`;

  return (
     <div className="space-y-6 p-0 border rounded-2xl bg-white dark:bg-zinc-900 shadow-sm max-w-[500px] overflow-hidden pb-6 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 p-4 border-b bg-muted/5">
        <div className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
          <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
         <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prévia Redes Sociais</span>
      </div>

      <div className="px-4 space-y-4">
         <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-gold pl-2">Imagem Dinâmica Gerada (Novo)</div>
         <div className="bg-muted/10 p-3 rounded-lg border border-gold/10">
           <div className="aspect-[1200/630] w-full overflow-hidden rounded-lg bg-black/40">
             <img src={dynamicImageUrl} alt="Dynamic OG" className="w-full h-full object-contain" />
           </div>
           <p className="text-[10px] text-muted-foreground mt-2 italic text-center">Esta imagem é gerada automaticamente com sobreposição de texto.</p>
         </div>

        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-emerald-500 pl-2">Facebook / Open Graph</div>
        <div className="bg-[#f0f2f5] dark:bg-zinc-800 p-3 rounded-lg">
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

        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-l-2 border-blue-400 pl-2 mt-6">Twitter / X Card</div>
        <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border overflow-hidden shadow-sm">
            <div className="aspect-[1.91/1] w-full overflow-hidden bg-muted">
              <img src={displayImage} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-3 border-t">
              <div className="text-[13px] text-muted-foreground mb-0.5">{siteUrl}</div>
              <h3 className="text-[15px] font-semibold leading-tight line-clamp-1 mb-0.5">{displayTitle}</h3>
              <p className="text-[14px] text-muted-foreground leading-snug line-clamp-2">{displayDesc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
