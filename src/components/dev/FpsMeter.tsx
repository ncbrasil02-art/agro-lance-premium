import { useEffect, useState } from "react";

/**
 * Lightweight FPS meter. Renders only when ?fps=1 is present or in dev mode.
 * Uses requestAnimationFrame to sample frames; near-zero overhead.
 */
export function FpsMeter() {
  const [fps, setFps] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const on = params.get("fps") === "1" || import.meta.env.DEV;
    setEnabled(on);
    if (!on) return;

    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!enabled) return null;

  const color = fps >= 50 ? "text-emerald-400" : fps >= 30 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="fixed bottom-2 right-2 z-[9999] pointer-events-none rounded-md bg-black/70 px-2 py-1 font-mono text-xs text-white backdrop-blur-sm">
      <span className={color}>{fps}</span>
      <span className="opacity-60"> fps</span>
    </div>
  );
}