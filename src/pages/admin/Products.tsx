import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import MultiImageUpload from "@/components/admin/MultiImageUpload";
import CharacteristicsEditor from "@/components/admin/CharacteristicsEditor";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  images: string[];
  in_stock: boolean;
  characteristics: Record<string, any>;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", category_id: "", image_url: "", images: [], in_stock: true, characteristics: {},
};

export default function AdminProducts() {
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = products.filter((p: any) => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.category_id === catFilter;
    return matchName && matchCat;
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price) || 0,
        category_id: form.category_id || null,
        image_url: form.images[0] || form.image_url || null,
        images: form.images.length > 0 ? form.images : null,
        in_stock: form.in_stock,
        characteristics: form.characteristics,
      };
      if (editId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false);
      toast({ title: editId ? "Товар обновлён" : "Товар добавлен" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Товар удалён" });
    },
  });

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      category_id: p.category_id || "",
      image_url: p.image_url || "",
      images: p.images || (p.image_url ? [p.image_url] : []),
      in_stock: p.in_stock,
      characteristics: (typeof p.characteristics === "object" && p.characteristics) ? p.characteristics : {},
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Товары</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по названию..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Товаров не найдено</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Фото</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Фото</TableHead>
              <TableHead>В наличии</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.categories?.name || "—"}</TableCell>
                <TableCell>{Number(p.price).toLocaleString()} ₽</TableCell>
                <TableCell className="text-muted-foreground">{p.images?.length || 0} шт</TableCell>
                <TableCell>{p.in_stock ? "✓" : "✗"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Удалить товар?")) deleteMutation.mutate(p.id);
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Редактировать товар" : "Новый товар"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Цена (₽)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} />
                <Label>В наличии</Label>
              </div>
            </div>

            <MultiImageUpload
              images={form.images}
              onImagesChange={(imgs) => setForm({ ...form, images: imgs, image_url: imgs[0] || "" })}
              label="Фотографии товара"
            />

            <CharacteristicsEditor
              value={form.characteristics}
              onChange={(chars) => setForm({ ...form, characteristics: chars })}
            />

            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
