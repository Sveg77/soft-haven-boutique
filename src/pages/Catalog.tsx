import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", activeCategory],
    queryFn: async () => {
      let q = supabase.from("products").select("*, categories(name, slug)").eq("in_stock", true).order("created_at", { ascending: false });
      if (activeCategory !== "all") {
        const cat = categories.find((c) => c.slug === activeCategory);
        if (cat) q = q.eq("category_id", cat.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: activeCategory === "all" || categories.length > 0,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-semibold mb-6">Каталог</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSearchParams({})}
          >
            Все
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={activeCategory === c.slug ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSearchParams({ category: c.slug })}
            >
              {c.name}
            </Button>
          ))}
        </div>

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
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Фото</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.categories?.name}</p>
                <h3 className="font-medium text-sm mt-0.5">{p.name}</h3>
                <p className="font-semibold text-sm mt-1">{Number(p.price).toLocaleString()} ₽</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
