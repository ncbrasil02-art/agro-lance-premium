import { cn } from "@/lib/utils";
import type { EventStatus } from "@/lib/mock-data";

const map: Record<EventStatus | "open" | "scheduled" | "sold", { label: string; cls: string; dot?: boolean }> = {
   live: { label: "AO VIVO", cls: "bg-live/15 text-live border-live/50 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse", dot: true },
  open: { label: "EM LEILÃO", cls: "bg-emerald/15 text-emerald-bright border-emerald/30" },
  upcoming: { label: "EM BREVE", cls: "bg-upcoming/15 text-upcoming border-upcoming/30" },
  scheduled: { label: "AGENDADO", cls: "bg-upcoming/15 text-upcoming border-upcoming/30" },
  closed: { label: "ENCERRADO", cls: "bg-muted text-muted-foreground border-border" },
  sold: { label: "ARREMATADO", cls: "bg-gold/15 text-gold border-gold/30" },
};

export function StatusBadge({ status, className }: { status: keyof typeof map; className?: string }) {
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider", s.cls, className)}>
      {s.dot && <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse-live" />}
      {s.label}
    </span>
  );
}
