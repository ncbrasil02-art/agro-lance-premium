import { useEffect, useState } from "react";

export function Countdown({ endsAt, className }: { endsAt: string; className?: string }) {
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

  if (diff === 0) return <span className={className} suppressHydrationWarning>Encerrado</span>;

  return (
    <span className={className} suppressHydrationWarning>
      {d > 0 ? `${d}d ` : ""}
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}
