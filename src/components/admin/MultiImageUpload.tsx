import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Plus, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  label?: string;
}

export default function MultiImageUpload({ images, onImagesChange, label = "Изображения" }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (error) {
        toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      newUrls.push(urlData.publicUrl);
    }

    onImagesChange([...images, ...newUrls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const arr = [...images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onImagesChange(arr);
  };

  const addUrl = () => {
    if (urlInput.trim()) {
      onImagesChange([...images, urlInput.trim()]);
      setUrlInput("");
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`Фото ${i + 1}`} className="w-full aspect-square object-cover rounded-md border" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-1">
                {i > 0 && (
                  <Button type="button" variant="secondary" size="icon" className="h-6 w-6" onClick={() => moveImage(i, i - 1)}>
                    ←
                  </Button>
                )}
                <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={() => removeImage(i)}>
                  <X className="h-3 w-3" />
                </Button>
                {i < images.length - 1 && (
                  <Button type="button" variant="secondary" size="icon" className="h-6 w-6" onClick={() => moveImage(i, i + 1)}>
                    →
                  </Button>
                )}
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Главное</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="flex-1"
        />
        {uploading && <span className="text-sm text-muted-foreground self-center">Загрузка...</span>}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Или вставьте URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addUrl} disabled={!urlInput.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
