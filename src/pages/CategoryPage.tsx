import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

function ProductCard({ p }: { p: any }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image_url: p.image_url,
      });
    }
    toast({
      title: "Добавлено в корзину",
      description: `${p.name} × ${qty}`,
    });
    setQty(1);
  };

  return (
    <div className="group flex flex-col h-full">
      <Link to={`/product/${p.id}`}>
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-3">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Фото</div>
          )}
        </div>
        <h3 className="font-medium text-sm mt-0.5">{p.name}</h3>
        <p className="font-semibold text-sm mt-1">{Number(p.price).toLocaleString()} ₽</p>
      </Link>
      <div className="mt-auto pt-3 flex items-center gap-2">
        <div className="flex items-center border rounded-full">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="p-1.5 hover:bg-muted rounded-l-full transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-2 text-sm min-w-[1.5rem] text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="p-1.5 hover:bg-muted rounded-r-full transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button onClick={handleAdd} size="sm" className="rounded-full flex-1 text-xs">
          <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Купить
        </Button>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["category-products", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("category_id", category!.id)
        .eq("in_stock", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-2">
          <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Каталог
          </Link>
        </div>
        <h1 className="font-serif text-3xl font-semibold mb-6">{category?.name || "Категория"}</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Загрузка...</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">Товары не найдены</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
