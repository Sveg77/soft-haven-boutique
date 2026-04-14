import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ ...form, total })
      .select("id")
      .single();

    if (orderError) {
      toast({ title: "Ошибка", description: orderError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.id,
      quantity: i.quantity,
      price: i.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      toast({ title: "Ошибка", description: itemsError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

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
            <div className="space-y-2">
              <Label>Адрес доставки</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </div>

          <div className="border-t pt-4">
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
