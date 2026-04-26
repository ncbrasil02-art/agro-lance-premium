import { cn } from "@/lib/utils";
import { logger } from "@/utils/logger";

 const map: Record<string, { label: string; cls: string; dot?: boolean }> = {
   live: { label: "ABERTO PARA LANCES", cls: "bg-emerald/15 text-emerald-bright border-emerald/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse", dot: true },
   active: { label: "ABERTO PARA LANCES", cls: "bg-emerald/15 text-emerald-bright border-emerald/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse", dot: true },
   open: { label: "ACEITA PRÉ-LANCE", cls: "bg-emerald/15 text-emerald-bright border-emerald/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" },
   upcoming: { label: "EM LOTEAMENTO", cls: "bg-upcoming/15 text-upcoming border-upcoming/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]" },
   scheduled: { label: "EM LOTEAMENTO", cls: "bg-upcoming/15 text-upcoming border-upcoming/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]" },
   loteamento: { label: "EM LOTEAMENTO", cls: "bg-upcoming/15 text-upcoming border-upcoming/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]" },
   pre_lance: { label: "PRÉ-LANCE ABERTO", cls: "bg-emerald/15 text-emerald-bright border-emerald/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]", dot: true },
   recebendo_lances: { label: "ABERTO PARA LANCES", cls: "bg-emerald/15 text-emerald-bright border-emerald/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse", dot: true },
  closed: { label: "ENCERRADO", cls: "bg-muted text-muted-foreground border-border" },
  finished: { label: "ENCERRADO", cls: "bg-muted text-muted-foreground border-border" },
  passed: { label: "NÃO VENDIDO", cls: "bg-muted text-muted-foreground border-border" },
  sold: { label: "ARREMATADO", cls: "bg-gold/15 text-gold border-gold/30" },
  "": { label: "PENDENTE", cls: "bg-muted text-muted-foreground border-border" },
};

   export function StatusBadge({ status, className, urgent }: { status: string | null | undefined; className?: string; urgent?: boolean }) {
    const safeStatus = (status || "").toLowerCase();

    if (status && !map[safeStatus]) {
      logger.warn(`Status desconhecido recebido: "${status}". Usando estilo padrão.`, { status });
    }

    let s = map[safeStatus] || { 
      label: status || "PENDENTE", 
      cls: "bg-muted text-muted-foreground border-border" 
    };

    if (urgent && (safeStatus === 'recebendo_lances' || safeStatus === 'live' || safeStatus === 'active')) {
      s = { 
        label: "ÚLTIMOS MINUTOS!", 
        cls: "bg-live/20 text-live border-live shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-blink-fast", 
        dot: true 
      };
    }
 
    return (
      <span 
        role="status"
        aria-label={`Status: ${s.label}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
          s.cls,
          className
        )}
      >
        {s.dot && <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse-live", (safeStatus === 'upcoming' || safeStatus === 'scheduled' || safeStatus === 'loteamento') ? 'bg-upcoming' : 'bg-emerald-bright')} />}
       {s.label}
     </span>
   );
 }
