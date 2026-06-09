import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import type { Order, OrderItem, Product } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { authenticatedFetch, getProducts } from "../services/apiService";
import { formatCurrency, getOrderItemPricingInfo } from "../utils/orderPricing";
import {
  downloadProjectOrderFile,
  getProjectOrderDetails,
  isProjectOrder,
} from "../utils/projectOrder";

const OrderDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  // Recebe o pedido via state da navegação
  const order: Order | undefined = location.state?.order;
  const [currentOrder, setCurrentOrder] = useState<Order | undefined>(order);
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableItems, setEditableItems] = useState<OrderItem[]>(
    order?.items || [],
  );

  useEffect(() => {
    if (!isAdmin) return;
    getProducts().then(setProducts);
  }, [isAdmin]);

  const editableTotal = useMemo(
    () =>
      editableItems.reduce(
        (sum, item) =>
          sum +
          Math.max(0, Number(item.price) || 0) *
            Math.max(1, Number(item.quantity) || 1),
        0,
      ),
    [editableItems],
  );

  const updateEditableItem = (
    index: number,
    updates: Partial<OrderItem>,
  ) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item)),
    );
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    updateEditableItem(index, {
      id: product.id,
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      originalUnitPrice: Number(product.compareAtPrice ?? product.price) || 0,
      customUnitPrice: Number(product.price) || 0,
      discountPercent: 0,
    });
  };

  const addEditableItem = () => {
    const product = products[0];
    if (!product) return;

    setEditableItems((prev) => [
      ...prev,
      {
        id: product.id,
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: Number(product.price) || 0,
        originalUnitPrice: Number(product.compareAtPrice ?? product.price) || 0,
        customUnitPrice: Number(product.price) || 0,
        discountPercent: 0,
      },
    ]);
  };

  const saveOrderItems = async () => {
    if (!currentOrder || editableItems.length === 0) return;

    setIsSaving(true);
    try {
      const normalizedItems = editableItems.map((item) => ({
        ...item,
        id: item.productId || item.id,
        productId: item.productId || item.id,
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Math.max(0, Number(item.price) || 0),
        customUnitPrice: Math.max(0, Number(item.price) || 0),
      }));

      const response = await authenticatedFetch(
        `${backendUrl}/api/orders/${currentOrder.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            items: normalizedItems,
            total: Number(editableTotal.toFixed(2)),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao salvar alteracoes do pedido");
      }

      const updated = await response.json();
      setCurrentOrder(updated);
      setEditableItems(updated.items || []);
      setIsEditing(false);
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Pedido atualizado",
        showConfirmButton: false,
        timer: 1800,
      });
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Erro ao salvar",
        text: error.message || "Nao foi possivel atualizar o pedido.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentOrder) {
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

  const projectDetails = getProjectOrderDetails(currentOrder);

  return (
    <div className="min-h-screen bg-[#050604] bg-[radial-gradient(circle_at_16%_8%,rgba(37,99,235,0.24),transparent_24rem),radial-gradient(circle_at_86%_78%,rgba(239,36,36,0.14),transparent_22rem)] px-4 py-6 text-white">
      <div className="mx-auto max-w-2xl rounded-xl border border-blue-500/20 bg-[#071226] p-6 shadow-xl shadow-blue-950/25">
        <h1 className="mb-4 text-3xl font-bold text-white">
          Detalhes do Pedido #{currentOrder.id.slice(-4)}
        </h1>
        <button
          className="mb-4 bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors shadow-md"
          onClick={() => {
            const backendUrl =
              import.meta.env.VITE_API_URL || "http://localhost:3001";
            window.open(
              `${backendUrl}/api/orders/${currentOrder.id}/receipt-pdf`,
              "_blank",
            );
          }}
        >
          Gerar PDF do Pedido
        </button>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Cliente:</span>{" "}
          {currentOrder.userName || "-"}
        </div>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Data/Hora:</span>{" "}
          {new Date(currentOrder.timestamp).toLocaleString()}
        </div>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Forma de Pagamento:</span>{" "}
          {(() => {
            if (!currentOrder.paymentType) return "-";
            if (currentOrder.paymentType === "presencial") {
              return "Presencial";
            }
            if (currentOrder.paymentType === "online") {
              if (currentOrder.paymentMethod === "credit")
                return "Cartão de Crédito (Mercado Pago)";
              if (currentOrder.paymentMethod === "debit")
                return "Cartão de Débito (Mercado Pago)";
              if (currentOrder.paymentMethod === "pix") return "Pix (Mercado Pago)";
              return "Online (Mercado Pago)";
            }
            return currentOrder.paymentType;
          })()}
        </div>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Status do Pagamento:</span>{" "}
          {currentOrder.paymentStatus || "-"}
        </div>
        <div className="mb-2 text-blue-100">
          <span className="font-semibold">Total:</span> R$
          {Number(currentOrder.total).toFixed(2) ?? "-"}
        </div>
        {isProjectOrder(currentOrder) && projectDetails && (
          <div className="mb-4 rounded-lg border border-blue-400/30 bg-blue-950/35 p-4 text-sm text-blue-50">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-base font-black text-blue-100">
                Pedido criado a partir de orcamento
              </span>
              {projectDetails.hasFile && (
                <button
                  type="button"
                  onClick={() => downloadProjectOrderFile(currentOrder.id)}
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">Itens:</span>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={addEditableItem}
                      className="rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      + Adicionar produto
                    </button>
                    <button
                      type="button"
                      onClick={saveOrderItems}
                      disabled={isSaving || editableItems.length === 0}
                      className="rounded bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditableItems(currentOrder.items);
                        setIsEditing(false);
                      }}
                      className="rounded bg-stone-600 px-3 py-2 text-xs font-bold text-white hover:bg-stone-700"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditableItems(currentOrder.items);
                      setIsEditing(true);
                    }}
                    className="rounded bg-yellow-500 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-yellow-400"
                  >
                    Editar pedido
                  </button>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              {editableItems.map((item, idx) => (
                <div
                  key={`${item.productId || item.id || "item"}-${idx}`}
                  className="grid gap-2 rounded-lg border border-blue-500/20 bg-black/25 p-3 sm:grid-cols-[1fr_90px_120px_auto]"
                >
                  <label className="flex flex-col gap-1 text-xs font-bold text-blue-100">
                    Produto
                    <select
                      value={item.productId || item.id || ""}
                      onChange={(event) =>
                        handleProductChange(idx, event.target.value)
                      }
                      className="h-10 rounded border border-blue-500/30 bg-black px-2 text-sm text-white"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-blue-100">
                    Qtd
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateEditableItem(idx, {
                          quantity: Math.max(1, Number(event.target.value) || 1),
                        })
                      }
                      className="h-10 rounded border border-blue-500/30 bg-black px-2 text-sm text-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold text-blue-100">
                    Valor un.
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.price}
                      onChange={(event) =>
                        updateEditableItem(idx, {
                          price: Math.max(0, Number(event.target.value) || 0),
                          customUnitPrice: Math.max(
                            0,
                            Number(event.target.value) || 0,
                          ),
                        })
                      }
                      className="h-10 rounded border border-blue-500/30 bg-black px-2 text-sm text-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditableItems((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== idx),
                      )
                    }
                    disabled={editableItems.length === 1}
                    className="self-end rounded bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <div className="text-right text-lg font-bold text-white">
                Novo total: {formatCurrency(editableTotal)}
              </div>
            </div>
          ) : (
            <ul className="list-disc ml-6">
              {currentOrder.items.map((item, idx) => {
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
          )}
        </div>
        {currentOrder.observation && (
          <div className="mb-2 rounded border border-yellow-300/30 bg-yellow-950/30 p-2 text-yellow-100">
            <span className="font-semibold">Observação:</span>{" "}
            {currentOrder.observation}
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

