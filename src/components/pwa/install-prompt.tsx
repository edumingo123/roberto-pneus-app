"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rp-pwa-install-dismissed";

/**
 * Shows an install banner when the browser fires beforeinstallprompt.
 * iOS: shows a tip to use "Add to Home Screen".
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [iosTip, setIosTip] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    if (isIOS) {
      setIosTip(true);
      setVisible(true);
      return;
    }

    function onBip(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed z-[60] left-3 right-3 md:left-auto md:right-6 md:w-96",
        "bottom-[4.75rem] md:bottom-6",
        "rounded-2xl border border-border bg-card shadow-xl p-4",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      role="dialog"
      aria-label="Instalar aplicativo"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          RP
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">Instalar Roberto Pneus</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {iosTip
              ? 'No Safari: toque em Compartilhar e depois em "Adicionar à Tela de Início".'
              : "Instale o app na tela inicial para acesso rápido na oficina."}
          </p>
          <div className="flex gap-2 mt-3">
            {!iosTip && deferred ? (
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white"
                onClick={() => void install()}
              >
                <Download className="h-4 w-4 mr-1" />
                Instalar
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={dismiss}
            >
              Agora não
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted shrink-0"
          onClick={dismiss}
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
