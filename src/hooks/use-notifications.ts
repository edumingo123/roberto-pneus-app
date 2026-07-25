"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getUnreadCountAction,
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/chat";
import type { AppNotificationRecord } from "@/lib/data/types";

/**
 * Polls unread chat + system notifications.
 * Ready to plug Web Push later (subscribe + service worker).
 */
export function useNotifications(pollMs = 4000) {
  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [items, setItems] = useState<AppNotificationRecord[]>([]);
  const [prevChat, setPrevChat] = useState(0);

  const refresh = useCallback(async () => {
    const [counts, list] = await Promise.all([
      getUnreadCountAction(),
      listNotificationsAction(),
    ]);
    if (counts.success) {
      if (counts.data.chat > prevChat && prevChat > 0) {
        toast.message("Nova mensagem no chat", {
          description: "Abra o Chat para responder",
        });
      }
      setPrevChat(counts.data.chat);
      setChatUnread(counts.data.chat);
      setNotifUnread(counts.data.notifications);
    }
    if (list.success) setItems(list.data);
  }, [prevChat]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  async function markRead(id: string) {
    await markNotificationReadAction(id);
    await refresh();
  }

  async function markAllRead() {
    await markAllNotificationsReadAction();
    await refresh();
  }

  return {
    chatUnread,
    notifUnread,
    items,
    refresh,
    markRead,
    markAllRead,
    totalBadge: chatUnread + notifUnread,
  };
}

/** Future Web Push scaffold */
export async function requestPushPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}
