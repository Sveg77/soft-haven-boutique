import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Clock, Truck } from "lucide-react";

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
              <Link key={p.id} to={`/product/${p.id}`} className="group">
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
                <div className="mt-2 space-y-1">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> Магазин: 10:00–20:00
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Truck className="h-3 w-3" /> Доставка: 10:00–18:00
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
