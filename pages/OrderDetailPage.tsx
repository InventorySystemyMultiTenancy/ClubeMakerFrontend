import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Order } from "../types";
import { formatCurrency, getOrderItemPricingInfo } from "../utils/orderPricing";
import { buildReceiptPdfUrl } from "../utils/receiptPdf";
import {
  downloadProjectOrderFile,
  getProjectOrderDetails,
  isProjectOrder,
} from "../utils/projectOrder";

const OrderDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Recebe o pedido via state da navegação
  const order: Order | undefined = location.state?.order;

  if (!order) {
    return (
      <div className="min-h-screen bg-[#050604] bg-[radial-gradient(circle_at_16%_8%,rgba(37,99,235,0.24),transparent_24rem),radial-gradient(circle_at_86%_78%,rgba(239,36,36,0.14),transparent_22rem)] px-4 py-6 text-white">
        <div className="mx-auto rounded-xl border border-blue-500/20 bg-[#071226] p-6 text-center shadow-xl shadow-blue-950/25">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Pedido não encontrado
          </h2>
          <button
            className="bg-[var(--color-primary)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--color-primary-active)] transition-colors shadow-md"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const projectDetails = getProjectOrderDetails(order);

  return (
    <div className="min-h-screen bg-[#050604] bg-[radial-gradient(circle_at_16%_8%,rgba(37,99,235,0.24),transparent_24rem),radial-gradient(circle_at_86%_78%,rgba(239,36,36,0.14),transparent_22rem)] px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl rounded-xl border border-blue-500/20 bg-[#071226] p-6 shadow-xl shadow-blue-950/25">
        <h1 className="mb-4 text-3xl font-bold text-white">
          Detalhes do Pedido #{order.id.slice(-4)}
        </h1>
        <button
          className="mb-4 bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors shadow-md"
          onClick={() => {
            const backendUrl =
              import.meta.env.VITE_API_URL || "http://localhost:3001";
            window.open(
              buildReceiptPdfUrl(backendUrl, order.id),
              "_blank",
            );
          }}
        >
          Gerar PDF do Pedido
        </button>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Cliente:</span>{" "}
          {order.userName || "-"}
        </div>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Data/Hora:</span>{" "}
          {new Date(order.timestamp).toLocaleString()}
        </div>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Forma de Pagamento:</span>{" "}
          {(() => {
            if (!order.paymentType) return "-";
            if (order.paymentType === "presencial") {
              return "Presencial";
            }
            if (order.paymentType === "online") {
              if (order.paymentMethod === "credit")
                return "Cartão de Crédito (Mercado Pago)";
              if (order.paymentMethod === "debit")
                return "Cartão de Débito (Mercado Pago)";
              if (order.paymentMethod === "pix") return "Pix (Mercado Pago)";
              return "Online (Mercado Pago)";
            }
            return order.paymentType;
          })()}
        </div>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Status do Pagamento:</span>{" "}
          {order.paymentStatus || "-"}
        </div>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Total:</span> R$
          {Number(order.total).toFixed(2) ?? "-"}
        </div>
        {isProjectOrder(order) && projectDetails && (
          <div className="mb-4 rounded-lg border border-blue-400/30 bg-blue-950/35 p-4 text-sm text-blue-50">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-base font-black text-blue-100">
                Pedido criado a partir de orcamento
              </span>
              {projectDetails.hasFile && (
                <button
                  type="button"
                  onClick={() => downloadProjectOrderFile(order.id)}
                  className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white"
                >
                  Baixar arquivo do projeto
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <p>Arquivo: {projectDetails.fileName}</p>
              <p>Tamanho: {projectDetails.size}</p>
              <p>
                Medidas: {projectDetails.height} x {projectDetails.width} x{" "}
                {projectDetails.depth}
              </p>
              <p>Pecas: {projectDetails.pieceQuantity}</p>
              <p>
                Cores: {projectDetails.colorQuantity} - {projectDetails.colors}
              </p>
              <p>Prazo: {projectDetails.deliveryDeadline}</p>
              <p className="sm:col-span-2">
                Dados de envio: {projectDetails.shippingData}
              </p>
              {projectDetails.adminObservation && (
                <p className="sm:col-span-2">
                  Obs. admin: {projectDetails.adminObservation}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Itens:</span>
          <ul className="list-disc ml-6">
            {order.items.map((item, idx) => {
              const pricing = getOrderItemPricingInfo(item);

              return (
                <li key={item.productId || item.id || idx} className="mb-2">
                  <div>
                    {item.quantity}x {item.name} -{" "}
                    {formatCurrency(pricing.lineTotal)}
                  </div>
                  {pricing.hasPricingDetails && (
                    <div className="text-xs text-blue-200/65">
                      Unit.: {formatCurrency(pricing.unitPrice)}
                      {pricing.hasCustomPrice &&
                        ` | Valor admin: ${formatCurrency(
                          pricing.customUnitPrice,
                        )}`}
                      {pricing.hasDiscount &&
                        ` | Desconto: ${pricing.discountPercent.toFixed(2)}%`}
                      {pricing.hasOriginalPrice &&
                        ` | Original: ${formatCurrency(
                          pricing.originalUnitPrice,
                        )}`}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        {order.observation && (
          <div className="mb-2 rounded border border-yellow-300/30 bg-yellow-950/30 p-2 text-yellow-100">
            <span className="font-semibold">Observação:</span>{" "}
            {order.observation}
          </div>
        )}
        <button
          className="mt-6 bg-[var(--color-primary)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--color-primary-active)] transition-colors shadow-md"
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default OrderDetailPage;
