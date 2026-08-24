import React, { useState } from "react";
import type { Printer } from "../../../types";

interface AddPartModalProps {
  printers: Printer[];
  onSave: (data: {
    printerId: number;
    part_type: string;
    lifespan_prints: number;
    replacement_cost?: number;
  }) => Promise<void> | void;
  onCancel: () => void;
}

const AddPartModal: React.FC<AddPartModalProps> = ({ printers, onSave, onCancel }) => {
  const [printerId, setPrinterId] = useState(printers[0] ? String(printers[0].id) : "");
  const [partType, setPartType] = useState("");
  const [lifespanPrints, setLifespanPrints] = useState("");
  const [replacementCost, setReplacementCost] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerId || !partType || !lifespanPrints) return;
    setSaving(true);
    try {
      await onSave({
        printerId: parseInt(printerId, 10),
        part_type: partType,
        lifespan_prints: parseInt(lifespanPrints, 10),
        replacement_cost: replacementCost ? parseFloat(replacementCost) : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-stone-800">🔧 Nova peça de desgaste</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Impressora *</label>
            <select
              required
              value={printerId}
              onChange={(e) => setPrinterId(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            >
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.nickname ? `— ${p.nickname}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Peça *</label>
            <input
              type="text"
              required
              value={partType}
              onChange={(e) => setPartType(e.target.value)}
              placeholder="Bico 0.4mm, correia, mesa..."
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">
                Vida útil (impressões) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={lifespanPrints}
                onChange={(e) => setLifespanPrints(e.target.value)}
                placeholder="2500"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Custo de reposição</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={replacementCost}
                onChange={(e) => setReplacementCost(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-stone-400">
            A contagem de uso começa a partir de agora, considerando o total de impressões já feitas por essa impressora.
          </p>
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
              {saving ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPartModal;
