 import { useEffect, useState } from "react";
 import { cn } from "@/lib/utils";

 export function Countdown({ endsAt, className, variant = "default", onEnd }: { endsAt: string; className?: string; variant?: "default" | "segmented", onEnd?: () => void }) {
   const [mounted, setMounted] = useState(false);
   const [now, setNow] = useState(0);
 
   useEffect(() => {
     setMounted(true);
     const updateNow = () => setNow(Date.now());
     updateNow();
     const id = setInterval(updateNow, 1000);
     return () => clearInterval(id);
   }, []);

   const endTime = new Date(endsAt).getTime();
   if (isNaN(endTime)) return <span className={className}>Data inválida</span>;
    if (!mounted) return <span className={className} suppressHydrationWarning>--:--:--</span>;
    
    const diff = Math.max(0, endTime - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);

    useEffect(() => {
      if (mounted && diff <= 0 && onEnd) {
        onEnd();
      }
    }, [diff, mounted, onEnd]);
 
   const isCritical = diff > 0 && diff < 600000; // Less than 10 minutes
 
   if (diff <= 0) return <span className={className} suppressHydrationWarning>{variant === 'segmented' ? '00:00:00' : 'Encerrado'}</span>;

  if (variant === "segmented") {
    return (
       <div className={`flex gap-3 ${className}`} suppressHydrationWarning>
         {d > 0 && (
           <div className="flex flex-col items-center" suppressHydrationWarning>
             <span className="text-2xl md:text-4xl font-black" suppressHydrationWarning>{String(d).padStart(2, "0")}</span>
              <span className="text-[8px] uppercase font-bold text-muted-foreground/70">Dias</span>
           </div>
         )}
         <div className="flex flex-col items-center" suppressHydrationWarning>
           <span className="text-2xl md:text-4xl font-black" suppressHydrationWarning>{String(h).padStart(2, "0")}</span>
            <span className="text-[8px] uppercase font-bold text-muted-foreground/70">Horas</span>
         </div>
         <div className="flex flex-col items-center" suppressHydrationWarning>
           <span className="text-2xl md:text-4xl font-black" suppressHydrationWarning>{String(m).padStart(2, "0")}</span>
            <span className="text-[8px] uppercase font-bold text-muted-foreground/70">Min</span>
         </div>
         <div className="flex flex-col items-center" suppressHydrationWarning>
           <span className="text-2xl md:text-4xl font-black text-gold" suppressHydrationWarning>{String(s).padStart(2, "0")}</span>
            <span className="text-[8px] uppercase font-bold text-muted-foreground/70">Seg</span>
         </div>
       </div>
    );
  }

   return (
     <span 
       className={cn(
         className, 
          isCritical && "text-live animate-blink-fast font-black shadow-[0_0_6px_rgba(239,68,68,0.15)]"
       )} 
       suppressHydrationWarning
     >
       {d > 0 ? `${d}d ` : ""}
       {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
     </span>
   );
}
