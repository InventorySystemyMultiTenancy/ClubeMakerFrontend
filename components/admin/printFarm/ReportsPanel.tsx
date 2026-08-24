import React, { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Printer, PrintFarmSummary } from "../../../types";
import { getPrinters, getPrintFarmSummary } from "../../../services/printFarmService";
import { formatBRL } from "./printFarmUi";

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const StatCard: React.FC<{ label: string; value: string; tone?: "default" | "danger" | "success" }> = ({
  label,
  value,
  tone = "default",
}) => (
  <div
    className={`rounded-xl border-2 p-4 ${
      tone === "danger"
        ? "border-red-200 bg-red-50"
        : tone === "success"
          ? "border-green-200 bg-green-50"
          : "border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)]"
    }`}
  >
    <p
      className={`text-sm font-semibold ${
        tone === "danger" ? "text-red-600" : tone === "success" ? "text-green-600" : "text-[var(--color-primary)]"
      }`}
    >
      {label}
    </p>
    <p
      className={`text-2xl font-bold ${
        tone === "danger" ? "text-red-800" : tone === "success" ? "text-green-800" : "text-[var(--color-primary-active)]"
      }`}
    >
      {value}
    </p>
  </div>
);

const ReportsPanel: React.FC = () => {
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(daysAgoISO(0));
  const [printerId, setPrinterId] = useState<string>("");
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [summary, setSummary] = useState<PrintFarmSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrinters()
      .then(setPrinters)
      .catch((error) => console.error("Erro ao carregar impressoras:", error));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPrintFarmSummary({
        from,
        to: `${to}T23:59:59`,
        printer_id: printerId ? parseInt(printerId, 10) : undefined,
      });
      setSummary(data);
    } catch (error) {
      console.error("Erro ao carregar relatório da frota:", error);
    } finally {
      setLoading(false);
    }
  }, [from, to, printerId]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = summary?.totals;
  const successRate =
    totals && totals.success + totals.fail > 0
      ? (totals.success / (totals.success + totals.fail)) * 100
      : null;
  const onTimeRate = totals && totals.jobs > 0 ? (totals.onTime / totals.jobs) * 100 : null;
  const balance = totals ? totals.revenue - totals.lossCost : 0;

  const chartData =
    summary?.byPrinter.map((row) => ({
      name: `#${row.printer_number}`,
      Receita: Number(row.revenue.toFixed(2)),
      Prejuízo: Number(row.lossCost.toFixed(2)),
    })) || [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow">
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">Impressora</label>
          <select
            value={printerId}
            onChange={(e) => setPrinterId(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          >
            <option value="">Todas as impressoras</option>
            {printers.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.nickname ? `— ${p.nickname}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !totals ? (
        <p className="p-6 text-center text-stone-500">Carregando relatório...</p>
      ) : totals.jobs === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
          <div className="mb-4 text-6xl">📊</div>
          <h2 className="mb-2 text-2xl font-bold text-stone-800">Sem produções finalizadas no período</h2>
          <p className="text-stone-600">Finalize impressões para ver perdas, custo e lucro aqui.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Chapas finalizadas" value={String(totals.jobs)} />
            <StatCard
              label="Taxa de sucesso"
              value={successRate !== null ? `${successRate.toFixed(0)}%` : "-"}
            />
            <StatCard
              label="No prazo"
              value={onTimeRate !== null ? `${onTimeRate.toFixed(0)}%` : "-"}
            />
            <StatCard
              label="Saldo (receita - prejuízo)"
              value={formatBRL(balance)}
              tone={balance >= 0 ? "success" : "danger"}
            />
            <StatCard label="Prejuízo em filamento" value={formatBRL(totals.lossCost)} tone="danger" />
            <StatCard label="Receita realizada" value={formatBRL(totals.revenue)} tone="success" />
            <StatCard label="Peças aprovadas" value={String(totals.success)} tone="success" />
            <StatCard label="Peças perdidas" value={String(totals.fail)} tone="danger" />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 font-bold text-stone-800">Receita x prejuízo por impressora</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatBRL(value)} />
                <Legend />
                <Bar dataKey="Receita" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Prejuízo" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-xl">
            <h3 className="p-5 pb-0 font-bold text-stone-800">O que cada funcionário fez</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                  <th className="p-4">Funcionário</th>
                  <th className="p-4">Chapas</th>
                  <th className="p-4">Aprovadas</th>
                  <th className="p-4">Perdidas</th>
                  <th className="p-4">No prazo</th>
                  <th className="p-4">Prejuízo</th>
                  <th className="p-4">Receita</th>
                </tr>
              </thead>
              <tbody>
                {summary.byOperator.map((op) => (
                  <tr key={op.operator_id ?? op.operator_name} className="border-b border-stone-100 last:border-0">
                    <td className="p-4 font-semibold text-stone-800">{op.operator_name}</td>
                    <td className="p-4">{op.jobs}</td>
                    <td className="p-4 text-green-700">{op.success}</td>
                    <td className="p-4 text-red-700">{op.fail}</td>
                    <td className="p-4">{op.jobs > 0 ? `${((op.onTime / op.jobs) * 100).toFixed(0)}%` : "-"}</td>
                    <td className="p-4 text-red-700">{formatBRL(op.lossCost)}</td>
                    <td className="p-4 text-green-700">{formatBRL(op.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPanel;
