import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнена",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
};

export default function AdminOrders() {
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["admin-order-items", selectedOrder],
    enabled: !!selectedOrder,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", selectedOrder!);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const selected = orders.find((o) => o.id === selectedOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Заявки</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="done">Выполненные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">Заявок пока нет</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order.id)}>
                <TableCell>{format(new Date(order.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{order.phone}</TableCell>
                <TableCell>{order.total.toLocaleString()} ₽</TableCell>
                <TableCell>
                  <Badge className={statusColors[order.status] || ""} variant="secondary">
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(status) => {
                      updateStatus.mutate({ id: order.id, status });
                    }}
                  >
                    <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Новая</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="done">Выполнена</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Детали заявки</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <p><strong>Клиент:</strong> {selected.customer_name}</p>
              <p><strong>Телефон:</strong> {selected.phone}</p>
              {selected.email && <p><strong>Email:</strong> {selected.email}</p>}
              <p><strong>Доставка:</strong> {selected.delivery_method === "pickup" ? "Самовывоз" : "Доставка"}</p>
              {selected.address && <p><strong>Адрес:</strong> {selected.address}</p>}
              {selected.delivery_date && (
                <p><strong>Дата доставки:</strong> {format(new Date(selected.delivery_date + "T00:00:00"), "dd.MM.yyyy")}</p>
              )}
              {selected.delivery_time && (
                <p><strong>Время доставки:</strong> {selected.delivery_time.slice(0, 5)}</p>
              )}
              {selected.comment && <p><strong>Комментарий:</strong> {selected.comment}</p>}
              <p><strong>Сумма:</strong> {selected.total.toLocaleString()} ₽</p>
              <div>
                <strong>Состав заказа:</strong>
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Наименование</TableHead>
                      <TableHead className="text-xs">Цвет</TableHead>
                      <TableHead className="text-xs">Размер</TableHead>
                      <TableHead className="text-xs">Материал</TableHead>
                      <TableHead className="text-xs text-right">Кол-во</TableHead>
                      <TableHead className="text-xs text-right">Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">{item.product_name || "—"}</TableCell>
                        <TableCell className="text-xs">{item.color || "—"}</TableCell>
                        <TableCell className="text-xs">{item.size || "—"}</TableCell>
                        <TableCell className="text-xs">{item.material || "—"}</TableCell>
                        <TableCell className="text-xs text-right">{item.quantity}</TableCell>
                        <TableCell className="text-xs text-right">{Number(item.line_total || item.price * item.quantity).toLocaleString()} ₽</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
