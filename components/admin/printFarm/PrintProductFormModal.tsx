import React, { useState } from "react";
import type { Filament, Product, PrintProduct } from "../../../types";

interface PrintProductFormModalProps {
  printProduct?: PrintProduct | null;
  filaments: Filament[];
  catalogProducts: Product[];
  onSave: (data: {
    name: string;
    product_id?: string | null;
    size_variant?: string;
    units_per_plate: number;
    estimated_time_minutes: number;
    filament_id?: number | null;
    filament_grams_per_plate?: number;
    manual_unit_price?: number | null;
  }) => Promise<void> | void;
  onCancel: () => void;
}

const PrintProductFormModal: React.FC<PrintProductFormModalProps> = ({
  printProduct,
  filaments,
  catalogProducts,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(printProduct?.name || "");
  const [productId, setProductId] = useState(printProduct?.product_id || "");
  const [sizeVariant, setSizeVariant] = useState(printProduct?.size_variant || "");
  const [unitsPerPlate, setUnitsPerPlate] = useState(
    printProduct ? String(printProduct.units_per_plate) : "",
  );
  const [estimatedTime, setEstimatedTime] = useState(
    printProduct ? String(printProduct.estimated_time_minutes) : "",
  );
  const [filamentId, setFilamentId] = useState(
    printProduct?.filament_id ? String(printProduct.filament_id) : "",
  );
  const [gramsPerPlate, setGramsPerPlate] = useState(
    printProduct ? String(printProduct.filament_grams_per_plate) : "",
  );
  const [manualPrice, setManualPrice] = useState(
    printProduct?.manual_unit_price ? String(printProduct.manual_unit_price) : "",
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unitsPerPlate || !estimatedTime) return;
    setSaving(true);
    try {
      await onSave({
        name,
        product_id: productId || null,
        size_variant: sizeVariant || undefined,
        units_per_plate: parseInt(unitsPerPlate, 10),
        estimated_time_minutes: parseInt(estimatedTime, 10),
        filament_id: filamentId ? parseInt(filamentId, 10) : null,
        filament_grams_per_plate: gramsPerPlate ? parseFloat(gramsPerPlate) : 0,
        manual_unit_price: !productId && manualPrice ? parseFloat(manualPrice) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-stone-800">
          🧩 {printProduct ? "Editar perfil de impressão" : "Novo perfil de impressão"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Nome *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chaveiro Pokémon — Pikachu"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Tamanho</label>
              <input
                type="text"
                value={sizeVariant}
                onChange={(e) => setSizeVariant(e.target.value)}
                placeholder='1" / 2"'
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Peças por chapa *</label>
              <input
                type="number"
                required
                min={1}
                value={unitsPerPlate}
                onChange={(e) => setUnitsPerPlate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">
              Tempo estimado da chapa (minutos) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Filamento</label>
              <select
                value={filamentId}
                onChange={(e) => setFilamentId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">Selecione...</option>
                {filaments.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.material} {f.color ? `— ${f.color}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Gramas por chapa</label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={gramsPerPlate}
                onChange={(e) => setGramsPerPlate(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">
              Vincular a produto do catálogo (opcional)
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">Não vincular</option>
              {catalogProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — R$ {Number(p.price).toFixed(2)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-400">
              Vinculado, o preço de venda do catálogo é usado no cálculo de receita.
            </p>
          </div>

          {!productId && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">
                Preço de venda unitário (sem vínculo)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}

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

export default PrintProductFormModal;
