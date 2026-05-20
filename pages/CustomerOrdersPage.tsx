import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Order } from "../types";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const CONTACT_WHATSAPP = "5511947094271";

const CustomerOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);

  const handleContactOrder = (orderId: string) => {
    const message = encodeURIComponent(
      `Olá, gostaria de falar sobre o pedido #${orderId}.`,
    );
    const appUrl = `whatsapp://send?phone=${CONTACT_WHATSAPP}&text=${message}`;
    const webUrl = `https://wa.me/${CONTACT_WHATSAPP}?text=${message}`;
    const isMobile =
      /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
      window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      window.location.href = appUrl;
      return;
    }

    window.open(webUrl, "_blank", "noopener,noreferrer");
  };

  const deletePendingOrder = async (orderId: string) => {
    if (!currentUser || actionOrderId) return;
    if (!window.confirm("Deseja excluir este pedido?")) return;

    setActionOrderId(orderId);
    try {
      const resp = await fetch(
        `${BACKEND_URL}/api/users/${currentUser.id}/orders/${orderId}`,
        { method: "DELETE" },
      );

      if (!resp.ok) {
        throw new Error("Erro ao excluir pedido");
      }

      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (err) {
      alert("Nao foi possivel excluir o pedido. Tente novamente.");
    } finally {
      setActionOrderId(null);
    }
  };

  const confirmPresencialPayment = async (orderId: string) => {
    if (!currentUser || actionOrderId) return;

    setActionOrderId(orderId);
    try {
      const resp = await fetch(
        `${BACKEND_URL}/api/users/${currentUser.id}/orders/${orderId}/confirm-presencial`,
        { method: "PUT" },
      );

      if (!resp.ok) {
        throw new Error("Erro ao confirmar pagamento presencial");
      }

      const updatedOrder = await resp.json();
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? updatedOrder : order)),
      );
    } catch (err) {
      alert("Nao foi possivel confirmar o pagamento presencial. Tente novamente.");
    } finally {
      setActionOrderId(null);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const resp = await fetch(
          `${BACKEND_URL}/api/users/${currentUser.id}/orders`,
        );
        if (!resp.ok) throw new Error("Erro ao buscar pedidos");
        const data = await resp.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Erro ao buscar pedidos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser, navigate]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Meus Pedidos</h1>
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <p>Você ainda não fez nenhum pedido.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const isPending = order.paymentStatus === "pending";
            const isPresencial = order.paymentType === "presencial";
            const canCustomerDelete =
              isPending && order.status !== "active" && !isPresencial;
            const isProcessing = actionOrderId === order.id;

            return (
            <li
              key={order.id}
              className="bg-white rounded-xl shadow p-4 border border-stone-200"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                <span className="font-bold text-lg">Pedido #{order.id}</span>
                <span className="text-sm text-stone-500">
                  {new Date(order.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="mb-2">
                <span className="font-semibold">Total:</span> R${" "}
                {order.total.toFixed(2)}
                {order.paymentStatus === "pending" && (
                  <span className="ml-2 text-red-600 font-bold">A pagar</span>
                )}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Status:</span> {order.status}
              </div>
              <ul className="text-sm text-stone-700">
                {order.items.map((item, idx) => (
                  <li key={item.productId || idx}>
                    {item.name} x {item.quantity} - R$ {item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
              {(canCustomerDelete || (isPending && !isPresencial)) && (
                <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                  {!isPresencial && (
                    <button
                      type="button"
                      onClick={() => confirmPresencialPayment(order.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-active)] disabled:opacity-60"
                    >
                      {isProcessing ? "Confirmando..." : "Pagar presencialmente"}
                    </button>
                  )}
                  {canCustomerDelete && (
                    <button
                      type="button"
                      onClick={() => deletePendingOrder(order.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                      {isProcessing ? "Processando..." : "Excluir pedido"}
                    </button>
                  )}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleContactOrder(order.id)}
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
                >
                  Entrar em contato
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CustomerOrdersPage;

