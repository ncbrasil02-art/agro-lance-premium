 import { useSiteSettings } from "@/hooks/useSiteSettings";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

 export function ThemeProvider({ children }: { children: ReactNode }) {
   const [theme, setTheme] = useState<Theme>("dark");
   const { theme: siteTheme } = useSiteSettings();
 
   useEffect(() => {
   useEffect(() => {
     if (siteTheme) {
       const root = document.documentElement;
       // Primary / Gold
       if (siteTheme.primary_color) {
         root.style.setProperty("--gold", siteTheme.primary_color);
         root.style.setProperty("--primary", siteTheme.primary_color);
       }
       // Secondary / Emerald
       if (siteTheme.secondary_color) {
         root.style.setProperty("--emerald-deep", siteTheme.secondary_color);
         root.style.setProperty("--secondary", siteTheme.secondary_color);
       }
       // Background
        if (siteTheme.background_color) root.style.setProperty("--background", siteTheme.background_color);
        if (siteTheme.foreground_color) root.style.setProperty("--foreground", siteTheme.foreground_color);
        if (siteTheme.card_color) root.style.setProperty("--card", siteTheme.card_color);
        if (siteTheme.card_foreground_color) root.style.setProperty("--card-foreground", siteTheme.card_foreground_color);
        if (siteTheme.popover_color) root.style.setProperty("--popover", siteTheme.popover_color);
        if (siteTheme.popover_foreground_color) root.style.setProperty("--popover-foreground", siteTheme.popover_foreground_color);
        if (siteTheme.primary_color) {
          root.style.setProperty("--primary", siteTheme.primary_color);
          root.style.setProperty("--gold", siteTheme.primary_color);
        }
        if (siteTheme.primary_foreground_color) root.style.setProperty("--primary-foreground", siteTheme.primary_foreground_color);
        if (siteTheme.secondary_color) {
          root.style.setProperty("--secondary", siteTheme.secondary_color);
          root.style.setProperty("--emerald-deep", siteTheme.secondary_color);
        }
        if (siteTheme.secondary_foreground_color) root.style.setProperty("--secondary-foreground", siteTheme.secondary_foreground_color);
        if (siteTheme.muted_color) root.style.setProperty("--muted", siteTheme.muted_color);
        if (siteTheme.muted_foreground_color) root.style.setProperty("--muted-foreground", siteTheme.muted_foreground_color);
        if (siteTheme.accent_color) root.style.setProperty("--accent", siteTheme.accent_color);
        if (siteTheme.accent_foreground_color) root.style.setProperty("--accent-foreground", siteTheme.accent_foreground_color);
        if (siteTheme.destructive_color) root.style.setProperty("--destructive", siteTheme.destructive_color);
        if (siteTheme.destructive_foreground_color) root.style.setProperty("--destructive-foreground", siteTheme.destructive_foreground_color);
        if (siteTheme.border_color) root.style.setProperty("--border", siteTheme.border_color);
        if (siteTheme.input_color) root.style.setProperty("--input", siteTheme.input_color);
        if (siteTheme.ring_color) root.style.setProperty("--ring", siteTheme.ring_color);
        if (siteTheme.live_color) root.style.setProperty("--live", siteTheme.live_color);
        if (siteTheme.upcoming_color) root.style.setProperty("--upcoming", siteTheme.upcoming_color);
        if (siteTheme.closed_color) root.style.setProperty("--closed", siteTheme.closed_color);
     }
   }, [siteTheme]);
 
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "dark";
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      applyTheme(next);
      return next;
    });
  };

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeScript() {
  // Prevents flash by setting theme before hydration
  return (
    <ClientOnly fallback={null}>
      <></>
    </ClientOnly>
  );
}
