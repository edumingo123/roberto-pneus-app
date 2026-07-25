"use client";

import { useEffect } from "react";

/** Registers the service worker in production (and when explicitly allowed). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const enableInDev = process.env.NEXT_PUBLIC_PWA_DEV === "true";
    if (process.env.NODE_ENV !== "production" && !enableInDev) {
      // Unregister any old SW in pure dev to avoid stale caches
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => void r.unregister());
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Silent fail — app works without offline cache
    });
  }, []);

  return null;
}
