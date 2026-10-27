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
    label: "Não foi entregue (cliente retirou menos / não estava pronto)",
    hint: "O que faltou sai do pedido e volta ao estoque. O cliente paga só o que recebeu.",
  },
  {
    value: "loss",
    label: "O que faltou foi perda",
    hint: "Baixado como perda (prejuízo). O cliente não paga por ele.",
  },
  {
    value: "mixed",
    label: "Parte foi perda e parte não foi entregue",
    hint: "Informe a perda de cada item; o resto sai do pedido e volta ao estoque.",
  },
];

// Mesmo formulário quando o próprio cliente confirma o recebimento (liberado pelo
// admin na aba "Clientes"), só com os textos do ponto de vista de quem recebe.
const CUSTOMER_SHORTFALL_OPTIONS: ShortfallOption[] = [
  {
    value: "pending",
    label: "Não recebi o restante",
    hint: "O que faltou sai do pedido. Você paga só o que recebeu.",
  },
  {
    value: "loss",
    label: "O restante chegou com defeito / quebrado",
    hint: "Registrado como perda. Você não paga por ele.",
  },
  {
    value: "mixed",
    label: "Parte chegou com defeito e parte não recebi",
    hint: "Informe a perda de cada item; o resto sai do pedido.",
  },
];

const TEXTS = {
  admin: {
    title: "📦 Entregar ao cliente",
    followUpTitle: "📦 Realizar resto da entrega",
    ask: "Entregou toda a quantidade descrita no pedido?",
    followUpAsk: "Entregou todo o restante?",
    yes: "Sim, entreguei tudo",
    no: "Entreguei quantidade diferente",
    howMany: "Quanto entregou de cada item?",
    howManyHint:
      "Pode ser mais ou menos do que o pedido. Unidades a mais saem do estoque e entram como acréscimo no pedido.",
    whyLess: "Por que entregou menos? (vale para os itens que faltaram)",
    toDeliver: "A entregar",
    deliveredNow: "Entregue agora",
    lossReason: "Motivo da perda *",
    pendingNotice: "saem do pedido e voltam ao estoque",
    finalizeNotice:
      "Ao confirmar, o pedido é finalizado com os itens entregues e não poderá mais ser editado.",
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
    howMany: "Quanto recebeu de cada item?",
    howManyHint: "",
    whyLess: "Por que recebeu menos?",
    toDeliver: "A receber",
    deliveredNow: "Recebido agora",
    lossReason: "O que aconteceu? *",
    pendingNotice: "saem do pedido",
    finalizeNotice: "Ao confirmar, o pedido é finalizado só com os itens que você recebeu.",
    confirm: "Confirmar recebimento",
    options: CUSTOMER_SHORTFALL_OPTIONS,
  },
};

interface OrderDeliveryModalProps {
  order: Order;
  products: Product[];
  onClose: () => void;
  onDelivered: (
    deliveryStatus: "partial" | "delivered",
    extraAmount?: number,
    total?: number,
  ) => void;
  audience?: "admin" | "customer";
  // Por padrão registra pela rota do admin/cozinha
  submitDelivery?: (
    orderId: string,
    payload: RegisterOrderDeliveryPayload,
  ) => Promise<{ deliveryStatus: "partial" | "delivered"; extraAmount?: number; total?: number }>;
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

  // details = entregou uma quantidade diferente do pedido (menos de um item, mais de
  // outro). A loja pode informar mais que o restante (vira acréscimo); o cliente não.
  const [step, setStep] = useState<"ask" | "details">("ask");
  const [mode, setMode] = useState<ShortfallMode>("pending");
  const [deliveredInput, setDeliveredInput] = useState<Record<number, string>>({});
  const [lostInput, setLostInput] = useState<Record<number, string>>({});
  const [lossReason, setLossReason] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDeliverMore = audience === "admin";

  const unitCostByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) map[p.id] = Number(p.priceRaw) || 0;
    return map;
  }, [products]);

  const stockByProduct = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    for (const p of products) map[p.id] = p.stock;
    return map;
  }, [products]);

  const rows = progress.map((item) => {
    const typed = Math.max(0, parseInt(deliveredInput[item.index] || "0", 10) || 0);
    const delivered = canDeliverMore ? typed : Math.min(typed, item.remaining);
    // Do pedido saem no máximo "remaining"; o que passar disso é acréscimo
    const fromOrder = Math.min(delivered, item.remaining);
    const extra = delivered - fromOrder;
    const short = item.remaining - fromOrder;
    // Só os itens que faltaram passam pelo "por que entregou menos?"
    const lost =
      mode === "loss" ? short : mode === "mixed" ? toQty(lostInput[item.index], short) : 0;
    const pending = short - lost;
    const unitCost = item.productId ? unitCostByProduct[item.productId] || 0 : 0;
    const unitPrice = Number(order.items[item.index]?.price) || 0;
    const stock = item.productId ? stockByProduct[item.productId] : undefined;
    return {
      ...item,
      fromOrder,
      extra,
      short,
      lost,
      pending,
      lossCost: lost * unitCost,
      unitPrice,
      extraAmount: extra * unitPrice,
      shortAmount: short * unitPrice,
      stock,
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      fromOrder: acc.fromOrder + row.fromOrder,
      extra: acc.extra + row.extra,
      extraAmount: acc.extraAmount + row.extraAmount,
      shortAmount: acc.shortAmount + row.shortAmount,
      short: acc.short + row.short,
      lost: acc.lost + row.lost,
      pending: acc.pending + row.pending,
      lossCost: acc.lossCost + row.lossCost,
    }),
    {
      fromOrder: 0,
      extra: 0,
      extraAmount: 0,
      shortAmount: 0,
      short: 0,
      lost: 0,
      pending: 0,
      lossCost: 0,
    },
  );
  // A entrega finaliza o pedido: cobra o entregue (com as unidades a mais) e tira o
  // que faltou (não entregue ou perda)
  const currentTotal = Number(order.total) || 0;
  const finalTotal = Math.max(0, currentTotal + totals.extraAmount - totals.shortAmount);
  const balance = finalTotal - currentTotal;
  const nothingToRegister = totals.fromOrder + totals.extra + totals.lost === 0;
  const missingReason = totals.lost > 0 && !lossReason.trim();
  const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "authorized";

  const submit = async (items: RegisterOrderDeliveryPayload["items"]) => {
    setSaving(true);
    setError(null);
    try {
      const result = await submitDelivery(order.id, {
        items,
        lossReason: lossReason.trim() || undefined,
        note: note.trim() || undefined,
      });
      onDelivered(result.deliveryStatus, result.extraAmount, result.total);
    } catch (err: any) {
      setError(err?.message || "Erro ao registrar entrega");
    } finally {
      setSaving(false);
    }
  };

  const deliverEverything = () =>
    submit(progress.map((item) => ({ index: item.index, delivered: item.remaining, lost: 0 })));

  const openDetails = () => {
    // Começa com a quantidade do pedido; o usuário ajusta para mais ou para menos
    setDeliveredInput(
      Object.fromEntries(progress.map((item) => [item.index, String(item.remaining)])),
    );
    setError(null);
    setStep("details");
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nothingToRegister || missingReason) return;
    submit(
      rows
        .filter((row) => row.fromOrder + row.extra + row.lost > 0)
        .map((row) => ({
          index: row.index,
          delivered: row.fromOrder,
          lost: row.lost,
          ...(row.extra > 0 ? { extra: row.extra } : {}),
        })),
    );
  };

  type DeliveryRow = (typeof rows)[number];
  const fieldClass =
    "rounded-lg border border-stone-300 px-2 py-1 focus:border-[var(--color-primary)] focus:outline-none";

  const renderDeliveredInput = (row: DeliveryRow, className: string) => (
    <input
      type="number"
      min={0}
      max={canDeliverMore ? undefined : row.remaining}
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
      max={row.short}
      value={lostInput[row.index] ?? ""}
      onChange={(e) => setLostInput((prev) => ({ ...prev, [row.index]: e.target.value }))}
      className={`${fieldClass} ${className}`}
    />
  );

  // Situação de cada item: completo, com unidades a mais ou faltando
  const renderStatus = (row: DeliveryRow) => {
    if (row.extra > 0) {
      return (
        <span className="font-semibold text-blue-700">
          +{row.extra} a mais · {formatCurrency(row.extraAmount)}
          {row.stock !== undefined && row.stock !== null && row.extra > row.stock && (
            <span className="block text-xs font-normal text-amber-600">
              Acima do estoque ({row.stock}) — ficará zerado
            </span>
          )}
        </span>
      );
    }
    if (row.short > 0) {
      return (
        <span className="font-semibold">
          {row.lost > 0 && <span className="text-red-600">perda {row.lost}</span>}
          {row.lost > 0 && row.pending > 0 && " · "}
          {row.pending > 0 && <span className="text-amber-600">{row.pending} não entregue</span>}
        </span>
      );
    }
    return <span className="font-semibold text-green-600">✓ completo</span>;
  };

  const showLossColumn = mode === "mixed" && totals.short > 0;

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
            <p className="mb-3 text-xs text-stone-500">{text.finalizeNotice}</p>
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
                {text.no}
              </button>
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
        ) : (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <p className="font-semibold text-stone-800">{text.howMany}</p>
              {text.howManyHint && <p className="text-sm text-stone-500">{text.howManyHint}</p>}
            </div>

            {/* Celular: um cartão por item, com os campos rotulados */}
            <div className="space-y-2 sm:hidden">
              {rows.map((row) => (
                <div key={row.index} className="rounded-lg border border-stone-200 p-3">
                  <p className="font-semibold text-stone-800">{row.name}</p>
                  <p className="text-xs text-stone-500">
                    {text.toDeliver}: {row.remaining}
                    {canDeliverMore && ` · ${formatCurrency(row.unitPrice)} / un.`}
                  </p>
                  <div className={`mt-2 grid gap-2 ${showLossColumn ? "grid-cols-3" : "grid-cols-2"}`}>
                    <label className="text-xs font-semibold text-stone-600">
                      {text.deliveredNow}
                      {renderDeliveredInput(row, "mt-1 w-full")}
                    </label>
                    {showLossColumn && (
                      <label className="text-xs font-semibold text-stone-600">
                        Perda
                        {row.short > 0 ? (
                          renderLostInput(row, "mt-1 w-full")
                        ) : (
                          <span className="mt-1 block py-1 text-base text-stone-400">—</span>
                        )}
                      </label>
                    )}
                    <div className="text-xs font-semibold text-stone-600">
                      Situação
                      <p className="mt-1 py-1 text-sm">{renderStatus(row)}</p>
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
                    {showLossColumn && <th className="px-2 py-2">Perda</th>}
                    <th className="px-2 py-2">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className="border-b border-stone-100 last:border-0">
                      <td className="py-2 pr-2">
                        <span className="font-semibold text-stone-800">{row.name}</span>
                        {canDeliverMore && (
                          <span className="block text-xs text-stone-500">
                            {formatCurrency(row.unitPrice)} / un.
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">{row.remaining}</td>
                      <td className="px-2 py-2">{renderDeliveredInput(row, "w-20")}</td>
                      {showLossColumn && (
                        <td className="px-2 py-2">
                          {row.short > 0 ? renderLostInput(row, "w-20") : <span className="text-stone-400">—</span>}
                        </td>
                      )}
                      <td className="px-2 py-2">{renderStatus(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Só explica o que faltou; o que foi a mais entra direto como acréscimo */}
            {totals.short > 0 && (
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
            )}

            {/* Valor final: o pedido é finalizado cobrando só o que foi entregue */}
            <div className="space-y-1 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              {totals.extra > 0 && (
                <p>
                  Acréscimo: {totals.extra} un. a mais = +{formatCurrency(totals.extraAmount)}
                </p>
              )}
              {totals.short > 0 && (
                <p>
                  Não entregue: {totals.short} un. = −{formatCurrency(totals.shortAmount)}
                </p>
              )}
              <p className="font-semibold">
                Valor final do pedido: {formatCurrency(finalTotal)}
                {balance !== 0 && (
                  <span className="font-normal"> (antes {formatCurrency(currentTotal)})</span>
                )}
              </p>
              {isPaid && balance > 0 && (
                <p className="text-xs">
                  O pedido já está pago: {formatCurrency(balance)} ficam como acréscimo a pagar.
                </p>
              )}
              {isPaid && balance < 0 && (
                <p className="text-xs">
                  O pedido já está pago: {formatCurrency(-balance)} ficam como valor a devolver ao
                  cliente.
                </p>
              )}
              <p className="text-xs text-blue-700">{text.finalizeNotice}</p>
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
                <strong>{totals.pending}</strong> unidade(s) não entregue(s) {text.pendingNotice}.
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
                Informe ao menos uma unidade entregue{totals.short > 0 && mode !== "pending" ? " ou perdida" : ""}.
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
