"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, MessageCircle, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionUser, TenantInfo } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { isDemoModeClient } from "@/lib/auth/demo-client";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: SessionUser;
  tenant: TenantInfo;
  title?: string;
}

export function Header({ user, tenant, title }: HeaderProps) {
  const router = useRouter();
  const { chatUnread, notifUnread, items, markRead, markAllRead, totalBadge } =
    useNotifications(5000);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!notifOpen) return;

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = notifRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setNotifOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setNotifOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notifOpen]);

  async function handleLogout() {
    if (!isDemoModeClient()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    router.push("/login");
    router.refresh();
  }

  async function handleMarkAll() {
    await markAllRead();
    setNotifOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center gap-2 md:gap-3 border-b border-border bg-card/90 backdrop-blur px-4 md:px-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
          {title ?? "Dashboard"}
        </h1>
        <p className="text-xs text-muted-foreground truncate md:hidden">
          {tenant.name}
        </p>
      </div>

      <div className="hidden md:flex relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente, OS, placa..."
          className="pl-9 h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-brand-orange"
          disabled
        />
      </div>

      <Link
        href="/chat"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted"
        aria-label="Chat"
        title="Chat"
      >
        <MessageCircle className="h-5 w-5" />
        {chatUnread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand-orange text-[10px] text-white flex items-center justify-center font-bold">
            {chatUnread > 9 ? "9+" : chatUnread}
          </span>
        ) : null}
      </Link>

      {/* Notifications dropdown — controlled open/close */}
      <div className="relative" ref={notifRef}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl relative"
          aria-label="Notificações"
          aria-expanded={notifOpen}
          aria-haspopup="true"
          onClick={() => setNotifOpen((o) => !o)}
        >
          <Bell className="h-5 w-5" />
          {totalBadge > 0 ? (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-orange" />
          ) : null}
        </Button>

        {notifOpen ? (
          <div
            role="dialog"
            aria-label="Painel de notificações"
            className={cn(
              "absolute right-0 top-full mt-1 w-[min(20rem,calc(100vw-2rem))] rounded-xl border bg-card shadow-lg p-2 z-50"
            )}
          >
            <div className="flex items-center justify-between px-2 py-1.5 gap-2">
              <p className="text-sm font-semibold">Notificações</p>
              <div className="flex items-center gap-2">
                {notifUnread > 0 ? (
                  <button
                    type="button"
                    className="text-[11px] text-brand-orange hover:underline"
                    onClick={() => void handleMarkAll()}
                  >
                    Marcar todas
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
                  aria-label="Fechar notificações"
                  onClick={() => setNotifOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  Nenhuma notificação
                </p>
              ) : (
                items.slice(0, 8).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={cn(
                      "w-full text-left rounded-lg px-2 py-2 hover:bg-muted/60",
                      !n.read && "bg-brand-orange/5"
                    )}
                    onClick={() => {
                      void markRead(n.id);
                      setNotifOpen(false);
                      if (n.href) router.push(n.href);
                    }}
                  >
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {n.body}
                    </p>
                  </button>
                ))
              )}
            </div>

            {chatUnread > 0 ? (
              <Link
                href="/chat"
                className="block text-center text-xs text-primary font-medium py-2 border-t mt-1"
                onClick={() => setNotifOpen(false)}
              >
                {chatUnread} mensagem(ns) não lida(s) no chat
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl"
        onClick={handleLogout}
        aria-label="Sair"
        title={`Sair (${user.email})`}
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
}
