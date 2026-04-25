import { Link } from "react-router-dom";
import { Clock, Truck, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-lg font-semibold mb-3">Уютный Дом</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Текстиль для дома с любовью и заботой. Постельное бельё, подушки, одеяла, шторы и аксессуары для вашего уюта.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Информация</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/delivery" className="hover:text-foreground transition-colors">Доставка и оплата</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Политика конфиденциальности</Link>
              <Link to="/offer" className="hover:text-foreground transition-colors">Публичная оферта</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Контакты</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>г. Москва</p>
              <p>+7 (999) 123-45-67</p>
              <p>info@uyutnydom.ru</p>
              <div className="border-t pt-2 mt-2 space-y-1">
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" /> Магазин: 10:00–20:00
                </p>
                <p className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0" /> Доставка: 10:00–18:00
                </p>
                <a
                  href="https://t.me/sofrtextil_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
                  aria-label="Telegram-бот"
                >
                  <Send className="h-3.5 w-3.5 flex-shrink-0" /> Telegram-бот
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Уютный Дом. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
