import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DeliveryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl prose prose-sm">
        <h1 className="font-serif">Доставка и оплата</h1>
        <h2>Самовывоз</h2>
        <p>Вы можете забрать заказ по адресу: г. Москва. Точный адрес и время работы уточняйте при оформлении заявки.</p>
        <h2>Доставка по Москве</h2>
        <p>Доставка осуществляется в течение 1-3 рабочих дней. Стоимость доставки рассчитывается при оформлении заявки.</p>
        <h2>Оплата</h2>
        <p>Оплата производится при получении заказа. Мы свяжемся с вами после получения заявки для подтверждения деталей.</p>
      </main>
      <Footer />
    </div>
  );
}
