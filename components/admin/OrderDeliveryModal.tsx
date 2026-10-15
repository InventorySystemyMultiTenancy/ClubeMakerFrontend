import React, { useMemo, useState } from "react";
import type { Order, Product } from "../../types";
import { registerOrderDelivery } from "../../services/apiService";
import { formatCurrency } from "../../utils/orderPricing";
import { getOrderDeliveryProgress } from "../../utils/orderDelivery";

// O que acontece com o que não foi entregue agora
type ShortfallMode = "pending" | "loss" | "mixed";

const SHORTFALL_OPTIONS: { value: ShortfallMode; label: string; hint: string }[] = [
  {
    value: "pending",
    label: "Cliente retirou menos / não estava pronto",
    hint: "O restante fica pendente e o pedido vira entrega parcial.",
  },
  {
    value: "loss",
    label: "O restante foi perda",
    hint: "O restante é baixado como perda e entra como prejuízo.",
  },
  {
    value: "mixed",
    label: "Parte foi perda e parte fica pendente",
    hint: "Informe a perda de cada item; o que sobrar fica pendente.",
  },
];

interface OrderDeliveryModalProps {
  order: Order;
  products: Product[];
  onClose: () => void;
  onDelivered: (deliveryStatus: "partial" | "delivered") => void;
}

const toQty = (value: string | undefined, max: number) =>
  Math.min(max, Math.max(0, parseInt(value || "0", 10) || 0));

const OrderDeliveryModal: React.FC<OrderDeliveryModalProps> = ({
  order,
  products,
  onClose,
  onDelivered,
}) => {
  const progress = useMemo(
    () => getOrderDeliveryProgress(order).filter((item) => item.remaining > 0),
    [order],
  );
  const isFollowUp = (order.deliveries || []).length > 0;

  const [step, setStep] = useState<"ask" | "details">("ask");
  const [mode, setMode] = useState<ShortfallMode>("pending");
  const [deliveredInput, setDeliveredInput] = useState<Record<number, string>>({});
  const [lostInput, setLostInput] = useState<Record<number, string>>({});
  const [lossReason, setLossReason] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitCostByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) map[p.id] = Number(p.priceRaw) || 0;
    return map;
  }, [products]);

  const rows = progress.map((item) => {
    const delivered = toQty(deliveredInput[item.index], item.remaining);
    const afterDelivered = item.remaining - delivered;
    const lost =
      mode === "loss"
        ? afterDelivered
        : mode === "mixed"
          ? toQty(lostInput[item.index], afterDelivered)
          : 0;
    const pending = afterDelivered - lost;
    const unitCost = item.productId ? unitCostByProduct[item.productId] || 0 : 0;
    return { ...item, delivered, lost, pending, lossCost: lost * unitCost };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      delivered: acc.delivered + row.delivered,
      lost: acc.lost + row.lost,
      pending: acc.pending + row.pending,
      lossCost: acc.lossCost + row.lossCost,
    }),
    { delivered: 0, lost: 0, pending: 0, lossCost: 0 },
  );
  const nothingToRegister = totals.delivered + totals.lost === 0;
  const missingReason = totals.lost > 0 && !lossReason.trim();

  const submit = async (items: { index: number; delivered: number; lost: number }[]) => {
    setSaving(true);
    setError(null);
    try {
      const result = await registerOrderDelivery(order.id, {
        items,
        lossReason: lossReason.trim() || undefined,
        note: note.trim() || undefined,
      });
      onDelivered(result.deliveryStatus);
    } catch (err: any) {
      setError(err?.message || "Erro ao registrar entrega");
    } finally {
      setSaving(false);
    }
  };

  const deliverEverything = () =>
    submit(progress.map((item) => ({ index: item.index, delivered: item.remaining, lost: 0 })));

  const openDetails = () => {
    // Começa com tudo entregue; o usuário reduz o que de fato saiu
    setDeliveredInput(
      Object.fromEntries(progress.map((item) => [item.index, String(item.remaining)])),
    );
    setStep("details");
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nothingToRegister || missingReason) return;
    submit(
      rows
        .filter((row) => row.delivered + row.lost > 0)
        .map((row) => ({ index: row.index, delivered: row.delivered, lost: row.lost })),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-xl font-bold text-stone-800">
          {isFollowUp ? "📦 Realizar resto da entrega" : "📦 Entregar ao cliente"}
        </h3>
        <p className="mb-4 text-sm text-stone-500">
          Pedido #{order.id.slice(-4)} — {order.userName || order.externalBuyerName || "-"}
        </p>

        <div className="mb-4 rounded-lg bg-stone-100 p-3 text-sm text-stone-700">
          <p className="mb-1 font-semibold">
            {isFollowUp ? "Pendente de entrega:" : "Itens do pedido:"}
          </p>
          <ul>
            {progress.map((item) => (
              <li key={item.index}>
                <strong>{item.remaining}x</strong> {item.name}
                {isFollowUp && (
                  <span className="text-stone-500">
                    {" "}
                    (de {item.quantity}; já entregue {item.delivered}
                    {item.lost > 0 ? `, perda ${item.lost}` : ""})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {step === "ask" ? (
          <>
            <p className="mb-4 font-semibold text-stone-800">
              {isFollowUp
                ? "Entregou todo o restante?"
                : "Entregou toda a quantidade descrita no pedido?"}
            </p>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={openDetails}
                disabled={saving}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                Não, entreguei menos
              </button>
              <button
                type="button"
                onClick={deliverEverything}
                disabled={saving}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Sim, entreguei tudo"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-semibold text-stone-700">
                Por que entregou menos?
              </legend>
              {SHORTFALL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-lg border-2 p-3 text-sm ${
                    mode === option.value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-lighter)]"
                      : "border-stone-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="shortfall"
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-stone-800">{option.label}</span>
                    <span className="text-stone-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                    <th className="py-2 pr-2">Item</th>
                    <th className="px-2 py-2">A entregar</th>
                    <th className="px-2 py-2">Entregue agora</th>
                    {mode === "mixed" && <th className="px-2 py-2">Perda</th>}
                    <th className="px-2 py-2">{mode === "loss" ? "Perda" : "Fica pendente"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className="border-b border-stone-100 last:border-0">
                      <td className="py-2 pr-2 font-semibold text-stone-800">{row.name}</td>
                      <td className="px-2 py-2">{row.remaining}</td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          max={row.remaining}
                          value={deliveredInput[row.index] ?? ""}
                          onChange={(e) =>
                            setDeliveredInput((prev) => ({ ...prev, [row.index]: e.target.value }))
                          }
                          className="w-20 rounded-lg border border-stone-300 px-2 py-1 focus:border-[var(--color-primary)] focus:outline-none"
                        />
                      </td>
                      {mode === "mixed" && (
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            max={row.remaining - row.delivered}
                            value={lostInput[row.index] ?? ""}
                            onChange={(e) =>
                              setLostInput((prev) => ({ ...prev, [row.index]: e.target.value }))
                            }
                            className="w-20 rounded-lg border border-stone-300 px-2 py-1 focus:border-[var(--color-primary)] focus:outline-none"
                          />
                        </td>
                      )}
                      <td
                        className={`px-2 py-2 font-semibold ${
                          mode === "loss"
                            ? row.lost > 0
                              ? "text-red-600"
                              : ""
                            : row.pending > 0
                              ? "text-amber-600"
                              : ""
                        }`}
                      >
                        {mode === "loss" ? row.lost : row.pending}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totals.lost > 0 && (
              <div className="space-y-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">
                  Prejuízo estimado: {totals.lost} un. ≈ {formatCurrency(totals.lossCost)}
                </p>
                <p className="text-xs">Calculado pelo custo unitário de cada produto.</p>
                <label className="block font-semibold">
                  Motivo da perda *
                  <textarea
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    rows={2}
                    placeholder="Ex.: peça quebrou, defeito de impressão..."
                    className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 font-normal text-stone-800 focus:border-red-400 focus:outline-none"
                  />
                </label>
              </div>
            )}

            {totals.pending > 0 && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <strong>{totals.pending}</strong> unidade(s) ficam pendentes — o pedido ficará como{" "}
                <strong>entrega parcial</strong> até você realizar o resto da entrega.
              </p>
            )}

            <label className="block text-sm font-semibold text-stone-700">
              Observação (opcional)
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-normal focus:border-[var(--color-primary)] focus:outline-none"
              />
            </label>

            {nothingToRegister && (
              <p className="text-sm text-red-600">
                Informe ao menos uma unidade entregue{mode !== "pending" ? " ou perdida" : ""}.
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep("ask")}
                className="flex-1 rounded-lg border border-stone-300 py-2 font-semibold text-stone-600 hover:bg-stone-50"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={saving || nothingToRegister || missingReason}
                className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 font-semibold text-white hover:bg-[var(--color-primary-active)] disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Confirmar entrega"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderDeliveryModal;
