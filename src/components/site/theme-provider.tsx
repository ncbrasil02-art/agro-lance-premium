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

  useEffect(() => {
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
