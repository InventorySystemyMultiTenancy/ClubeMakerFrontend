import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import type { Printer, PrintJob, PrintProduct } from "../../../types";
import {
  createPrinter,
  finishPrintJob,
  getActivePrintJobs,
  getPrinters,
  getPrintProducts,
  startPrintJob,
} from "../../../services/printFarmService";
import { formatMinutes, STATUS_DOT_CLASSES, STATUS_LABEL, STATUS_PILL_CLASSES } from "./printFarmUi";
import PrinterFormModal from "./PrinterFormModal";
import StartJobModal from "./StartJobModal";
import FinishJobModal from "./FinishJobModal";

const REFRESH_INTERVAL_MS = 20000;
const CLOCK_TICK_MS = 15000;

const PrinterCard: React.FC<{
  printer: Printer;
  job: PrintJob | null;
  now: number;
  onStart: () => void;
  onFinish: () => void;
}> = ({ printer, job, now, onStart, onFinish }) => {
  const remainingMinutes = job
    ? (new Date(job.estimated_end_at).getTime() - now) / 60000
    : null;

  return (
    <div className="rounded-xl border-2 border-transparent bg-white p-4 shadow-lg transition-all hover:border-[var(--color-primary-light)] hover:shadow-xl">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-stone-400">#{String(printer.number).padStart(2, "0")}</p>
          <p className="font-bold text-stone-800">{printer.nickname || printer.model || "Impressora"}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_PILL_CLASSES[printer.status]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES[printer.status]}`} />
          {STATUS_LABEL[printer.status]}
        </span>
      </div>

      {job && (
        <div className="mb-3 text-sm text-stone-600">
          <p className="truncate">{job.product_name}</p>
          {remainingMinutes !== null && (
            <p className={remainingMinutes < 0 ? "font-semibold text-red-600" : ""}>
              {remainingMinutes >= 0
                ? `faltam ${formatMinutes(remainingMinutes)}`
                : `${formatMinutes(remainingMinutes)} além do previsto`}
            </p>
          )}
        </div>
      )}

      {printer.status === "idle" && (
        <button
          onClick={onStart}
          className="w-full rounded-lg bg-[var(--color-primary)] py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)]"
        >
          ▶️ Iniciar produção
        </button>
      )}
      {(printer.status === "running" || printer.status === "overdue") && (
        <button
          onClick={onFinish}
          className="w-full rounded-lg bg-stone-800 py-2 text-sm font-semibold text-white hover:bg-stone-900"
        >
          ✅ Finalizar
        </button>
      )}
      {(printer.status === "maintenance" || printer.status === "offline") && (
        <p className="text-center text-xs text-stone-400">Indisponível para produção</p>
      )}

      <p className="mt-3 text-xs text-stone-400">
        {printer.total_print_count} impressões concluídas · {Number(printer.total_print_hours || 0).toFixed(0)}h de uso
      </p>
    </div>
  );
};

interface FleetPanelProps {
  /** Operadores não gerenciam o cadastro de impressoras, só operam a produção. */
  canManagePrinters?: boolean;
}

const FleetPanel: React.FC<FleetPanelProps> = ({ canManagePrinters = true }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printProducts, setPrintProducts] = useState<PrintProduct[]>([]);
  const [jobByPrinter, setJobByPrinter] = useState<Record<number, PrintJob>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [showNewPrinter, setShowNewPrinter] = useState(false);
  const [startModalPrinter, setStartModalPrinter] = useState<Printer | null>(null);
  const [finishModalPrinter, setFinishModalPrinter] = useState<Printer | null>(null);

  const load = useCallback(async () => {
    try {
      const [printersData, productsData, activeJobs] = await Promise.all([
        getPrinters(),
        getPrintProducts(),
        getActivePrintJobs(),
      ]);
      setPrinters(printersData);
      setPrintProducts(productsData);
      const map: Record<number, PrintJob> = {};
      activeJobs.forEach((job) => {
        map[job.printer_id] = job;
      });
      setJobByPrinter(map);
    } catch (error) {
      console.error("Erro ao carregar frota:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = setInterval(load, REFRESH_INTERVAL_MS);
    const clock = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => {
      clearInterval(refresh);
      clearInterval(clock);
    };
  }, [load]);

  const handleCreatePrinter = async (data: {
    number: number;
    nickname?: string;
    brand?: string;
    model?: string;
    purchase_date?: string;
    notes?: string;
  }) => {
    try {
      await createPrinter(data);
      setShowNewPrinter(false);
      await load();
      Swal.fire("Sucesso!", "Impressora cadastrada", "success");
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao cadastrar impressora", "error");
    }
  };

  const handleStart = async (printProductId: number) => {
    if (!startModalPrinter) return;
    try {
      await startPrintJob({ printer_id: startModalPrinter.id, print_product_id: printProductId });
      setStartModalPrinter(null);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao iniciar produção", "error");
    }
  };

  const handleFinish = async (successCount: number, failCount: number) => {
    const job = finishModalPrinter ? jobByPrinter[finishModalPrinter.id] : null;
    if (!job) return;
    try {
      await finishPrintJob(job.id, { success_count: successCount, fail_count: failCount });
      setFinishModalPrinter(null);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao finalizar produção", "error");
    }
  };

  if (loading) {
    return <p className="p-6 text-center text-stone-500">Carregando frota...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-500">{printers.length} impressora(s) cadastrada(s)</p>
        {canManagePrinters && (
          <button
            onClick={() => setShowNewPrinter(true)}
            className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[var(--color-primary-active)]"
          >
            ➕ Nova impressora
          </button>
        )}
      </div>

      {printers.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
          <div className="mb-4 text-6xl">🖨️</div>
          <h2 className="mb-2 text-2xl font-bold text-stone-800">Nenhuma impressora cadastrada</h2>
          <p className="mb-6 text-stone-600">
            {canManagePrinters
              ? "Cadastre a primeira impressora da sua frota"
              : "Peça para o admin cadastrar as impressoras da frota"}
          </p>
          {canManagePrinters && (
            <button
              onClick={() => setShowNewPrinter(true)}
              className="rounded-xl bg-[var(--color-primary)] px-8 py-3 font-semibold text-white hover:bg-[var(--color-primary-active)]"
            >
              Cadastrar impressora
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {printers.map((printer) => (
            <PrinterCard
              key={printer.id}
              printer={printer}
              job={jobByPrinter[printer.id] || null}
              now={now}
              onStart={() => setStartModalPrinter(printer)}
              onFinish={() => setFinishModalPrinter(printer)}
            />
          ))}
        </div>
      )}

      {showNewPrinter && (
        <PrinterFormModal onSave={handleCreatePrinter} onCancel={() => setShowNewPrinter(false)} />
      )}

      {startModalPrinter && (
        <StartJobModal
          printer={startModalPrinter}
          printProducts={printProducts}
          onStart={handleStart}
          onCancel={() => setStartModalPrinter(null)}
        />
      )}

      {finishModalPrinter && jobByPrinter[finishModalPrinter.id] && (
        <FinishJobModal
          job={jobByPrinter[finishModalPrinter.id]}
          printerLabel={`Impressora #${finishModalPrinter.number}${finishModalPrinter.nickname ? ` — ${finishModalPrinter.nickname}` : ""}`}
          onFinish={handleFinish}
          onCancel={() => setFinishModalPrinter(null)}
        />
      )}
    </div>
  );
};

export default FleetPanel;
