import React from "react";
import type { OrderItemDeliveryProgress } from "../utils/orderDelivery";

// Situação de entrega de um item ao lado da linha do pedido: unidades a mais,
// quanto foi entregue / quanto falta (entrega parcial) e perdas.
// tone: "light" para fundo claro (histórico do admin), "dark" para as telas escuras.
// Cores em style (e não classes): o tema escuro do admin repinta todo <span> de
// azul-claro via CSS, e só o estilo inline continua valendo por cima dele.
const TONES = {
  light: { extra: "#1d4ed8", short: "#b45309", lost: "#dc2626" },
  dark: { extra: "#93c5fd", short: "#fcd34d", lost: "#fca5a5" },
};

interface OrderItemDeliveryNoteProps {
  progress?: OrderItemDeliveryProgress;
  extraQuantity?: number;
  tone?: keyof typeof TONES;
}

const OrderItemDeliveryNote: React.FC<OrderItemDeliveryNoteProps> = ({
  progress,
  extraQuantity,
  tone = "light",
}) => {
  const colors = TONES[tone];
  const extra = Number(extraQuantity) || 0;
  // Faltando só faz sentido depois que alguma entrega foi registrada
  const started = Boolean(progress && progress.delivered + progress.lost > 0);
  const short = started && progress ? progress.remaining : 0;
  const lost = progress?.lost || 0;
  if (extra === 0 && short === 0 && lost === 0) return null;

  return (
    <span className="ml-1 text-xs font-semibold">
      {extra > 0 && <span style={{ color: colors.extra }}>(+{extra} entregue a mais)</span>}
      {short > 0 && progress && (
        <span className="ml-1" style={{ color: colors.short }}>
          ({progress.delivered} de {progress.quantity} entregues · faltam {short})
        </span>
      )}
      {lost > 0 && (
        <span className="ml-1" style={{ color: colors.lost }}>
          (perda {lost})
        </span>
      )}
    </span>
  );
};

export default OrderItemDeliveryNote;
