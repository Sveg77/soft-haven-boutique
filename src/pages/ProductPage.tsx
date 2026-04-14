import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check, Clock, Truck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Загрузка...</p></main>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center"><p>Товар не найден</p></main>
      <Footer />
    </div>
  );

  const chars = (product.characteristics as Record<string, string>) || {};

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url });
    toast({ title: "Добавлено в корзину", description: product.name });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Фото</div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm text-muted-foreground mb-1">{(product as any).categories?.name}</p>
            <h1 className="font-serif text-3xl font-semibold mb-2">{product.name}</h1>
            <p className="text-2xl font-bold mb-4">{Number(product.price).toLocaleString()} ₽</p>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}
            {Object.keys(chars).length > 0 && (
              <div className="mb-6 space-y-2">
                <h3 className="font-semibold text-sm">Характеристики</h3>
                {Object.entries(chars).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm border-b border-dashed py-1">
                    <span className="text-muted-foreground">{key}</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              {product.in_stock ? (
                <>
                  <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> В наличии</span>
                  <Button onClick={handleAdd} size="lg" className="rounded-full flex-1">
                    <ShoppingBag className="h-4 w-4 mr-2" /> В корзину
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Нет в наличии</span>
              )}
            </div>
            <div className="mt-4 space-y-1 border-t pt-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Магазин: 10:00–20:00
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" /> Доставка: 10:00–18:00
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
