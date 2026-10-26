import React, { useMemo, useState } from "react";
import type { Order, Product } from "../../types";
import {
  registerOrderDelivery,
  type RegisterOrderDeliveryPayload,
} from "../../services/apiService";
import { formatCurrency } from "../../utils/orderPricing";
import { getOrderDeliveryProgress } from "../../utils/orderDelivery";

// O que acontece com o que não foi entregue agora
type ShortfallMode = "pending" | "loss" | "mixed";

type ShortfallOption = { value: ShortfallMode; label: string; hint: string };

const SHORTFALL_OPTIONS: ShortfallOption[] = [
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

// Mesmo formulário quando o próprio cliente confirma o recebimento (liberado pelo
// admin na aba "Clientes"), só com os textos do ponto de vista de quem recebe.
const CUSTOMER_SHORTFALL_OPTIONS: ShortfallOption[] = [
  {
    value: "pending",
    label: "Ainda não recebi o restante",
    hint: "O restante fica pendente e o pedido vira entrega parcial.",
  },
  {
    value: "loss",
    label: "O restante chegou com defeito / quebrado",
    hint: "O restante é registrado como perda.",
  },
  {
    value: "mixed",
    label: "Parte chegou com defeito e parte ainda não recebi",
    hint: "Informe a perda de cada item; o que sobrar fica pendente.",
  },
];

const TEXTS = {
  admin: {
    title: "📦 Entregar ao cliente",
    followUpTitle: "📦 Realizar resto da entrega",
    ask: "Entregou toda a quantidade descrita no pedido?",
    followUpAsk: "Entregou todo o restante?",
    yes: "Sim, entreguei tudo",
    no: "Não, entreguei menos",
    whyLess: "Por que entregou menos?",
    toDeliver: "A entregar",
    deliveredNow: "Entregue agora",
    lossReason: "Motivo da perda *",
    pendingNotice: "até você realizar o resto da entrega",
    confirm: "Confirmar entrega",
    options: SHORTFALL_OPTIONS,
  },
  customer: {
    title: "📦 Confirmar recebimento",
    followUpTitle: "📦 Receber o resto do pedido",
    ask: "Recebeu toda a quantidade descrita no pedido?",
    followUpAsk: "Recebeu todo o restante?",
    yes: "Sim, recebi tudo",
    no: "Não, recebi menos",
    whyLess: "Por que recebeu menos?",
    toDeliver: "A receber",
    deliveredNow: "Recebido agora",
    lossReason: "O que aconteceu? *",
    pendingNotice: "até o restante ser entregue",
    confirm: "Confirmar recebimento",
    options: CUSTOMER_SHORTFALL_OPTIONS,
  },
};

interface OrderDeliveryModalProps {
  order: Order;
  products: Product[];
  onClose: () => void;
  onDelivered: (deliveryStatus: "partial" | "delivered", extraAmount?: number) => void;
  audience?: "admin" | "customer";
  // Por padrão registra pela rota do admin/cozinha
  submitDelivery?: (
    orderId: string,
    payload: RegisterOrderDeliveryPayload,
  ) => Promise<{ deliveryStatus: "partial" | "delivered"; extraAmount?: number }>;
}

const toQty = (value: string | undefined, max: number) =>
  Math.min(max, Math.max(0, parseInt(value || "0", 10) || 0));

const OrderDeliveryModal: React.FC<OrderDeliveryModalProps> = ({
  order,
  products,
  onClose,
  onDelivered,
  audience = "admin",
  submitDelivery = registerOrderDelivery,
}) => {
  const text = TEXTS[audience];
  const progress = useMemo(
    () => getOrderDeliveryProgress(order).filter((item) => item.remaining > 0),
    [order],
  );
  const isFollowUp = (order.deliveries || []).length > 0;

  // details = entregou menos; more = entregou tudo e mais algumas unidades (só a loja)
  const [step, setStep] = useState<"ask" | "details" | "more">("ask");
  const [mode, setMode] = useState<ShortfallMode>("pending");
  const [deliveredInput, setDeliveredInput] = useState<Record<number, string>>({});
  const [lostInput, setLostInput] = useState<Record<number, string>>({});
  const [extraInput, setExtraInput] = useState<Record<number, string>>({});
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

  // "Entreguei mais": todo o restante sai e cada unidade a mais é cobrada pelo
  // mesmo preço unitário do item no pedido
  const stockByProduct = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    for (const p of products) map[p.id] = p.stock;
    return map;
  }, [products]);
  const moreRows = progress.map((item) => {
    const extra = Math.max(0, parseInt(extraInput[item.index] || "0", 10) || 0);
    const unitPrice = Number(order.items[item.index]?.price) || 0;
    const stock = item.productId ? stockByProduct[item.productId] : undefined;
    return { ...item, extra, unitPrice, extraAmount: extra * unitPrice, stock };
  });
  const moreTotal = moreRows.reduce((sum, row) => sum + row.extraAmount, 0);
  const moreUnits = moreRows.reduce((sum, row) => sum + row.extra, 0);
  const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "authorized";
  const missingReason = totals.lost > 0 && !lossReason.trim();

  const submit = async (items: RegisterOrderDeliveryPayload["items"]) => {
    setSaving(true);
    setError(null);
    try {
      const result = await submitDelivery(order.id, {
        items,
        lossReason: lossReason.trim() || undefined,
        note: note.trim() || undefined,
      });
      onDelivered(result.deliveryStatus, result.extraAmount);
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

  const openMore = () => {
    setExtraInput({});
    setError(null);
    setStep("more");
  };

  const handleMoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (moreUnits === 0) return;
    submit(
      moreRows.map((row) => ({
        index: row.index,
        delivered: row.remaining,
        lost: 0,
        ...(row.extra > 0 ? { extra: row.extra } : {}),
      })),
    );
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

  type DeliveryRow = (typeof rows)[number];
  const fieldClass =
    "rounded-lg border border-stone-300 px-2 py-1 focus:border-[var(--color-primary)] focus:outline-none";

  const renderDeliveredInput = (row: DeliveryRow, className: string) => (
    <input
      type="number"
      min={0}
      max={row.remaining}
      value={deliveredInput[row.index] ?? ""}
      onChange={(e) =>
        setDeliveredInput((prev) => ({ ...prev, [row.index]: e.target.value }))
      }
      className={`${fieldClass} ${className}`}
    />
  );

  const renderLostInput = (row: DeliveryRow, className: string) => (
    <input
      type="number"
      min={0}
      max={row.remaining - row.delivered}
      value={lostInput[row.index] ?? ""}
      onChange={(e) => setLostInput((prev) => ({ ...prev, [row.index]: e.target.value }))}
      className={`${fieldClass} ${className}`}
    />
  );

  // Última coluna: no modo "perda" mostra a perda, nos outros o que fica pendente
  const outcomeLabel = mode === "loss" ? "Perda" : "Fica pendente";
  const outcomeValue = (row: DeliveryRow) => (mode === "loss" ? row.lost : row.pending);
  const outcomeClass = (row: DeliveryRow) =>
    mode === "loss"
      ? row.lost > 0
        ? "text-red-600"
        : ""
      : row.pending > 0
        ? "text-amber-600"
        : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-xl font-bold text-stone-800">
          {isFollowUp ? text.followUpTitle : text.title}
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
              {isFollowUp ? text.followUpAsk : text.ask}
            </p>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
                {text.no}
              </button>
              {audience === "admin" && (
                <button
                  type="button"
                  onClick={openMore}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Entreguei mais
                </button>
              )}
              <button
                type="button"
                onClick={deliverEverything}
                disabled={saving}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Salvando..." : text.yes}
              </button>
            </div>
          </>
        ) : step === "more" ? (
          <form onSubmit={handleMoreSubmit} className="space-y-4">
            <div>
              <p className="font-semibold text-stone-800">Quanto entregou a mais de cada item?</p>
              <p className="text-sm text-stone-500">
                Todo o restante do pedido é marcado como entregue. As unidades a mais saem do
                estoque e são cobradas do cliente pelo preço unitário do pedido.
              </p>
            </div>

            <div className="space-y-2">
              {moreRows.map((row) => (
                <div
                  key={row.index}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-stone-200 p-3"
                >
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="font-semibold text-stone-800">{row.name}</p>
                    <p className="text-xs text-stone-500">
                      Entregando {row.remaining} do pedido · {formatCurrency(row.unitPrice)} / un.
                      {row.stock !== undefined && row.stock !== null && ` · estoque: ${row.stock}`}
                    </p>
                    {row.stock !== undefined && row.stock !== null && row.extra > row.stock && (
                      <p className="text-xs font-semibold text-amber-600">
                        Mais do que o estoque disponível — o estoque ficará zerado.
                      </p>
                    )}
                  </div>
                  <label className="text-xs font-semibold text-stone-600">
                    A mais
                    <input
                      type="number"
                      min={0}
                      value={extraInput[row.index] ?? ""}
                      onChange={(e) =>
                        setExtraInput((prev) => ({ ...prev, [row.index]: e.target.value }))
                      }
                      placeholder="0"
                      className="mt-1 block w-20 rounded-lg border border-stone-300 px-2 py-1 text-base font-normal focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </label>
                  <div className="w-24 text-right text-sm">
                    <span className="block text-xs text-stone-500">Acréscimo</span>
                    <span className={`font-semibold ${row.extra > 0 ? "text-blue-700" : "text-stone-400"}`}>
                      {formatCurrency(row.extraAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {moreUnits > 0 && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">
                  Acréscimo: {moreUnits} un. = {formatCurrency(moreTotal)}
                </p>
                <p className="text-xs">
                  {isPaid
                    ? "O pedido já está pago: o acréscimo fica pendente para o cliente pagar."
                    : `O valor do pedido passa de ${formatCurrency(order.total)} para ${formatCurrency(
                        Number(order.total) + moreTotal,
                      )}.`}
                </p>
              </div>
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

            {moreUnits === 0 && (
              <p className="text-sm text-stone-500">Informe quantas unidades entregou a mais.</p>
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
                disabled={saving || moreUnits === 0}
                className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Confirmar entrega"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-semibold text-stone-700">
                {text.whyLess}
              </legend>
              {text.options.map((option) => (
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

            {/* Celular: um cartão por item, com os campos rotulados */}
            <div className="space-y-2 sm:hidden">
              {rows.map((row) => (
                <div key={row.index} className="rounded-lg border border-stone-200 p-3">
                  <p className="font-semibold text-stone-800">{row.name}</p>
                  <p className="text-xs text-stone-500">
                    {text.toDeliver}: {row.remaining}
                  </p>
                  <div className={`mt-2 grid gap-2 ${mode === "mixed" ? "grid-cols-3" : "grid-cols-2"}`}>
                    <label className="text-xs font-semibold text-stone-600">
                      {text.deliveredNow}
                      {renderDeliveredInput(row, "mt-1 w-full")}
                    </label>
                    {mode === "mixed" && (
                      <label className="text-xs font-semibold text-stone-600">
                        Perda
                        {renderLostInput(row, "mt-1 w-full")}
                      </label>
                    )}
                    <div className="text-xs font-semibold text-stone-600">
                      {outcomeLabel}
                      <p className={`mt-1 py-1 text-base ${outcomeClass(row)}`}>{outcomeValue(row)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                    <th className="py-2 pr-2">Item</th>
                    <th className="px-2 py-2">{text.toDeliver}</th>
                    <th className="px-2 py-2">{text.deliveredNow}</th>
                    {mode === "mixed" && <th className="px-2 py-2">Perda</th>}
                    <th className="px-2 py-2">{outcomeLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className="border-b border-stone-100 last:border-0">
                      <td className="py-2 pr-2 font-semibold text-stone-800">{row.name}</td>
                      <td className="px-2 py-2">{row.remaining}</td>
                      <td className="px-2 py-2">
                        {renderDeliveredInput(row, "w-20")}
                      </td>
                      {mode === "mixed" && (
                        <td className="px-2 py-2">
                          {renderLostInput(row, "w-20")}
                        </td>
                      )}
                      <td className={`px-2 py-2 font-semibold ${outcomeClass(row)}`}>
                        {outcomeValue(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totals.lost > 0 && (
              <div className="space-y-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {audience === "admin" ? (
                  <>
                    <p className="font-semibold">
                      Prejuízo estimado: {totals.lost} un. ≈ {formatCurrency(totals.lossCost)}
                    </p>
                    <p className="text-xs">Calculado pelo custo unitário de cada produto.</p>
                  </>
                ) : (
                  <p className="font-semibold">{totals.lost} un. registrada(s) como perda</p>
                )}
                <label className="block font-semibold">
                  {text.lossReason}
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
                <strong>entrega parcial</strong> {text.pendingNotice}.
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
                {saving ? "Salvando..." : text.confirm}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderDeliveryModal;
