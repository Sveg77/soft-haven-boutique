import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Session = {
  id: string;
  customer_name: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ChatMsg = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  active: "Активен",
  needs_operator: "Нужен оператор",
  closed: "Закрыт",
};
const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  needs_operator: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-600",
};

export default function AdminChats() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [operatorInput, setOperatorInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Session[];
    },
  });

  // Realtime for sessions list
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Load messages when session selected
  useEffect(() => {
    if (!selectedSession) return;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", selectedSession.id)
        .order("created_at", { ascending: true });
      if (data) setChatMessages(data as ChatMsg[]);
    })();

    const channel = supabase
      .channel(`admin-chat-msg-${selectedSession.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `session_id=eq.${selectedSession.id}`,
      }, (payload) => {
        setChatMessages((prev) => [...prev, payload.new as ChatMsg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendOperatorMsg = async () => {
    if (!selectedSession || !operatorInput.trim()) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      session_id: selectedSession.id,
      role: "operator",
      content: operatorInput.trim(),
    });
    if (error) toast.error("Ошибка отправки");
    else setOperatorInput("");
    setSending(false);
  };

  const closeSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_sessions").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Сессия закрыта");
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setSelectedSession(null);
    },
  });

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Чаты</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="needs_operator">Нужен оператор</SelectItem>
            <SelectItem value="closed">Закрытые</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Нет чатов</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <Card
              key={s.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${s.status === "needs_operator" ? "border-destructive" : ""}`}
              onClick={() => setSelectedSession(s)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{s.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{s.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[s.status] || ""} variant="secondary">
                    {statusLabels[s.status] || s.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(s.created_at), "dd MMM HH:mm", { locale: ru })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(v) => !v && setSelectedSession(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedSession?.customer_name} ({selectedSession?.phone})</span>
              {selectedSession?.status !== "closed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedSession && closeSession.mutate(selectedSession.id)}
                >
                  Закрыть сессию
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-2">
            <div className="space-y-2 p-1">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
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
                    {m.role !== "user" && (
                      <span className="text-[10px] font-semibold block mb-0.5 opacity-70">
                        {m.role === "operator" ? "Оператор" : "Бот"}
                      </span>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {selectedSession?.status !== "closed" && (
            <form
              onSubmit={(e) => { e.preventDefault(); sendOperatorMsg(); }}
              className="flex gap-2 pt-2 border-t"
            >
              <Input
                value={operatorInput}
                onChange={(e) => setOperatorInput(e.target.value)}
                placeholder="Ответ оператора..."
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!operatorInput.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
