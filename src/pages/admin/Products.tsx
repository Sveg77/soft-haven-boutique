import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  in_stock: boolean;
  characteristics: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", price: "", category_id: "", image_url: "", in_stock: true, characteristics: "",
};

export default function AdminProducts() {
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      let chars = {};
      try { if (form.characteristics) chars = JSON.parse(form.characteristics); } catch {}
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price) || 0,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        in_stock: form.in_stock,
        characteristics: chars,
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
      in_stock: p.in_stock,
      characteristics: JSON.stringify(p.characteristics || {}, null, 2),
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Товары</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Фото</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>В наличии</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p: any) => (
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
                <TableCell>{p.in_stock ? "✓" : "✗"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Редактировать товар" : "Новый товар"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Цена (₽)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
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
            <div className="space-y-2">
              <Label>URL изображения</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Характеристики (JSON)</Label>
              <Textarea
                value={form.characteristics}
                onChange={(e) => setForm({ ...form, characteristics: e.target.value })}
                placeholder='{"Материал": "Хлопок", "Размер": "200x220"}'
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} />
              <Label>В наличии</Label>
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
