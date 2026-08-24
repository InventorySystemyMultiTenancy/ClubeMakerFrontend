import React, { useMemo, useState } from "react";
import type { Printer, PrintProduct } from "../../../types";
import { formatMinutes } from "./printFarmUi";

interface StartJobModalProps {
  printer: Printer;
  printProducts: PrintProduct[];
  onStart: (printProductId: number) => Promise<void> | void;
  onCancel: () => void;
}

const StartJobModal: React.FC<StartJobModalProps> = ({
  printer,
  printProducts,
  onStart,
  onCancel,
}) => {
  const [productId, setProductId] = useState<string>(
    printProducts[0] ? String(printProducts[0].id) : "",
  );
  const [starting, setStarting] = useState(false);

  const selected = useMemo(
    () => printProducts.find((p) => String(p.id) === productId) || null,
    [productId, printProducts],
  );

  const estimatedEnd = useMemo(() => {
    if (!selected) return null;
    return new Date(Date.now() + selected.estimated_time_minutes * 60000);
  }, [selected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setStarting(true);
    try {
      await onStart(selected.id);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-xl font-bold text-stone-800">▶️ Iniciar produção</h3>
        <p className="mb-4 text-sm text-stone-500">
          Impressora #{printer.number} {printer.nickname ? `— ${printer.nickname}` : ""}
        </p>

        {printProducts.length === 0 ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            Nenhum perfil de produto cadastrado ainda. Cadastre um em "Catálogo de impressão" antes de iniciar uma produção.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-600">Produto</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              >
                {printProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.size_variant ? `(${p.size_variant})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <div className="space-y-1 rounded-lg bg-[var(--color-primary-lighter)] p-3 text-sm text-stone-700">
                <p>
                  <strong>{selected.units_per_plate}</strong> peças por chapa · tempo estimado{" "}
                  <strong>{formatMinutes(selected.estimated_time_minutes)}</strong>
                </p>
                {estimatedEnd && (
                  <p>
                    Previsão de término:{" "}
                    <strong>
                      {estimatedEnd.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </strong>
                  </p>
                )}
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
                disabled={starting || !selected}
                className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 font-semibold text-white hover:bg-[var(--color-primary-active)] disabled:opacity-60"
              >
                {starting ? "Iniciando..." : "Iniciar"}
              </button>
            </div>
          </form>
        )}

        {printProducts.length === 0 && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 w-full rounded-lg border border-stone-300 py-2 font-semibold text-stone-600 hover:bg-stone-50"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  );
};

export default StartJobModal;
