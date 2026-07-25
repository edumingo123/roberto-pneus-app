"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  ChatConversationListItem,
  ChatMessageRecord,
} from "@/lib/data/types";
import { formatPlate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getMessagesAction,
  listConversationsAction,
  sendMessageAction,
  setTypingAction,
} from "@/lib/actions/chat";

interface Props {
  initialConversations: ChatConversationListItem[];
  currentUserId: string;
}

export function ChatWorkspace({
  initialConversations,
  currentUserId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("c");

  const [conversations, setConversations] =
    useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialId || null
  );
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  /** On mobile: show message pane only after selecting a conversation */
  const [mobileShowChat, setMobileShowChat] = useState(!!initialId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFetch = useRef<string | undefined>(undefined);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const refreshConversations = useCallback(async () => {
    const res = await listConversationsAction();
    if (res.success) setConversations(res.data);
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, incremental = false) => {
      if (!incremental) setLoadingMsgs(true);
      try {
        const res = await getMessagesAction(
          conversationId,
          incremental ? lastFetch.current : undefined
        );
        if (!res.success) {
          if (!incremental) toast.error(res.error);
          return;
        }
        if (incremental && res.data.messages.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            return [
              ...prev,
              ...res.data.messages.filter((m) => !ids.has(m.id)),
            ];
          });
        } else if (!incremental) {
          setMessages(res.data.messages);
          if (res.data.messages.length) {
            lastFetch.current =
              res.data.messages[res.data.messages.length - 1]?.createdAt;
          }
        }
        if (incremental && res.data.messages.length) {
          lastFetch.current =
            res.data.messages[res.data.messages.length - 1]?.createdAt;
        }
        const others = res.data.typing.filter(
          (t) => t.userId !== currentUserId
        );
        setTypingLabel(
          others.length
            ? `${others.map((t) => t.userName.split(" ")[0]).join(", ")} digitando…`
            : null
        );
        void refreshConversations();
      } finally {
        setLoadingMsgs(false);
      }
    },
    [currentUserId, refreshConversations]
  );

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    lastFetch.current = undefined;
    void loadMessages(activeId, false);
    const id = setInterval(() => void loadMessages(activeId, true), 2500);
    return () => clearInterval(id);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingLabel]);

  useEffect(() => {
    if (active && mobileShowChat) {
      // Focus input when opening a conversation
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [activeId, active, mobileShowChat]);

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileShowChat(true);
    router.replace(`/chat?c=${id}`);
  }

  function backToList() {
    setMobileShowChat(false);
    // keep activeId for desktop; on mobile list is shown
  }

  async function handleSend(imageDataUrl?: string) {
    if (!activeId) return;
    if (!text.trim() && !imageDataUrl) return;
    setSending(true);
    try {
      const res = await sendMessageAction({
        conversationId: activeId,
        content: text,
        imageDataUrl,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setText("");
      setMessages((prev) => [...prev, res.data]);
      lastFetch.current = res.data.createdAt;
      void refreshConversations();
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  async function onType(value: string) {
    setText(value);
    if (activeId && value.trim()) {
      void setTypingAction(activeId);
    }
  }

  async function onImage(file?: File) {
    if (!file || !activeId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Máximo 3MB");
      return;
    }
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (s, b) => s + String.fromCharCode(b),
        ""
      )
    );
    const dataUrl = `data:${file.type};base64,${base64}`;
    await handleSend(dataUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div
      className={cn(
        "flex rounded-xl border bg-card shadow-sm overflow-hidden",
        /* Height: viewport minus header + mobile bottom nav + page padding */
        "h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-6.5rem)]",
        "min-h-[420px]"
      )}
    >
      {/* ── Conversation list ── */}
      <aside
        className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border flex-col bg-card shrink-0",
          mobileShowChat ? "hidden md:flex" : "flex"
        )}
      >
        <div className="h-14 px-4 flex items-center border-b border-border shrink-0">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-brand-orange" />
            Conversas
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Nenhuma conversa"
                description="Abra o chat a partir de uma Ordem de Serviço."
              />
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectConversation(c.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border/60 hover:bg-muted/50 transition-colors",
                  activeId === c.id &&
                    "bg-primary/5 border-l-4 border-l-brand-orange"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      OS #{c.osNumber} · {formatPlate(c.vehiclePlate)}
                    </p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {c.lastMessage ?? "Sem mensagens"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.lastMessageAt ? (
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(c.lastMessageAt), "HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    ) : null}
                    {c.unreadCount > 0 ? (
                      <Badge className="rounded-full bg-brand-orange text-white border-0 h-5 min-w-5 px-1.5 justify-center">
                        {c.unreadCount}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Message pane ── */}
      <section
        className={cn(
          "flex-1 flex-col min-w-0 min-h-0 bg-[#F0EBE3]",
          !mobileShowChat ? "hidden md:flex" : "flex"
        )}
      >
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="h-8 w-8" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Selecione uma conversa
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Escolha um cliente à esquerda para ver as mensagens e enviar
                respostas.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <header className="h-14 px-3 md:px-4 flex items-center gap-2 border-b border-border bg-card shrink-0 z-10">
              <button
                type="button"
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted shrink-0"
                onClick={backToList}
                aria-label="Voltar para conversas"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate leading-tight">
                  {active.clientName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  OS #{active.osNumber} · {formatPlate(active.vehiclePlate)}
                  {active.mechanicName
                    ? ` · Mec: ${active.mechanicName}`
                    : ""}
                </p>
              </div>
            </header>

            {/* Scrollable messages — takes remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 md:px-4 py-3 space-y-2">
              {loadingMsgs && messages.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : null}

              {!loadingMsgs && messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">
                  Nenhuma mensagem ainda. Envie a primeira!
                </p>
              ) : null}

              {messages.map((m) => {
                const mine = !m.isFromClient;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      mine ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm text-sm",
                        mine
                          ? "bg-[#DCF8C6] text-slate-900 rounded-br-md"
                          : "bg-white text-slate-900 rounded-bl-md"
                      )}
                    >
                      {!mine ? (
                        <p className="text-[10px] font-semibold text-brand-orange mb-0.5">
                          {m.senderName}
                        </p>
                      ) : null}
                      {m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.imageUrl}
                          alt="Anexo"
                          className="rounded-lg max-h-48 mb-1 object-cover"
                        />
                      ) : null}
                      {m.content ? (
                        <p className="whitespace-pre-wrap break-words">
                          {m.content}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-slate-500 text-right mt-1">
                        {format(new Date(m.createdAt), "HH:mm")}
                        {mine && m.readAt ? " · lida" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              {typingLabel ? (
                <p className="text-xs text-muted-foreground italic px-2">
                  {typingLabel}
                </p>
              ) : null}
              <div ref={bottomRef} className="h-1" />
            </div>

            {/* Fixed input bar — always visible when conversation is open */}
            <footer
              className={cn(
                "shrink-0 z-20 border-t border-border bg-card",
                "px-2 sm:px-3 py-2 sm:py-2.5",
                /* Safe area above mobile bottom nav */
                "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
              )}
            >
              <form
                className="flex items-center gap-1.5 sm:gap-2 w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => void onImage(e.target.files?.[0])}
                />

                {/* Attach image */}
                <button
                  type="button"
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center",
                    "h-11 w-11 rounded-xl",
                    "text-muted-foreground hover:text-foreground hover:bg-muted",
                    "transition-colors touch-manipulation"
                  )}
                  onClick={() => fileRef.current?.click()}
                  aria-label="Anexar imagem"
                  title="Anexar imagem"
                >
                  <ImagePlus className="h-5 w-5" strokeWidth={2} />
                </button>

                {/* Text field */}
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => void onType(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  autoComplete="off"
                  className={cn(
                    "min-w-0 flex-1 h-11 rounded-xl border border-input bg-background",
                    "px-3.5 text-sm outline-none",
                    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                    "placeholder:text-muted-foreground"
                  )}
                />

                {/* Send */}
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center",
                    "h-11 w-11 rounded-xl",
                    "bg-brand-orange text-white",
                    "hover:bg-brand-orange/90",
                    "disabled:opacity-40 disabled:pointer-events-none",
                    "transition-colors touch-manipulation"
                  )}
                  aria-label="Enviar mensagem"
                  title="Enviar"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" strokeWidth={2} />
                  )}
                </button>
              </form>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
