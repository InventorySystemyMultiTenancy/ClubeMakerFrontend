import React, { useMemo, useState } from "react";
import type { PrintJob } from "../../../types";
import { formatBRL, formatGrams } from "./printFarmUi";

interface FinishJobModalProps {
  job: PrintJob;
  printerLabel: string;
  onFinish: (successCount: number, failCount: number) => Promise<void> | void;
  onCancel: () => void;
}

const FinishJobModal: React.FC<FinishJobModalProps> = ({
  job,
  printerLabel,
  onFinish,
  onCancel,
}) => {
  const [successCount, setSuccessCount] = useState(String(job.planned_units));
  const [finishing, setFinishing] = useState(false);

  const success = Math.max(0, parseInt(successCount, 10) || 0);
  const fail = Math.max(0, job.planned_units - success);
  const sumValid = success <= job.planned_units;

  const preview = useMemo(() => {
    const gramsPerPlate = job.filament_grams_per_plate_snapshot || 0;
    const costPerKg = job.filament_cost_per_kg_snapshot || 0;
    const unitPrice = job.unit_sale_price_snapshot ?? null;
    const lossGrams = job.planned_units > 0 ? gramsPerPlate * (fail / job.planned_units) : 0;
    const lossCost = (lossGrams / 1000) * costPerKg;
    const revenue = unitPrice !== null ? success * unitPrice : null;
    return { lossGrams, lossCost, revenue };
  }, [fail, success, job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sumValid) return;
    setFinishing(true);
    try {
      await onFinish(success, fail);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-xl font-bold text-stone-800">✅ Finalizar produção</h3>
        <p className="mb-4 text-sm text-stone-500">{printerLabel}</p>

        <p className="mb-4 rounded-lg bg-stone-100 p-3 text-sm text-stone-700">
          Planejado: <strong>{job.planned_units}</strong> peças
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Peças com sucesso</label>
            <input
              type="number"
              min={0}
              max={job.planned_units}
              value={successCount}
              onChange={(e) => setSuccessCount(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <p className="text-sm text-stone-600">
            Peças com falha (calculado): <strong className={fail > 0 ? "text-red-600" : ""}>{fail}</strong>
          </p>
          {!sumValid && (
            <p className="text-sm text-red-600">Sucesso não pode ser maior que o planejado.</p>
          )}

          <div className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <p className="font-semibold">Prejuízo estimado</p>
            <p>
              {formatGrams(preview.lossGrams)} de filamento perdido ≈ {formatBRL(preview.lossCost)}
            </p>
          </div>

          {preview.revenue !== null && (
            <div className="space-y-1 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <p className="font-semibold">Receita realizada</p>
              <p>{formatBRL(preview.revenue)}</p>
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
              disabled={finishing || !sumValid}
              className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 font-semibold text-white hover:bg-[var(--color-primary-active)] disabled:opacity-60"
            >
              {finishing ? "Salvando..." : "Finalizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinishJobModal;
