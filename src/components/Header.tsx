import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--background))]/95 backdrop-blur border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-serif font-semibold tracking-wide text-foreground">
          Уютный Дом
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/catalog" className="hover:text-primary transition-colors">Каталог</Link>
          <Link to="/delivery" className="hover:text-primary transition-colors">Доставка</Link>
          <Link to="/about" className="hover:text-primary transition-colors">О нас</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative p-2 hover:bg-accent rounded-lg transition-colors">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                {count}
              </Badge>
            )}
          </Link>
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t p-4 flex flex-col gap-3 text-sm bg-background">
          <Link to="/catalog" onClick={() => setMobileOpen(false)}>Каталог</Link>
          <Link to="/delivery" onClick={() => setMobileOpen(false)}>Доставка</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)}>О нас</Link>
        </nav>
      )}
    </header>
  );
}
