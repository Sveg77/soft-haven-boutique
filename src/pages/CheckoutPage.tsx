import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, cartItemKey } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addDays, isAfter, isSameDay, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DELIVERY_START = 10; // 10:00
const DELIVERY_END = 18;   // 18:00
const ORDER_CUTOFF = 13;   // before 13:00 = same-day possible
const MIN_DELAY_HOURS = 3; // +3 hours from now

function getAvailableTimeSlots(date: Date | undefined): string[] {
  if (!date) return [];
  const now = new Date();
  const today = startOfDay(now);
  const isToday = isSameDay(date, today);

  const slots: string[] = [];
  for (let h = DELIVERY_START; h < DELIVERY_END; h++) {
    const timeStr = `${String(h).padStart(2, "0")}:00`;
    if (isToday) {
      const earliest = now.getHours() + MIN_DELAY_HOURS;
      if (h < earliest) continue;
    }
    slots.push(timeStr);
  }
  return slots;
}

function getMinDeliveryDate(): Date {
  const now = new Date();
  const hour = now.getHours();
  if (hour < ORDER_CUTOFF) {
    // Same-day delivery possible if there are slots left
    const earliest = hour + MIN_DELAY_HOURS;
    if (earliest < DELIVERY_END) {
      return startOfDay(now);
    }
  }
  return startOfDay(addDays(now, 1));
}

function isDeliveryDayDisabled(date: Date): boolean {
  const day = date.getDay();
  // Delivery Mon-Sat (0=Sun disabled)
  if (day === 0) return true;
  const minDate = getMinDeliveryDate();
  return isBefore(date, minDate);
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    delivery_method: "pickup",
    comment: "",
  });
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [deliveryTime, setDeliveryTime] = useState("");

  const timeSlots = useMemo(() => getAvailableTimeSlots(deliveryDate), [deliveryDate]);

  // Reset time if no longer available
  const handleDateChange = (date: Date | undefined) => {
    setDeliveryDate(date);
    setDeliveryTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (form.delivery_method === "delivery") {
      if (!deliveryDate) {
        toast({ title: "Выберите дату доставки", variant: "destructive" });
        return;
      }
      if (!deliveryTime) {
        toast({ title: "Выберите время доставки", variant: "destructive" });
        return;
      }
    }

    setLoading(true);

    const orderId = crypto.randomUUID();

    const orderPayload: any = {
      id: orderId,
      ...form,
      total,
      delivery_date: form.delivery_method === "delivery" && deliveryDate
        ? format(deliveryDate, "yyyy-MM-dd")
        : null,
      delivery_time: form.delivery_method === "delivery" && deliveryTime
        ? deliveryTime
        : null,
    };

    const { error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload);

    if (orderError) {
      toast({ title: "Ошибка", description: orderError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: orderId,
      product_id: i.id,
      product_name: i.name,
      color: i.color || null,
      size: i.size || null,
      material: i.material || null,
      quantity: i.quantity,
      price: i.price,
      line_total: i.price * i.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      toast({ title: "Ошибка", description: itemsError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fire-and-forget Telegram notification
    supabase.functions.invoke("notify-telegram", {
      body: {
        order_id: orderId,
        customer_name: form.customer_name,
        phone: form.phone,
        total,
        items: items.map((i) => ({
          product_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        delivery_method: form.delivery_method,
        comment: form.comment,
      },
    }).catch((err) => console.error("Telegram notify error:", err));

    clearCart();
    toast({ title: "Заявка отправлена!", description: "Мы свяжемся с вами в ближайшее время" });
    navigate("/");
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Корзина пуста</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        <h1 className="font-serif text-3xl font-semibold mb-6">Оформление заявки</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Имя *</Label>
            <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Телефон *</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+7 (___) ___-__-__" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Способ получения</Label>
            <RadioGroup value={form.delivery_method} onValueChange={(v) => setForm({ ...form, delivery_method: v })}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup">Самовывоз</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery">Доставка</Label>
              </div>
            </RadioGroup>
          </div>

          {form.delivery_method === "delivery" && (
            <>
              <div className="space-y-2">
                <Label>Адрес доставки *</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>Дата доставки *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deliveryDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, "dd MMMM yyyy", { locale: ru }) : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={handleDateChange}
                      disabled={isDeliveryDayDisabled}
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Доставка: Пн–Сб, 10:00–18:00. Заказ до 13:00 — доставка в тот же день (через 3 ч).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Время доставки *</Label>
                <Select value={deliveryTime} onValueChange={setDeliveryTime} disabled={!deliveryDate}>
                  <SelectTrigger>
                    <SelectValue placeholder={deliveryDate ? "Выберите время" : "Сначала выберите дату"} />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </div>

          <div className="border-t pt-4">
            {/* Order summary */}
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={cartItemKey(item)} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name}
                    {item.color ? ` · ${item.color}` : ""}
                    {item.size ? ` · ${item.size}` : ""}
                    {item.material ? ` · ${item.material}` : ""}
                    {" × "}{item.quantity}
                  </span>
                  <span>{(item.price * item.quantity).toLocaleString()} ₽</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold text-lg mb-4">
              <span>Итого</span>
              <span>{total.toLocaleString()} ₽</span>
            </div>
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? "Отправка..." : "Отправить заявку"}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
