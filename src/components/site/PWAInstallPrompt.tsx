import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, Smartphone, X } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

const PWACtx = createContext<{ canInstall: boolean; openInstall: () => void }>({
  canInstall: false,
  openInstall: () => {},
});

export const usePWAInstall = () => useContext(PWACtx);

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const { siteInfo } = useSiteSettings();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsIOSDevice(isIOS());
    if (isStandalone()) { setInstalled(true); return; }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
      const days = (Date.now() - dismissed) / 86_400_000;
      if (!dismissed || days > DISMISS_DAYS) {
        setTimeout(() => setOpen(true), 8000);
      }
    };
    const onInstalled = () => { setInstalled(true); setOpen(false); setDeferred(null); };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari: nudge once after 10s if not dismissed and not installed
    if (isIOS() && !isStandalone()) {
      const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
      const days = (Date.now() - dismissed) / 86_400_000;
      if (!dismissed || days > DISMISS_DAYS) {
        const t = setTimeout(() => setOpen(true), 10000);
        return () => {
          clearTimeout(t);
          window.removeEventListener("beforeinstallprompt", onBIP);
          window.removeEventListener("appinstalled", onInstalled);
        };
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canInstall = !installed && (!!deferred || isIOSDevice);

  const openInstall = useCallback(() => setOpen(true), []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
    setOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  return (
    <PWACtx.Provider value={{ canInstall, openInstall }}>
      {children}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleDismiss())}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {siteInfo?.logo_url ? (
                <img src={siteInfo.logo_url} alt="" className="h-12 w-12 rounded-xl object-contain bg-emerald-deep p-1" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-emerald-deep" />
                </div>
              )}
              <div>
                <DialogTitle>Instalar {siteInfo?.name || "o app"}</DialogTitle>
                <DialogDescription>Acesso rápido, notificações e experiência de aplicativo no seu celular.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isIOSDevice && !deferred ? (
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
              <p className="font-semibold">No iPhone / iPad (Safari):</p>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-bold">1</span>
                  Toque em <Share className="inline h-4 w-4" /> <strong>Compartilhar</strong> na barra inferior.
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-bold">2</span>
                  Escolha <Plus className="inline h-4 w-4" /> <strong>Adicionar à Tela de Início</strong>.
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary font-bold">3</span>
                  Toque em <strong>Adicionar</strong>. Pronto!
                </li>
              </ol>
              <p className="text-xs text-muted-foreground pt-1">Notificações push exigem iOS 16.4+ e o app instalado.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm text-muted-foreground">
              Instale para abrir como aplicativo, receber avisos de lances em tempo real e usar offline.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4 mr-1" /> Agora não
            </Button>
            {deferred && (
              <Button onClick={handleInstall} className="bg-gold-gradient text-emerald-deep font-bold">
                <Download className="h-4 w-4 mr-1" /> Instalar agora
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PWACtx.Provider>
  );
}