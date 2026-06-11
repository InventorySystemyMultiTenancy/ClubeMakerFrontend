import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { ProjectQuote } from "../types";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const CONTACT_WHATSAPP = "5511947094271";

const openWhatsApp = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return;
  window.open(
    `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
    "_blank",
  );
};

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
    <div className="min-h-screen bg-[#050604] bg-[radial-gradient(circle_at_16%_8%,rgba(37,99,235,0.24),transparent_24rem),radial-gradient(circle_at_86%_78%,rgba(239,36,36,0.14),transparent_22rem)] p-4 text-white md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-white">
            Meus Orcamentos
          </h1>
          <button
            onClick={() => navigate("/criar-projeto")}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-[var(--color-red)]"
          >
            Criar projeto
          </button>
        </div>

        {loading ? (
          <p className="text-blue-100">Carregando...</p>
        ) : quotes.length === 0 ? (
          <div className="rounded-xl border border-blue-500/20 bg-[#071226] p-8 text-center shadow">
            <p className="font-semibold text-blue-100">
              Voce ainda nao tem orcamentos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="rounded-xl border border-blue-500/20 bg-[#071226] p-5 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {quote.fileName}
                    </h2>
                    <p className="text-sm text-blue-200">
                      {new Date(quote.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-blue-600 px-3 py-1 text-xs font-black uppercase text-white">
                    {statusLabel[quote.status]}
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-blue-100 md:grid-cols-2">
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
                  <div className="mt-4 rounded-lg border border-blue-500/20 bg-[#0b1f3a] p-4 text-blue-50">
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

                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      CONTACT_WHATSAPP,
                      [
                        `Ola! Quero falar sobre meu orcamento ${quote.id}.`,
                        `Projeto: ${quote.fileName}`,
                        quote.projectLink ? `Link: ${quote.projectLink}` : "",
                        quote.quotedTotal
                          ? `Valor: R$ ${Number(quote.quotedTotal).toFixed(2)}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join("\n"),
                    )
                  }
                  className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                >
                  Entrar em contato
                </button>

                {quote.status === "approved" && quote.orderId && (
                  <p className="mt-4 text-sm font-semibold text-green-300">
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
