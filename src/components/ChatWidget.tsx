import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant" | "operator"; content: string };

const STORAGE_KEY = "chat_session_id";

export default function ChatWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load history on session restore
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Msg[]);
    })();
  }, [sessionId]);

  // Realtime subscription for operator messages
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.role === "operator") {
          setMessages((prev) => [...prev, { role: "operator", content: msg.content }]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    if (!formName.trim() || !formPhone.trim() || !accepted) return;
    setFormLoading(true);
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ customer_name: formName.trim(), phone: formPhone.trim() })
      .select("id")
      .single();
    setFormLoading(false);
    if (data) {
      setSessionId(data.id);
      localStorage.setItem(STORAGE_KEY, data.id);
      // Send greeting from AI
      sendMessage("Привет! Помоги мне выбрать товары.", data.id);
    }
  };

  const sendMessage = async (text: string, sid?: string) => {
    const id = sid || sessionId;
    if (!id || !text.trim()) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    if (!sid) setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-bot", {
        body: { session_id: id, message: text.trim() },
      });
      if (error) throw error;
      if (data?.reply) {
        setMessages((prev) => [...prev, ...(sid ? [userMsg] : []), { role: "assistant", content: data.reply }]);
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Произошла ошибка. Попробуйте позже." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) sendMessage(input);
  };

  const resetSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setMessages([]);
    setFormName("");
    setFormPhone("");
    setAccepted(false);
  };

  // Hide on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Открыть чат"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[520px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl">
            <span className="font-semibold text-sm">Уютный Дом — Помощник</span>
            <div className="flex gap-1">
              {sessionId && (
                <button onClick={resetSession} className="text-xs opacity-70 hover:opacity-100 mr-2">
                  Новый чат
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Закрыть">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!sessionId ? (
            /* Registration form */
            <div className="p-4 flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Здравствуйте! Чтобы начать чат, представьтесь:
              </p>
              <Input
                placeholder="Ваше имя"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <Input
                placeholder="Телефон"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
                <span>
                  Я принимаю{" "}
                  <Link to="/privacy" className="underline text-primary" target="_blank">
                    политику конфиденциальности
                  </Link>
                </span>
              </label>
              <Button
                onClick={startSession}
                disabled={!formName.trim() || !formPhone.trim() || !accepted || formLoading}
                className="w-full"
              >
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Начать чат"}
              </Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[280px] max-h-[380px]">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : m.role === "operator"
                          ? "bg-accent text-accent-foreground border"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.role === "operator" && (
                        <span className="text-[10px] font-semibold block mb-0.5 opacity-70">Оператор</span>
                      )}
                      <div className="prose prose-sm max-w-none [&_p]:m-0">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t p-2 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="flex-1 text-sm"
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
