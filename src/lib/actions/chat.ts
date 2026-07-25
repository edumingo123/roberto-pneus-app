"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/actions/action-result";
import {
  canAccessConversation,
  getConversationByOsPublicToken,
  getConversationForUser,
  getOrCreateConversationForOs,
  getTyping,
  getUnreadChatCount,
  listConversations,
  listMessages,
  listNotifications,
  markAllNotificationsRead,
  markMessagesRead,
  markNotificationRead,
  sendChatMessage,
  setTyping,
} from "@/lib/data/chat";
import { getDemoStore } from "@/lib/data/demo-store";
import type {
  ChatConversationListItem,
  ChatMessageRecord,
  ChatTypingState,
} from "@/lib/data/types";

export async function listConversationsAction(): Promise<
  ActionResult<ChatConversationListItem[]>
> {
  try {
    const session = await requireSession();
    const items = await listConversations(session.user);
    return ok(items);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao listar conversas");
  }
}

export async function openOsConversationAction(
  serviceOrderId: string
): Promise<ActionResult<{ conversationId: string }>> {
  try {
    const session = await requireSession();
    const conv = await getOrCreateConversationForOs(
      session.user.tenantId,
      serviceOrderId
    );
    if (!canAccessConversation(session.user, conv)) {
      return fail("Sem permissão para esta conversa");
    }
    revalidatePath("/chat");
    return ok({ conversationId: conv.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao abrir chat");
  }
}

export async function getMessagesAction(
  conversationId: string,
  after?: string
): Promise<
  ActionResult<{ messages: ChatMessageRecord[]; typing: ChatTypingState[] }>
> {
  try {
    const session = await requireSession();
    const conv = await getConversationForUser(session.user, conversationId);
    if (!conv) return fail("Conversa não encontrada");

    const messages = await listMessages(conversationId, after);
    await markMessagesRead(conversationId, true);
    const typing = await getTyping(conversationId, session.user.id);
    return ok({ messages, typing });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao carregar mensagens");
  }
}

export async function sendMessageAction(params: {
  conversationId: string;
  content?: string;
  imageDataUrl?: string;
}): Promise<ActionResult<ChatMessageRecord>> {
  try {
    const session = await requireSession();
    const conv = await getConversationForUser(
      session.user,
      params.conversationId
    );
    if (!conv) return fail("Conversa não encontrada");

    const msg = await sendChatMessage({
      conversationId: params.conversationId,
      tenantId: session.user.tenantId,
      senderUserId: session.user.id,
      senderName: session.user.name,
      isFromClient: false,
      content: params.content,
      imageUrl: params.imageDataUrl,
    });
    return ok(msg);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao enviar");
  }
}

export async function setTypingAction(
  conversationId: string
): Promise<ActionResult<{ ok: true }>> {
  try {
    const session = await requireSession();
    await setTyping({
      conversationId,
      userId: session.user.id,
      userName: session.user.name,
      isFromClient: false,
    });
    return ok({ ok: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro");
  }
}

export async function getUnreadCountAction(): Promise<
  ActionResult<{ chat: number; notifications: number }>
> {
  try {
    const session = await requireSession();
    const chat = await getUnreadChatCount(session.user);
    const notifs = await listNotifications(session.user.tenantId, 50);
    const notifications = notifs.filter((n) => !n.read).length;
    return ok({ chat, notifications });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro");
  }
}

export async function listNotificationsAction() {
  try {
    const session = await requireSession();
    const items = await listNotifications(session.user.tenantId);
    return ok(items);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro");
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    const session = await requireSession();
    await markNotificationRead(session.user.tenantId, id);
    return ok({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro");
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const session = await requireSession();
    await markAllNotificationsRead(session.user.tenantId);
    return ok({ ok: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro");
  }
}

/** Public client chat via OS token */
export async function publicGetChatAction(token: string) {
  try {
    const ctx = await getConversationByOsPublicToken(token);
    if (!ctx) return fail("OS não encontrada");
    const messages = await listMessages(ctx.conversation.id);
    await markMessagesRead(ctx.conversation.id, false);
    const typing = await getTyping(ctx.conversation.id, `client:${token}`);
    return ok({
      conversationId: ctx.conversation.id,
      osNumber: ctx.osNumber,
      clientName: ctx.clientName,
      messages,
      typing,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro no chat público");
  }
}

export async function publicSendChatAction(params: {
  token: string;
  content?: string;
  imageDataUrl?: string;
}) {
  try {
    const ctx = await getConversationByOsPublicToken(params.token);
    if (!ctx) return fail("OS não encontrada");
    const store = getDemoStore();
    const os = store.serviceOrders.find(
      (o) => o.publicToken === params.token
    );
    if (!os) return fail("OS não encontrada");

    const msg = await sendChatMessage({
      conversationId: ctx.conversation.id,
      tenantId: os.tenantId,
      senderUserId: null,
      senderName: ctx.clientName,
      isFromClient: true,
      content: params.content,
      imageUrl: params.imageDataUrl,
    });
    return ok(msg);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao enviar");
  }
}

export async function publicSetTypingAction(token: string) {
  try {
    const ctx = await getConversationByOsPublicToken(token);
    if (!ctx) return fail("OS não encontrada");
    await setTyping({
      conversationId: ctx.conversation.id,
      userId: `client:${token}`,
      userName: ctx.clientName,
      isFromClient: true,
    });
    return ok({ ok: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro");
  }
}
