import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Index() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(25,60%,96%)] to-[hsl(15,40%,92%)]" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
              Текстиль с душой
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
              Создаём уют в вашем доме — натуральные ткани, нежные цвета и забота в каждой детали
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/catalog">Перейти в каталог <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-16 container mx-auto px-4">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center mb-10">Наши коллекции</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.slug}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-muted"
                >
                  {cat.image_url && (
                    <img src={cat.image_url} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-white font-medium text-sm md:text-base">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <section className="py-16 bg-accent/30">
            <div className="container mx-auto px-4">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center mb-10">Новинки</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {featured.map((p: any) => (
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
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
