import React, { useState } from "react";
import type { Filament } from "../../../types";

interface FilamentFormModalProps {
  filament?: Filament | null;
  onSave: (data: {
    material: string;
    color?: string;
    brand?: string;
    cost_per_kg: number;
    stock_grams?: number;
  }) => Promise<void> | void;
  onCancel: () => void;
}

const FilamentFormModal: React.FC<FilamentFormModalProps> = ({ filament, onSave, onCancel }) => {
  const [material, setMaterial] = useState(filament?.material || "");
  const [color, setColor] = useState(filament?.color || "");
  const [brand, setBrand] = useState(filament?.brand || "");
  const [costPerKg, setCostPerKg] = useState(filament ? String(filament.cost_per_kg) : "");
  const [stockGrams, setStockGrams] = useState(filament ? String(filament.stock_grams) : "0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material || !costPerKg) return;
    setSaving(true);
    try {
      await onSave({
        material,
        color: color || undefined,
        brand: brand || undefined,
        cost_per_kg: parseFloat(costPerKg),
        stock_grams: stockGrams ? parseFloat(stockGrams) : 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-stone-800">
          🧵 {filament ? "Editar filamento" : "Novo filamento"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Material *</label>
            <input
              type="text"
              required
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="PLA, PETG, ABS..."
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Cor</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Marca</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Preço por kg (R$) *</label>
              <input
                type="number"
                required
                step="0.01"
                min={0}
                value={costPerKg}
                onChange={(e) => setCostPerKg(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Estoque (g)</label>
              <input
                type="number"
                step="1"
                min={0}
                value={stockGrams}
                onChange={(e) => setStockGrams(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-stone-300 py-2 font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 font-semibold text-white hover:bg-[var(--color-primary-active)] disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilamentFormModal;
