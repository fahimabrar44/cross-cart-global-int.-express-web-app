"use client";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm the Cross Cart Global assistant. Ask me anything about our courier, freight, tracking or eCommerce logistics services.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const assistantIndex = next.length; // index of the empty assistant msg

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Failed");
        setMessages((prev) => {
          const copy = [...prev];
          copy[assistantIndex] = {
            role: "assistant",
            content: errText || "Failed to get response.",
          };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[assistantIndex] = {
            role: "assistant",
            content: (copy[assistantIndex]?.content || "") + chunk,
          };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          copy[assistantIndex] = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          };
          return copy;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        aria-label="Open chat"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-sm font-semibold">Cross Cart Global Assistant</p>
              <p className="text-xs opacity-80">Ask about shipping & tracking</p>
            </div>
            <button
              aria-label="Close chat"
              onClick={() => {
                abortRef.current?.abort();
                setOpen(false);
              }}
              className="rounded-full p-1 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-section p-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  {m.content || (loading && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-gray-200 bg-white p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type your message…"
              className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
