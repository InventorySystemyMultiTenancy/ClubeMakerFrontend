import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Order, Product } from "../types";
import Swal from "sweetalert2";
import {
  authenticatedFetch,
  deleteOrderFromHistory,
  getProducts,
  getToken,
} from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, getOrderItemPricingInfo } from "../utils/orderPricing";
import { getPaymentMethodLabel } from "../utils/paymentLabels";
import {
  getOrderDeliveryProgress,
  getPendingUnits,
  isOrderFullyDelivered,
} from "../utils/orderDelivery";
import OrderDeliveryModal from "../components/admin/OrderDeliveryModal";
import OrderItemDeliveryNote from "../components/OrderItemDeliveryNote";

// Página de Histórico de Pedidos com filtro por data
// (OrderHistoryPage)

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUndeliveredOnly, setShowUndeliveredOnly] = useState(false);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productFilter, setProductFilter] = useState("");
  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
  const isAdmin = currentUser?.role === "admin";

  const getErrorMessageByStatus = (status?: number) => {
    if (status === 401 || status === 403) {
      return "Permissão negada ou sessão expirada. Faça login novamente.";
    }
    if (status === 404) {
      return "Este pedido já não existe no histórico.";
    }
    if (status === 500) {
      return "Erro interno do servidor. Tente novamente em instantes.";
    }
    return "Não foi possível excluir o pedido agora. Tente novamente.";
  };

  const handleDeleteFromHistory = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAdmin || deletingOrderId === order.id) return;

    const confirm = await Swal.fire({
      title: "Excluir pedido do histórico?",
      text: "Esta ação é irreversível na interface e o pedido deixará de aparecer no histórico.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    setDeletingOrderId(order.id);

    try {
      const token = getToken() || "";
      const result = await deleteOrderFromHistory(order.id, token);

      if (result.ok) {
        setOrders((prev) => prev.filter((item) => item.id !== order.id));
        await Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: result.message || "Pedido excluído do histórico",
          showConfirmButton: false,
          timer: 2200,
          timerProgressBar: true,
        });
      }
    } catch (error: any) {
      const status = error?.status as number | undefined;
      await Swal.fire({
        icon: "error",
        title: "Falha ao excluir pedido",
        text: getErrorMessageByStatus(status),
        confirmButtonText: "Tentar novamente",
      });
    } finally {
      setDeletingOrderId(null);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `${BACKEND_URL}/api/orders/history`;
      const params: string[] = [];
      if (startDate) params.push(`start=${startDate}`);
      if (endDate) params.push(`end=${endDate}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      const resp = await authenticatedFetch(url);
      if (!resp.ok) throw new Error("Erro ao buscar histórico de pedidos");
      const data: Order[] = await resp.json();
      setOrders(data);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  useEffect(() => {
    getProducts()
      .then((data: Product[]) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const filteredOrders = orders.filter((order) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      order.id.toLowerCase().includes(normalizedSearch) ||
      (order.userName || "").toLowerCase().includes(normalizedSearch);
    const isUndelivered = !isOrderFullyDelivered(order);
    const isUnpaid = !["paid", "authorized"].includes(
      order.paymentStatus ?? "pending",
    );
    const matchesProduct =
      !productFilter ||
      order.items.some((item) => item.productId === productFilter);

    if (!matchesSearch) {
      return false;
    }

    if (showUndeliveredOnly && !isUndelivered) {
      return false;
    }

    if (showUnpaidOnly && !isUnpaid) {
      return false;
    }

    if (!matchesProduct) {
      return false;
    }

    return true;
  });

  // Resumo de vendas dos pedidos listados (período e demais filtros aplicados)
  const salesSummary = filteredOrders.reduce(
    (acc, order) => {
      acc.gross += Number(order.total) || 0;
      acc.cost += Number(order.cost) || 0;
      // Pedido finalizado já tem quantity = unidades entregues
      acc.items += order.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0,
      );
      return acc;
    },
    { gross: 0, cost: 0, items: 0 },
  );
  const netSales = salesSummary.gross - salesSummary.cost;
  const formatDateBr = (value: string) => value.split("-").reverse().join("/");
  const periodLabel =
    startDate && endDate
      ? `${formatDateBr(startDate)} a ${formatDateBr(endDate)}`
      : startDate
        ? `desde ${formatDateBr(startDate)}`
        : endDate
          ? `até ${formatDateBr(endDate)}`
          : "todo o período";

  return (
    // Admin vê a página dentro do layout do painel (que já tem menu e "Sair");
    // a cozinha vê a página sozinha, com fundo e botão de sair próprios.
    <div
      className={`container mx-auto px-4 py-6 ${isAdmin ? "" : "min-h-screen bg-stone-100"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-[var(--color-primary-active)]">
          Histórico de Pedidos
        </h1>
        {!isAdmin && (
          <button
            onClick={async () => {
              if (window.confirm("Deseja realmente sair?")) {
                await logout();
                navigate("/admin/login");
              }
            }}
            className="bg-[var(--color-primary)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--color-primary-active)] transition-colors shadow-md"
          >
            🚪 Sair
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 grid grid-cols-2 gap-3 items-end sm:flex sm:flex-wrap sm:gap-4">
        <div className="col-span-2 sm:w-72">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Buscar
          </label>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome do cliente ou ID do pedido"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Data Inicial
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border rounded px-2 py-2 sm:py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Data Final
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border rounded px-2 py-2 sm:py-1"
          />
        </div>
        <div className="col-span-2 sm:w-64">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Produto
          </label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Todos os produtos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 pb-2">
          <input
            type="checkbox"
            checked={showUndeliveredOnly}
            onChange={(e) => setShowUndeliveredOnly(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          Não entregues
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 pb-2">
          <input
            type="checkbox"
            checked={showUnpaidOnly}
            onChange={(e) => setShowUnpaidOnly(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          Não pagos
        </label>
        <button
          onClick={fetchOrders}
          className="w-full sm:w-auto bg-[var(--color-primary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--color-primary-active)] transition-colors shadow-md"
        >
          Filtrar
        </button>
        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setSearchTerm("");
            setShowUndeliveredOnly(false);
            setShowUnpaidOnly(false);
            setProductFilter("");
          }}
          className="w-full sm:w-auto bg-stone-300 text-stone-700 font-bold py-2 px-4 rounded-lg hover:bg-stone-400 transition-colors shadow-md"
        >
          Limpar Filtros
        </button>
      </div>
      {isAdmin && !loading && (
        <div className="mb-6">
          <p className="text-sm text-stone-500 mb-2">
            Vendas de {periodLabel} · {filteredOrders.length} pedido
            {filteredOrders.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-600">
              <div className="text-sm font-semibold text-stone-500">
                Itens vendidos
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-800">
                {salesSummary.items.toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
              <div className="text-sm font-semibold text-stone-500">
                Custos (produtos + perdas)
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-red-600">
                {formatCurrency(salesSummary.cost)}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-600">
              <div className="text-sm font-semibold text-stone-500">
                Lucro líquido
              </div>
              <div
                className={`text-2xl sm:text-3xl font-extrabold ${netSales < 0 ? "text-red-600" : "text-green-700"}`}
              >
                {formatCurrency(netSales)}
              </div>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--color-primary-light)] border-t-[var(--color-primary)] mb-4"></div>
          <p className="text-stone-500 font-medium">Carregando histórico...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-stone-200 max-w-2xl mx-auto">
          <span className="text-6xl block mb-4">📭</span>
          <h2 className="text-2xl font-bold text-stone-700">
            Nenhum pedido encontrado
          </h2>
          <p className="text-stone-500 mt-2">
            Não há pedidos para os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[var(--color-primary)] cursor-pointer hover:shadow-lg transition"
              onClick={() =>
                navigate("/historico/detalhes", { state: { order } })
              }
            >
              <div className="flex flex-wrap justify-between items-start gap-x-3 mb-2">
                <div>
                  <div className="font-bold text-lg text-stone-800">
                    Pedido #{order.id.slice(-4)}
                  </div>
                  <div className="text-sm text-stone-500">
                    {new Date(order.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl sm:text-4xl font-extrabold text-stone-900">
                    {formatCurrency(Number(order.total) || 0)}
                  </div>
                  {Number(order.extraTotal) > 0 && (
                    <div className="text-xs text-blue-700">
                      inclui acréscimo de {formatCurrency(order.extraTotal)}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-2 text-stone-700">
                <span className="font-semibold">Cliente:</span>{" "}
                {order.userName || "-"}
              </div>
              <div className="mb-2 text-stone-700">
                <span className="font-semibold">Forma de pagamento:</span>{" "}
                {getPaymentMethodLabel(order)}
              </div>
              <ul className="mb-2">
                {order.items.map((item, idx) => {
                  const pricing = getOrderItemPricingInfo(item);
                  const deliveryProgress = getOrderDeliveryProgress(order)[idx];

                  return (
                    <li
                      key={item.productId || item.id || idx}
                      className="text-stone-800 mb-1"
                    >
                      <span className="font-semibold">{item.quantity}x</span>{" "}
                      {item.name} - {formatCurrency(pricing.lineTotal)}
                      <OrderItemDeliveryNote
                        progress={deliveryProgress}
                        extraQuantity={item.extraQuantity}
                        orderedQuantity={item.orderedQuantity}
                      />
                      {pricing.hasPricingDetails && (
                        <div className="text-xs text-stone-500 ml-5">
                          Unit.: {formatCurrency(pricing.unitPrice)}
                          {pricing.hasCustomPrice &&
                            ` | Valor admin: ${formatCurrency(
                              pricing.customUnitPrice,
                            )}`}
                          {pricing.hasDiscount &&
                            ` | Desconto: ${pricing.discountPercent.toFixed(
                              2,
                            )}%`}
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
              {(order.deliveries || []).length > 0 && (
                <div className="mb-2 rounded bg-stone-50 p-2 text-xs text-stone-600">
                  <span className="font-semibold">Entregas:</span>
                  <ul>
                    {getOrderDeliveryProgress(order).map((item) => {
                      // Pedido finalizado guarda a quantidade pedida original
                      const ordered = order.items[item.index]?.orderedQuantity;
                      return (
                        <li key={item.index}>
                          {item.name}:{" "}
                          {ordered !== undefined && ordered !== null
                            ? `pedido ${ordered} · entregue ${item.delivered}`
                            : `entregue ${item.delivered}/${item.quantity}`}
                          {item.lost > 0 && (
                            <span className="text-red-600">
                              {" "}
                              · perda {item.lost}
                            </span>
                          )}
                          {item.remaining > 0 && (
                            <span className="text-amber-700">
                              {" "}
                              · pendente {item.remaining}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {/* Observações e motivos de perda digitados ao registrar a entrega */}
                  {(order.deliveries || [])
                    .filter((delivery) => delivery.note || delivery.lossReason)
                    .map((delivery) => (
                      <div
                        key={delivery.id}
                        className="mt-2 border-t border-stone-200 pt-1"
                      >
                        <span className="text-stone-400">
                          {new Date(delivery.createdAt).toLocaleString("pt-BR")}
                          {delivery.createdByName &&
                            ` · ${delivery.createdByName}`}
                        </span>
                        {delivery.lossReason && (
                          <div className="text-red-700">
                            <span className="font-semibold">
                              Motivo da perda:
                            </span>{" "}
                            {delivery.lossReason}
                          </div>
                        )}
                        {delivery.note && (
                          <div>
                            <span className="font-semibold">
                              Observação da entrega:
                            </span>{" "}
                            {delivery.note}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
              {order.observation && (
                <div className="mb-2 text-yellow-800 bg-yellow-100 rounded p-2">
                  <span className="font-semibold">Observação:</span>{" "}
                  {order.observation}
                </div>
              )}
              <div className="flex flex-wrap justify-between items-end mt-2 gap-2">
                <div />

                {/* Pedido pago finalizado com menos itens: devolver a diferença ao cliente */}
                {Number(order.refundDue) > 0 && (
                  <>
                    <span className="text-amber-700 text-xs font-bold">
                      A DEVOLVER {formatCurrency(order.refundDue)}
                    </span>
                    <button
                      className="px-3 py-2 sm:py-1 rounded bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const resp = await authenticatedFetch(
                          `${BACKEND_URL}/api/orders/${order.id}/mark-refunded`,
                          { method: "PUT" },
                        );
                        if (resp.ok) {
                          fetchOrders();
                        } else {
                          alert("Erro ao registrar devolução");
                        }
                      }}
                    >
                      Marcar como devolvido
                    </button>
                  </>
                )}
                {/* Acréscimo de unidades entregues a mais num pedido que já estava pago */}
                {Number(order.extraChargeDue) > 0 && (
                  <>
                    <span className="text-blue-700 text-xs font-bold">
                      ACRÉSCIMO A PAGAR {formatCurrency(order.extraChargeDue)}
                    </span>
                    <button
                      className="px-3 py-2 sm:py-1 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const resp = await authenticatedFetch(
                          `${BACKEND_URL}/api/orders/${order.id}/mark-extra-paid`,
                          { method: "PUT" },
                        );
                        if (resp.ok) {
                          fetchOrders();
                        } else {
                          alert("Erro ao marcar acréscimo como pago");
                        }
                      }}
                    >
                      Marcar acréscimo como pago
                    </button>
                  </>
                )}
                {/* Exibe status do pagamento */}
                {order.paymentStatus === "pending" && (
                  <>
                    <span className="text-[var(--color-primary)] font-bold">
                      A PAGAR
                    </span>
                    <button
                      className="px-3 py-2 sm:py-1 rounded bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Chama endpoint para marcar como pago
                        const resp = await authenticatedFetch(
                          `${BACKEND_URL}/api/orders/${order.id}/mark-paid`,
                          { method: "PUT" },
                        );
                        if (resp.ok) {
                          fetchOrders();
                        } else {
                          alert("Erro ao marcar como pago");
                        }
                      }}
                    >
                      Marcar como pago
                    </button>
                  </>
                )}
                {/* Entrega ao cliente (total ou parcial) */}
                {isOrderFullyDelivered(order) ? (
                  <button
                    className="px-3 py-2 sm:py-1 rounded text-xs font-bold bg-green-500 text-white"
                    disabled
                    title="Já entregue ao cliente"
                  >
                    Entregue ao Cliente ✔
                  </button>
                ) : order.deliveryStatus === "partial" ? (
                  <>
                    <span className="text-amber-700 text-xs font-bold">
                      ENTREGA PARCIAL ({getPendingUnits(order)} pendente
                      {getPendingUnits(order) === 1 ? "" : "s"})
                    </span>
                    <button
                      className="px-3 py-2 sm:py-1 rounded text-xs font-bold transition bg-amber-500 text-white hover:bg-amber-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeliveringOrder(order);
                      }}
                    >
                      Realizar resto da entrega
                    </button>
                  </>
                ) : (
                  <button
                    className="px-3 py-2 sm:py-1 rounded text-xs font-bold transition bg-yellow-400 text-stone-800 hover:bg-yellow-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeliveringOrder(order);
                    }}
                    title="Marcar como entregue"
                  >
                    Entregar ao Cliente
                  </button>
                )}
                {isAdmin && (
                  <button
                    className="px-3 py-2 sm:py-1 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition disabled:bg-red-300 disabled:cursor-not-allowed"
                    onClick={(e) => handleDeleteFromHistory(order, e)}
                    disabled={deletingOrderId === order.id}
                    title="Excluir pedido do histórico"
                  >
                    {deletingOrderId === order.id ? "Excluindo..." : "Excluir"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {deliveringOrder && (
        <OrderDeliveryModal
          order={deliveringOrder}
          products={products}
          onClose={() => setDeliveringOrder(null)}
          onDelivered={(deliveryStatus, extraAmount, total) => {
            setDeliveringOrder(null);
            fetchOrders();
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "success",
              title:
                total !== undefined
                  ? `Pedido entregue e finalizado: ${formatCurrency(total)}`
                  : extraAmount && extraAmount > 0
                    ? `Entregue com acréscimo de ${formatCurrency(extraAmount)}`
                    : deliveryStatus === "delivered"
                      ? "Pedido entregue ao cliente"
                      : "Entrega parcial registrada",
              showConfirmButton: false,
              timer: 2200,
              timerProgressBar: true,
            });
          }}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;
