import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Truck, ShieldCheck, Heart, Sparkles, Headphones, Home, Baby, Hotel, Gift, Sofa, CalendarHeart } from "lucide-react";

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
            <h1 className="font-serif text-5xl md:text-8xl font-bold tracking-tight text-foreground dark:text-background mb-4">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalog/${cat.slug}`}
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

        {/* Benefits */}
        <section className="py-16 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-3">Почему выбирают нас</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Мы заботимся о каждой детали, чтобы ваш дом стал ещё уютнее</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Leaf, title: "Натуральные материалы", text: "Только проверенные ткани: хлопок, лён, бамбук — безопасно для всей семьи" },
              { icon: Sparkles, title: "Премиальное качество", text: "Тщательный контроль на каждом этапе — от закупки до упаковки" },
              { icon: Truck, title: "Быстрая доставка", text: "Доставим по Москве за 1 день, в регионы — от 2 дней" },
              { icon: ShieldCheck, title: "Гарантия возврата", text: "14 дней на обмен или возврат, если товар не подошёл" },
              { icon: Heart, title: "Авторские коллекции", text: "Уникальные дизайны, которые вы не найдёте в других магазинах" },
              { icon: Headphones, title: "Поддержка 7 дней в неделю", text: "Поможем с выбором и ответим на любые вопросы" },
            ].map((b, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-border/60 bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* For whom & occasions */}
        <section className="py-16 bg-accent/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
              {/* Для кого */}
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-3 text-center">Для кого наш текстиль</h2>
                <p className="text-muted-foreground mb-8 text-center">Подходит каждому, кто ценит уют и качество</p>
                <div className="space-y-4">
                  {[
                    { icon: Home, title: "Для вашего дома", text: "Создайте атмосферу тепла в каждой комнате — от спальни до кухни" },
                    { icon: Baby, title: "Для семей с детьми", text: "Гипоаллергенные ткани, безопасные красители — спокойствие для родителей" },
                    { icon: Hotel, title: "Для отелей и апартаментов", text: "Износостойкий текстиль для гостеприимного бизнеса с оптовыми ценами" },
                    { icon: Sofa, title: "Для ценителей комфорта", text: "Премиальные материалы для тех, кто выбирает лучшее" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
                      <div className="shrink-0 w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Для каких случаев */}
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-3 text-center">Для каких случаев</h2>
                <p className="text-muted-foreground mb-8 text-center">Идеальное решение в любой момент жизни</p>
                <div className="space-y-4">
                  {[
                    { icon: Home, title: "Обновление интерьера", text: "Свежие коллекции, чтобы преобразить дом без ремонта" },
                    { icon: Gift, title: "Подарок близким", text: "Стильная упаковка и беспроигрышный выбор на любой праздник" },
                    { icon: CalendarHeart, title: "Новоселье и свадьба", text: "Комплекты, с которых начинается история нового дома" },
                    { icon: Sparkles, title: "Сезонная замена", text: "Лёгкое летнее или тёплое зимнее — текстиль под настроение года" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors">
                      <div className="shrink-0 w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

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
