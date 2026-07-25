"use client";

import { useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  mode?: string;
}

export function AgentPlayground() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou o assistente da Roberto Pneus. Pergunte sobre pneus, estoque, OS ou agendamentos.",
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setText("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, phone: "11999887766" }),
      });
      const data = (await res.json()) as {
        reply?: string;
        toolCalls?: Array<{ name: string }>;
        mode?: string;
        error?: string;
      };
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.error || "Erro ao processar",
          },
        ]);
        return;
      }
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply || "…",
          tools: data.toolCalls?.map((t) => t.name),
          mode: data.mode,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Falha de rede ao chamar o agente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col h-[480px]">
      <div className="h-12 px-4 flex items-center gap-2 border-b bg-primary text-primary-foreground">
        <Bot className="h-5 w-5" />
        <span className="font-semibold text-sm">Agente IA (playground)</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[90%] rounded-2xl px-3 py-2 text-sm shadow-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-brand-orange text-white rounded-br-md"
                  : "bg-card border rounded-bl-md"
              )}
            >
              {m.content}
              {m.tools?.length ? (
                <p className="text-[10px] opacity-70 mt-1">
                  tools: {m.tools.join(", ")} · {m.mode}
                </p>
              ) : null}
            </div>
          </div>
        ))}
        {loading ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> pensando…
          </p>
        ) : null}
      </div>
      <form
        className="p-2 border-t flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: pneu 205/55R16 para Civic 2020"
          className="h-11 rounded-xl flex-1"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-11 rounded-xl bg-brand-orange text-white p-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
