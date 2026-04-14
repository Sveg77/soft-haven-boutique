import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProductImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export default function ProductImageUpload({ imageUrl, onImageChange }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    onImageChange(urlData.publicUrl);
    setUploading(false);
  };

  const handleRemove = () => {
    onImageChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>Изображение</Label>
      {imageUrl && (
        <div className="relative w-32 h-32">
          <img src={imageUrl} alt="Превью" className="w-full h-full object-cover rounded-md border" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="flex-1"
        />
        {uploading && <span className="text-sm text-muted-foreground self-center">Загрузка...</span>}
      </div>
      <Input
        placeholder="Или вставьте URL изображения"
        value={imageUrl}
        onChange={(e) => onImageChange(e.target.value)}
      />
    </div>
  );
}
