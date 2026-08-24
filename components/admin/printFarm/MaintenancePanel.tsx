import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import type { Printer, PrinterPart } from "../../../types";
import {
  createPrinterPart,
  deletePrinterPart,
  getMaintenanceAlerts,
  getPrinters,
  replacePrinterPart,
} from "../../../services/printFarmService";
import { formatBRL, LEVEL_LABEL, LEVEL_PILL_CLASSES } from "./printFarmUi";
import AddPartModal from "./AddPartModal";

const MaintenancePanel: React.FC = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [parts, setParts] = useState<PrinterPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPart, setShowAddPart] = useState(false);

  const load = useCallback(async () => {
    try {
      const [printersData, alerts] = await Promise.all([getPrinters(), getMaintenanceAlerts()]);
      setPrinters(printersData);
      setParts(alerts);
    } catch (error) {
      console.error("Erro ao carregar manutenção da frota:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddPart = async (data: {
    printerId: number;
    part_type: string;
    lifespan_prints: number;
    replacement_cost?: number;
  }) => {
    try {
      await createPrinterPart(data.printerId, {
        part_type: data.part_type,
        lifespan_prints: data.lifespan_prints,
        replacement_cost: data.replacement_cost,
      });
      setShowAddPart(false);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao cadastrar peça", "error");
    }
  };

  const handleReplace = async (part: PrinterPart) => {
    const result = await Swal.fire({
      title: "Registrar troca?",
      text: `Marca "${part.part_type}" (impressora #${part.printer_number}) como recém trocada e zera o contador de desgaste.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmar troca",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await replacePrinterPart(part.id);
      await load();
      Swal.fire("Pronto!", "Troca registrada", "success");
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao registrar troca", "error");
    }
  };

  const handleDelete = async (part: PrinterPart) => {
    const result = await Swal.fire({
      title: "Remover peça?",
      text: `Remover "${part.part_type}" do cadastro da impressora #${part.printer_number}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await deletePrinterPart(part.id);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao remover peça", "error");
    }
  };

  if (loading) {
    return <p className="p-6 text-center text-stone-500">Carregando manutenção...</p>;
  }

  const shoppingList = parts.filter((p) => p.level !== "ok");
  const shoppingTotal = shoppingList.reduce((sum, p) => sum + Number(p.replacement_cost || 0), 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-500">{parts.length} peça(s) cadastrada(s) na frota</p>
        <button
          onClick={() => setShowAddPart(true)}
          disabled={printers.length === 0}
          className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[var(--color-primary-active)] disabled:opacity-50"
        >
          🔧 Nova peça
        </button>
      </div>

      {shoppingList.length > 0 && (
        <div className="mb-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-1 font-bold text-amber-800">🛒 Lista de compra sugerida</h3>
          <p className="mb-3 text-sm text-amber-700">
            {shoppingList.length} peça(s) próximas ou além da vida útil · custo estimado {formatBRL(shoppingTotal)}
          </p>
          <ul className="space-y-1 text-sm text-amber-800">
            {shoppingList.map((p) => (
              <li key={p.id}>
                • {p.part_type} — impressora #{p.printer_number} ({LEVEL_LABEL[p.level!]})
              </li>
            ))}
          </ul>
        </div>
      )}

      {parts.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
          <div className="mb-4 text-6xl">🔧</div>
          <h2 className="mb-2 text-2xl font-bold text-stone-800">Nenhuma peça cadastrada</h2>
          <p className="text-stone-600">
            Cadastre bicos, correias e outras peças de desgaste para acompanhar a vida útil de cada impressora.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                <th className="p-4">Impressora</th>
                <th className="p-4">Peça</th>
                <th className="p-4">Uso</th>
                <th className="p-4">Vida útil</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => {
                const ratio = Math.min(1, part.usage_ratio || 0);
                return (
                  <tr key={part.id} className="border-b border-stone-100 last:border-0">
                    <td className="p-4 font-mono text-stone-500">#{part.printer_number}</td>
                    <td className="p-4 font-semibold text-stone-800">{part.part_type}</td>
                    <td className="p-4">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full ${part.level === "critical" ? "bg-red-500" : part.level === "warning" ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-400">
                        {part.usage_count} / {part.lifespan_prints}
                      </span>
                    </td>
                    <td className="p-4 text-stone-500">{part.lifespan_prints} impressões</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${LEVEL_PILL_CLASSES[part.level!]}`}
                      >
                        {LEVEL_LABEL[part.level!]}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReplace(part)}
                          className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-active)]"
                        >
                          Marcar trocada
                        </button>
                        <button
                          onClick={() => handleDelete(part)}
                          className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-200"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddPart && (
        <AddPartModal printers={printers} onSave={handleAddPart} onCancel={() => setShowAddPart(false)} />
      )}
    </div>
  );
};

export default MaintenancePanel;
