import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Package, ShoppingBag, FolderOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
  const { signOut } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
      isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
    }`;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 border-r bg-card p-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold mb-4 px-4">Админ-панель</h2>
        <nav className="flex flex-col gap-1">
          <NavLink to="/admin/orders" className={linkClass}>
            <ShoppingBag className="h-4 w-4" /> Заявки
          </NavLink>
          <NavLink to="/admin/products" className={linkClass}>
            <Package className="h-4 w-4" /> Товары
          </NavLink>
          <NavLink to="/admin/categories" className={linkClass}>
            <FolderOpen className="h-4 w-4" /> Категории
          </NavLink>
        </nav>
        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Выйти
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
