"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ChatMessageRecord } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  publicGetChatAction,
  publicSendChatAction,
  publicSetTypingAction,
} from "@/lib/actions/chat";
import { cn } from "@/lib/utils";

export function PublicChat({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await publicGetChatAction(token);
    if (!res.success) return;
    setMessages(res.data.messages);
    const staff = res.data.typing.filter((t) => !t.isFromClient);
    setTyping(
      staff.length
        ? `${staff[0].userName.split(" ")[0]} digitando…`
        : null
    );
  }, [token]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const id = setInterval(() => void refresh(), 2500);
    return () => clearInterval(id);
  }, [open, refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function send(imageDataUrl?: string) {
    if (!text.trim() && !imageDataUrl) return;
    setSending(true);
    try {
      const res = await publicSendChatAction({
        token,
        content: text,
        imageDataUrl,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setText("");
      setMessages((m) => [...m, res.data]);
    } finally {
      setSending(false);
    }
  }

  async function onImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      toast.error("Imagem inválida (máx 3MB)");
      return;
    }
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((s, b) => s + String.fromCharCode(b), "")
    );
    await send(`data:${file.type};base64,${base64}`);
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-xl bg-[#0A2540] hover:bg-[#0A2540]/90 text-white font-semibold"
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        Falar com a oficina
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col h-[420px]">
      <div className="h-12 px-4 flex items-center justify-between bg-[#0A2540] text-white">
        <span className="font-semibold text-sm">Chat da OS</span>
        <button
          type="button"
          className="text-xs opacity-80"
          onClick={() => setOpen(false)}
        >
          Fechar
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#ECE5DD]/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.isFromClient ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                m.isFromClient
                  ? "bg-[#DCF8C6] rounded-br-md"
                  : "bg-white rounded-bl-md"
              )}
            >
              {m.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.imageUrl}
                  alt=""
                  className="rounded-lg max-h-40 mb-1"
                />
              ) : null}
              {m.content ? <p className="whitespace-pre-wrap">{m.content}</p> : null}
              <p className="text-[10px] text-slate-500 text-right mt-1">
                {format(new Date(m.createdAt), "HH:mm")}
              </p>
            </div>
          </div>
        ))}
        {typing ? (
          <p className="text-xs text-slate-500 italic">{typing}</p>
        ) : null}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t flex gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onImage(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            void publicSetTypingAction(token);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Sua mensagem..."
          className="h-10 rounded-xl"
        />
        <Button
          type="button"
          className="h-10 w-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white p-0"
          disabled={sending}
          onClick={() => void send()}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
