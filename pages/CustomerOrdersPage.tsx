import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Order } from "../types";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const CONTACT_WHATSAPP = "5511942058445";

const CustomerOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          {orders.map((order) => (
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
              <div className="mt-4 flex justify-end">
                <a
                  href={`https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(
                    `Olá, gostaria de falar sobre o pedido #${order.id}.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
                >
                  Entrar em contato
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
