import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface Characteristics {
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  materials?: string[];
  [key: string]: any;
}

interface CharacteristicsEditorProps {
  value: Characteristics;
  onChange: (val: Characteristics) => void;
}

export default function CharacteristicsEditor({ value, onChange }: CharacteristicsEditorProps) {
  const [newColor, setNewColor] = useState("");
  const [newColorHex, setNewColorHex] = useState("#ffffff");
  const [newSize, setNewSize] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const colors = value.colors || [];
  const sizes = value.sizes || [];
  const materials = value.materials || [];

  const extraKeys = Object.keys(value).filter(k => !["colors", "sizes", "materials"].includes(k));

  const addColor = () => {
    if (!newColor.trim()) return;
    onChange({ ...value, colors: [...colors, { name: newColor.trim(), hex: newColorHex }] });
    setNewColor("");
    setNewColorHex("#ffffff");
  };

  const removeColor = (i: number) => {
    onChange({ ...value, colors: colors.filter((_, idx) => idx !== i) });
  };

  const addSize = () => {
    if (!newSize.trim()) return;
    onChange({ ...value, sizes: [...sizes, newSize.trim()] });
    setNewSize("");
  };

  const removeSize = (i: number) => {
    onChange({ ...value, sizes: sizes.filter((_, idx) => idx !== i) });
  };

  const addMaterial = () => {
    if (!newMaterial.trim()) return;
    onChange({ ...value, materials: [...materials, newMaterial.trim()] });
    setNewMaterial("");
  };

  const removeMaterial = (i: number) => {
    onChange({ ...value, materials: materials.filter((_, idx) => idx !== i) });
  };

  const addExtra = () => {
    if (!newKey.trim()) return;
    onChange({ ...value, [newKey.trim()]: newVal.trim() });
    setNewKey("");
    setNewVal("");
  };

  const removeExtra = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <Label className="text-base font-medium">Характеристики</Label>

      {/* Colors */}
      <div className="space-y-2">
        <Label className="text-sm">Цвета</Label>
        <div className="flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              <span className="w-3 h-3 rounded-full border inline-block" style={{ backgroundColor: c.hex }} />
              {c.name}
              <button type="button" onClick={() => removeColor(i)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
          <Input placeholder="Название цвета" value={newColor} onChange={e => setNewColor(e.target.value)} className="flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addColor())} />
          <Button type="button" variant="outline" size="sm" onClick={addColor}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-2">
        <Label className="text-sm">Размеры</Label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {s}
              <button type="button" onClick={() => removeSize(i)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Напр. 200x220" value={newSize} onChange={e => setNewSize(e.target.value)} className="flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSize())} />
          <Button type="button" variant="outline" size="sm" onClick={addSize}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Materials */}
      <div className="space-y-2">
        <Label className="text-sm">Материалы</Label>
        <div className="flex flex-wrap gap-2">
          {materials.map((m, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {m}
              <button type="button" onClick={() => removeMaterial(i)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Напр. Хлопок" value={newMaterial} onChange={e => setNewMaterial(e.target.value)} className="flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addMaterial())} />
          <Button type="button" variant="outline" size="sm" onClick={addMaterial}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Extra fields */}
      <div className="space-y-2">
        <Label className="text-sm">Дополнительные поля</Label>
        {extraKeys.map(key => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="font-medium min-w-[80px]">{key}:</span>
            <span className="flex-1">{String(value[key])}</span>
            <button type="button" onClick={() => removeExtra(key)} className="text-destructive hover:text-destructive/80">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input placeholder="Ключ" value={newKey} onChange={e => setNewKey(e.target.value)} className="w-1/3" />
          <Input placeholder="Значение" value={newVal} onChange={e => setNewVal(e.target.value)} className="flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addExtra())} />
          <Button type="button" variant="outline" size="sm" onClick={addExtra}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
