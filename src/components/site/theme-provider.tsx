 import { useSiteSettings } from "@/hooks/useSiteSettings";
 import { hexToOklch } from "@/utils/colors";
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
       if (siteTheme.background_color) {
         root.style.setProperty("--background", siteTheme.background_color);
       }
       // Accent
       if (siteTheme.accent_color) {
         root.style.setProperty("--accent", siteTheme.accent_color);
       }
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
