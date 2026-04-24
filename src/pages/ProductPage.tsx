import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getProductImages } from "@/lib/productImageOverrides";

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Загрузка...</p></main>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center"><p>Товар не найден</p></main>
      <Footer />
    </div>
  );

  const chars = (product.characteristics as Record<string, any>) || {};
  const colors: string[] = Array.isArray(chars["Цвет"]) ? chars["Цвет"] : [];
  const sizes: string[] = Array.isArray(chars["Размер"]) ? chars["Размер"] : [];
  const materials: string[] = Array.isArray(chars["Материал"]) ? chars["Материал"] : [];
  const priceMatrix: Record<string, number> | undefined =
    chars.priceMatrix && typeof chars.priceMatrix === "object" ? chars.priceMatrix : undefined;
  const productImages: string[] = getProductImages(product);

  const currentImage = productImages[selectedColorIdx] || productImages[0] || product.image_url;
  const currentColor = colors[selectedColorIdx] || colors[0] || "";

  const matrixPrice = (() => {
    if (!priceMatrix) return null;
    const s = selectedSize || sizes[0];
    const m = selectedMaterial || materials[0];
    if (!s || !m) return null;
    const v = priceMatrix[`${s}|${m}`];
    return typeof v === "number" ? v : null;
  })();
  const displayPrice = matrixPrice ?? Number(product.price);

  const handleAdd = () => {
    const color = currentColor;
    const size = selectedSize || sizes[0] || "";
    const material = selectedMaterial || materials[0] || "";

    if (sizes.length > 0 && !selectedSize) {
      toast({ title: "Выберите размер", variant: "destructive" });
      return;
    }
    if (materials.length > 0 && !selectedMaterial) {
      toast({ title: "Выберите материал", variant: "destructive" });
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: displayPrice,
      image_url: currentImage,
      color,
      size,
      material,
    });
    toast({
      title: "Добавлено в корзину",
      description: `${product.name}${color ? ` · ${color}` : ""}${size ? ` · ${size}` : ""}${material ? ` · ${material}` : ""}`,
    });
  };

  const prevImage = () => setSelectedColorIdx((i) => (i > 0 ? i - 1 : productImages.length - 1));
  const nextImage = () => setSelectedColorIdx((i) => (i < productImages.length - 1 ? i + 1 : 0));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-2">
          <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Каталог
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
              {currentImage ? (
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Фото</div>
              )}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColorIdx(idx)}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                      idx === selectedColorIdx ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={img} alt={colors[idx] || `Вариант ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col justify-center">
            <p className="text-sm text-muted-foreground mb-1">{(product as any).categories?.name}</p>
            <h1 className="font-serif text-3xl font-semibold mb-2">{product.name}</h1>
            <p className="text-2xl font-bold mb-4">{displayPrice.toLocaleString()} ₽</p>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Color selector */}
            {colors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2">Цвет: <span className="font-normal text-muted-foreground">{currentColor}</span></h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColorIdx(idx)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        idx === selectedColorIdx
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2">Размер:</h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Material selector */}
            {materials.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-2">Материал:</h3>
                <div className="flex flex-wrap gap-2">
                  {materials.map((mat) => (
                    <button
                      key={mat}
                      onClick={() => setSelectedMaterial(mat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors",
                        selectedMaterial === mat
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {product.in_stock ? (
                <>
                  <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> В наличии</span>
                  <Button onClick={handleAdd} size="lg" className="rounded-full flex-1">
                    <ShoppingBag className="h-4 w-4 mr-2" /> В корзину
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Нет в наличии</span>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
