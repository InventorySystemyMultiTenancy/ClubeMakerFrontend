import React, { useState } from "react";

interface PrinterFormModalProps {
  onSave: (data: {
    number: number;
    nickname?: string;
    brand?: string;
    model?: string;
    purchase_date?: string;
    notes?: string;
  }) => Promise<void> | void;
  onCancel: () => void;
}

const PrinterFormModal: React.FC<PrinterFormModalProps> = ({ onSave, onCancel }) => {
  const [number, setNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number) return;
    setSaving(true);
    try {
      await onSave({
        number: parseInt(number, 10),
        nickname: nickname || undefined,
        brand: brand || undefined,
        model: model || undefined,
        purchase_date: purchaseDate || undefined,
        notes: notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-stone-800">🖨️ Nova impressora</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Número (1-50) *</label>
            <input
              type="number"
              required
              min={1}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="Ex: 12"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Apelido</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="Ex: Ender 3 da ponta"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Marca</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="Creality"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Modelo</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="Ender 3 V2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Data de aquisição</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
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
              {saving ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrinterFormModal;
