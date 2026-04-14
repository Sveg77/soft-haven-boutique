import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold mb-6">О нас</h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            «Уютный Дом» — это магазин домашнего текстиля в Москве. Мы подбираем для вас
            лучшие ткани и создаём коллекции, которые превращают дом в место настоящего уюта.
          </p>
          <p>
            В нашем ассортименте: постельное бельё, подушки, одеяла, шторы, покрывала, полотенца,
            салфетки и аксессуары для дома. Мы работаем только с проверенными производителями
            и отбираем каждый товар с заботой о качестве.
          </p>
          <p>
            Мы верим, что домашний текстиль — это не просто вещи, а часть вашего ежедневного
            комфорта. Поэтому каждая деталь имеет значение.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
