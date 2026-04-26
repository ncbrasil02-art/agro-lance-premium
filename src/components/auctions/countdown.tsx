import { useEffect, useState } from "react";

export function Countdown({ endsAt, className, variant = "default" }: { endsAt: string; className?: string; variant?: "default" | "segmented" }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const endTime = new Date(endsAt).getTime();
  if (isNaN(endTime)) return <span className={className}>Data inválida</span>;
  const diff = Math.max(0, endTime - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);

   if (diff <= 0) return <span className={className} suppressHydrationWarning>{variant === 'segmented' ? '00:00:00' : 'Encerrado'}</span>;

  if (variant === "segmented") {
    return (
      <div className={`flex gap-3 ${className}`} suppressHydrationWarning>
        {d > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-black">{String(d).padStart(2, "0")}</span>
            <span className="text-[8px] uppercase font-bold text-white/40">Dias</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-2xl md:text-4xl font-black">{String(h).padStart(2, "0")}</span>
          <span className="text-[8px] uppercase font-bold text-white/40">Horas</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl md:text-4xl font-black">{String(m).padStart(2, "0")}</span>
          <span className="text-[8px] uppercase font-bold text-white/40">Min</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl md:text-4xl font-black text-gold">{String(s).padStart(2, "0")}</span>
          <span className="text-[8px] uppercase font-bold text-white/40">Seg</span>
        </div>
      </div>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {d > 0 ? `${d}d ` : ""}
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}
