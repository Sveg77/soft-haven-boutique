import { useCart, cartItemKey } from "@/hooks/useCart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, BadgePercent } from "lucide-react";
import { Link } from "react-router-dom";

const DISCOUNT_THRESHOLD = 25000;
const DISCOUNT_PERCENT = 5;

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();

  const hasDiscount = total >= DISCOUNT_THRESHOLD;
  const discountAmount = hasDiscount ? Math.round(total * DISCOUNT_PERCENT / 100) : 0;
  const finalTotal = total - discountAmount;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-semibold mb-6">Корзина</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Корзина пуста</p>
            <Button asChild variant="outline">
              <Link to="/catalog">Перейти в каталог</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const key = cartItemKey(item);
                return (
                  <div key={key} className="flex gap-4 p-4 border rounded-xl">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Фото</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      {(item.color || item.size || item.material) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[item.color, item.size, item.material].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-1">{item.price.toLocaleString()} ₽</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(key, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(key, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeItem(key)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-card border rounded-xl p-6 h-fit space-y-4">
              <h3 className="font-semibold">Итого</h3>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Сумма товаров</span>
                <span>{total.toLocaleString()} ₽</span>
              </div>

              {hasDiscount ? (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <BadgePercent className="h-4 w-4" /> Скидка {DISCOUNT_PERCENT}%
                  </span>
                  <span>−{discountAmount.toLocaleString()} ₽</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-accent/50 rounded-lg p-3">
                  <span className="flex items-center gap-1">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Скидка {DISCOUNT_PERCENT}% при заказе от {DISCOUNT_THRESHOLD.toLocaleString()} ₽
                  </span>
                  <span className="block mt-1">
                    До скидки осталось: {(DISCOUNT_THRESHOLD - total).toLocaleString()} ₽
                  </span>
                </div>
              )}

              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>К оплате</span>
                <span>{finalTotal.toLocaleString()} ₽</span>
              </div>

              <Button asChild className="w-full rounded-full">
                <Link to="/checkout">Оформить заявку</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
