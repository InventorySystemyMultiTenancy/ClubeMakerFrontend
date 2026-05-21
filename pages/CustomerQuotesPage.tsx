import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { ProjectQuote } from "../types";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const statusLabel: Record<ProjectQuote["status"], string> = {
  pending: "Aguardando analise",
  sent: "Aguardando sua aprovacao",
  approved: "Aprovado",
  rejected: "Recusado",
};

const CustomerQuotesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<ProjectQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchQuotes = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/users/${currentUser.id}/project-quotes`,
      );
      const data = await response.json();
      setQuotes(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate]);

  const respondQuote = async (quote: ProjectQuote, approved: boolean) => {
    if (!currentUser || actionId) return;
    setActionId(quote.id);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/project-quotes/${quote.id}/respond`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved, userId: currentUser.id }),
        },
      );
      if (!response.ok) throw new Error("Erro ao responder orcamento");
      await fetchQuotes();
      if (approved) navigate("/meus-pedidos");
    } catch {
      alert("Nao foi possivel responder esse orcamento.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-[var(--color-primary-active)]">
            Meus Orcamentos
          </h1>
          <button
            onClick={() => navigate("/criar-projeto")}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-[var(--color-primary-active)]"
          >
            Criar projeto
          </button>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : quotes.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="font-semibold text-stone-700">
              Voce ainda nao tem orcamentos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black text-stone-900">
                      {quote.fileName}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {new Date(quote.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase text-cyan-800">
                    {statusLabel[quote.status]}
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-stone-700 md:grid-cols-2">
                  <p>Tamanho: {quote.size}</p>
                  <p>Pecas: {quote.pieceQuantity}</p>
                  <p>
                    Medidas: {quote.height} x {quote.width} x {quote.depth}
                  </p>
                  <p>
                    Cores: {quote.colorQuantity} - {quote.colors}
                  </p>
                </div>

                {quote.status === "sent" && (
                  <div className="mt-4 rounded-lg bg-lime-50 p-4 text-stone-800">
                    <p className="text-2xl font-black">
                      R$ {Number(quote.quotedTotal || 0).toFixed(2)}
                    </p>
                    <p className="mt-1 text-sm">
                      Prazo: {quote.deliveryDeadline || "-"}
                    </p>
                    {quote.adminObservation && (
                      <p className="mt-1 text-sm">
                        Obs.: {quote.adminObservation}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        disabled={actionId === quote.id}
                        onClick={() => respondQuote(quote, true)}
                        className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-black text-[#06110a] transition hover:bg-lime-400 disabled:opacity-60"
                      >
                        Aprovar e virar pedido
                      </button>
                      <button
                        disabled={actionId === quote.id}
                        onClick={() => respondQuote(quote, false)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                )}

                {quote.status === "approved" && quote.orderId && (
                  <p className="mt-4 text-sm font-semibold text-green-700">
                    Orcamento aprovado. Pedido criado: #{quote.orderId}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerQuotesPage;
