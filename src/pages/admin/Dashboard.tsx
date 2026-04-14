import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { ShoppingBag, Package, TrendingUp, ClipboardList } from "lucide-react";
import { useState, useMemo } from "react";
import { subDays, subMonths, startOfDay, isAfter, parseISO } from "date-fns";

const periodOptions = [
  { value: "1d", label: "День" },
  { value: "7d", label: "Неделя" },
  { value: "30d", label: "Месяц" },
  { value: "90d", label: "3 месяца" },
  { value: "180d", label: "6 месяцев" },
  { value: "365d", label: "12 месяцев" },
  { value: "custom", label: "Произвольный" },
];

const statusLabels: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  shipped: "Передан на доставку",
  delivering: "Доставка",
  done: "Выполнена",
  archived: "Архив",
};

const statusColors: Record<string, string> = {
  new: "text-blue-600",
  in_progress: "text-yellow-600",
  shipped: "text-purple-600",
  delivering: "text-orange-600",
  done: "text-green-600",
  archived: "text-muted-foreground",
};

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "1d": return startOfDay(now);
    case "7d": return subDays(now, 7);
    case "30d": return subMonths(now, 1);
    case "90d": return subMonths(now, 3);
    case "180d": return subMonths(now, 6);
    case "365d": return subMonths(now, 12);
    default: return new Date(0);
  }
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredOrders = useMemo(() => {
    if (period === "custom") {
      const from = customFrom ? startOfDay(parseISO(customFrom)) : new Date(0);
      const to = customTo ? new Date(parseISO(customTo).getTime() + 86400000) : new Date();
      return orders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= from && d <= to;
      });
    }
    const start = getStartDate(period);
    return orders.filter((o) => isAfter(new Date(o.created_at), start));
  }, [orders, period, customFrom, customTo]);

  const totalOrders = filteredOrders.length;
  const totalSales = filteredOrders.reduce((s, o) => s + Number(o.total), 0);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of filteredOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Дашборд</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Период</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {periodOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {period === "custom" && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">От</label>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">До</label>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-40" />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Заказов</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalOrders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Сумма продаж</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalSales.toLocaleString()} ₽</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">По статусам</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="text-center p-3 rounded-lg bg-accent/50">
                <p className={`text-2xl font-bold ${statusColors[key] || ""}`}>{statusCounts[key] || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild variant="outline"><Link to="/admin/orders"><ShoppingBag className="h-4 w-4 mr-2" /> Заказы</Link></Button>
        <Button asChild variant="outline"><Link to="/admin/products"><Package className="h-4 w-4 mr-2" /> Товары</Link></Button>
      </div>
    </div>
  );
}
