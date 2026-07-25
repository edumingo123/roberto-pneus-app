import { getDemoStore, newId } from "./demo-store";
import type {
  ChatConversationListItem,
  ChatConversationRecord,
  ChatMessageRecord,
  ChatTypingState,
} from "./types";
import type { SessionUser } from "@/types";

function pushNotification(params: {
  tenantId: string;
  title: string;
  body: string;
  href: string;
  userId?: string | null;
}) {
  const store = getDemoStore();
  store.notifications.unshift({
    id: newId(),
    tenantId: params.tenantId,
    userId: params.userId ?? null,
    title: params.title,
    body: params.body,
    href: params.href,
    read: false,
    createdAt: new Date().toISOString(),
  });
  // keep last 100
  store.notifications = store.notifications.slice(0, 100);
}

export function canAccessConversation(
  user: SessionUser,
  conversation: ChatConversationRecord
): boolean {
  if (conversation.tenantId !== user.tenantId) return false;
  if (user.role === "ADMIN" || user.role === "RECEPCIONISTA") return true;
  if (user.role === "MECANICO") {
    const store = getDemoStore();
    const os = store.serviceOrders.find(
      (o) => o.id === conversation.serviceOrderId
    );
    return os?.mechanicId === user.id || os?.mechanicId == null;
  }
  return false;
}

export async function listConversations(
  user: SessionUser
): Promise<ChatConversationListItem[]> {
  const store = getDemoStore();
  let convs = store.chatConversations.filter(
    (c) => c.tenantId === user.tenantId && c.isActive
  );

  if (user.role === "MECANICO") {
    convs = convs.filter((c) => canAccessConversation(user, c));
  }

  return convs
    .map((c) => {
      const client = store.clients.find((x) => x.id === c.clientId);
      const os = store.serviceOrders.find((x) => x.id === c.serviceOrderId);
      const vehicle = os
        ? store.vehicles.find((v) => v.id === os.vehicleId)
        : null;
      const mechanic = os?.mechanicId
        ? store.users.find((u) => u.id === os.mechanicId)
        : null;
      const messages = store.chatMessages
        .filter((m) => m.conversationId === c.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      const last = messages[0] ?? null;
      const unread = messages.filter(
        (m) => !m.readAt && m.isFromClient
      ).length;

      return {
        ...c,
        clientName: client?.name ?? "Cliente",
        clientWhatsapp: client?.whatsapp ?? "",
        osNumber: os?.number ?? 0,
        vehiclePlate: vehicle?.plate ?? "—",
        mechanicId: os?.mechanicId ?? null,
        mechanicName: mechanic?.name ?? null,
        lastMessage: last?.content || (last?.imageUrl ? "📷 Imagem" : null),
        lastMessageAt: last?.createdAt ?? c.updatedAt,
        unreadCount: unread,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt ?? 0).getTime() -
        new Date(a.lastMessageAt ?? 0).getTime()
    );
}

export async function getConversationForUser(
  user: SessionUser,
  conversationId: string
): Promise<ChatConversationListItem | null> {
  const list = await listConversations(user);
  return list.find((c) => c.id === conversationId) ?? null;
}

export async function getOrCreateConversationForOs(
  tenantId: string,
  serviceOrderId: string
): Promise<ChatConversationRecord> {
  const store = getDemoStore();
  const os = store.serviceOrders.find(
    (o) => o.id === serviceOrderId && o.tenantId === tenantId
  );
  if (!os) throw new Error("OS não encontrada");

  let conv = store.chatConversations.find(
    (c) => c.serviceOrderId === serviceOrderId && c.tenantId === tenantId
  );
  if (conv) return conv;

  const ts = new Date().toISOString();
  conv = {
    id: newId(),
    tenantId,
    serviceOrderId,
    clientId: os.clientId,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  };
  store.chatConversations.unshift(conv);
  return conv;
}

export async function getConversationByOsPublicToken(
  token: string
): Promise<{
  conversation: ChatConversationRecord;
  osNumber: number;
  clientName: string;
} | null> {
  const store = getDemoStore();
  const os = store.serviceOrders.find((o) => o.publicToken === token);
  if (!os) return null;
  const conversation = await getOrCreateConversationForOs(
    os.tenantId,
    os.id
  );
  const client = store.clients.find((c) => c.id === os.clientId);
  return {
    conversation,
    osNumber: os.number,
    clientName: client?.name ?? "Cliente",
  };
}

export async function listMessages(
  conversationId: string,
  after?: string
): Promise<ChatMessageRecord[]> {
  const store = getDemoStore();
  let msgs = store.chatMessages.filter(
    (m) => m.conversationId === conversationId
  );
  if (after) {
    const t = new Date(after).getTime();
    msgs = msgs.filter((m) => new Date(m.createdAt).getTime() > t);
  }
  return msgs.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export async function sendChatMessage(params: {
  conversationId: string;
  tenantId: string;
  senderUserId: string | null;
  senderName: string;
  isFromClient: boolean;
  content?: string | null;
  imageUrl?: string | null;
}): Promise<ChatMessageRecord> {
  const store = getDemoStore();
  const conv = store.chatConversations.find(
    (c) => c.id === params.conversationId && c.tenantId === params.tenantId
  );
  if (!conv) throw new Error("Conversa não encontrada");
  if (!params.content?.trim() && !params.imageUrl) {
    throw new Error("Mensagem vazia");
  }

  const ts = new Date().toISOString();
  const msg: ChatMessageRecord = {
    id: newId(),
    conversationId: params.conversationId,
    senderUserId: params.senderUserId,
    senderName: params.senderName,
    isFromClient: params.isFromClient,
    content: params.content?.trim() || null,
    imageUrl: params.imageUrl || null,
    channel: "APP_CHAT",
    readAt: params.isFromClient ? null : ts,
    createdAt: ts,
  };
  store.chatMessages.push(msg);
  conv.updatedAt = ts;

  if (params.isFromClient) {
    pushNotification({
      tenantId: params.tenantId,
      title: "Nova mensagem no chat",
      body: `${params.senderName}: ${params.content?.slice(0, 80) || "Enviou uma imagem"}`,
      href: `/chat?c=${params.conversationId}`,
    });
  }

  return msg;
}

export async function markMessagesRead(
  conversationId: string,
  asStaff: boolean
): Promise<number> {
  const store = getDemoStore();
  const ts = new Date().toISOString();
  let count = 0;
  for (const m of store.chatMessages) {
    if (m.conversationId !== conversationId || m.readAt) continue;
    // staff marks client messages as read; client marks staff messages
    if (asStaff && m.isFromClient) {
      m.readAt = ts;
      count++;
    } else if (!asStaff && !m.isFromClient) {
      m.readAt = ts;
      count++;
    }
  }
  return count;
}

export async function setTyping(params: {
  conversationId: string;
  userId: string;
  userName: string;
  isFromClient: boolean;
}): Promise<void> {
  const store = getDemoStore();
  const expiresAt = Date.now() + 4000;
  store.chatTyping = store.chatTyping.filter(
    (t) =>
      t.conversationId !== params.conversationId ||
      t.userId !== params.userId
  );
  store.chatTyping.push({
    conversationId: params.conversationId,
    userId: params.userId,
    userName: params.userName,
    isFromClient: params.isFromClient,
    expiresAt,
  });
}

export async function getTyping(
  conversationId: string,
  excludeUserId?: string
): Promise<ChatTypingState[]> {
  const store = getDemoStore();
  const now = Date.now();
  store.chatTyping = store.chatTyping.filter((t) => t.expiresAt > now);
  return store.chatTyping.filter(
    (t) =>
      t.conversationId === conversationId &&
      t.userId !== excludeUserId
  );
}

export async function getUnreadChatCount(user: SessionUser): Promise<number> {
  const list = await listConversations(user);
  return list.reduce((s, c) => s + c.unreadCount, 0);
}

export async function listNotifications(
  tenantId: string,
  limit = 20
) {
  return getDemoStore()
    .notifications.filter((n) => n.tenantId === tenantId)
    .slice(0, limit);
}

export async function markNotificationRead(
  tenantId: string,
  id: string
): Promise<void> {
  const n = getDemoStore().notifications.find(
    (x) => x.id === id && x.tenantId === tenantId
  );
  if (n) n.read = true;
}

export async function markAllNotificationsRead(
  tenantId: string
): Promise<void> {
  for (const n of getDemoStore().notifications) {
    if (n.tenantId === tenantId) n.read = true;
  }
}
