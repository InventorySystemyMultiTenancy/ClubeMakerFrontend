import React, { useEffect, useState } from "react";
import type { ProjectQuote } from "../types";
import { authenticatedFetch } from "../services/apiService";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

type QuoteDraft = {
  quotedTotal: string;
  adminObservation: string;
  deliveryDeadline: string;
};

const AdminProjectQuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<ProjectQuote[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QuoteDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/admin/project-quotes`,
      );
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setQuotes(list);
      setDrafts((prev) => {
        const next = { ...prev };
        list.forEach((quote: ProjectQuote) => {
          if (!next[quote.id]) {
            next[quote.id] = {
              quotedTotal: quote.quotedTotal ? String(quote.quotedTotal) : "",
              adminObservation: quote.adminObservation || "",
              deliveryDeadline: quote.deliveryDeadline || "",
            };
          }
        });
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const updateDraft = (
    quoteId: string,
    field: keyof QuoteDraft,
    value: string,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [quoteId]: {
        ...(prev[quoteId] || {
          quotedTotal: "",
          adminObservation: "",
          deliveryDeadline: "",
        }),
        [field]: value,
      },
    }));
  };

  const sendQuote = async (quoteId: string) => {
    const draft = drafts[quoteId];
    if (!draft?.quotedTotal || !draft.deliveryDeadline) {
      alert("Informe valor e prazo de entrega.");
      return;
    }

    setSavingId(quoteId);
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URL}/api/admin/project-quotes/${quoteId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            quotedTotal: Number(draft.quotedTotal),
            adminObservation: draft.adminObservation,
            deliveryDeadline: draft.deliveryDeadline,
          }),
        },
      );
      if (!response.ok) throw new Error("Erro ao enviar orcamento");
      await fetchQuotes();
    } catch {
      alert("Nao foi possivel enviar o orcamento.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container mx-auto min-h-screen bg-stone-100 px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-[var(--color-primary-active)]">
          Orcamentos de Projetos
        </h1>
        <button
          onClick={fetchQuotes}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-[var(--color-primary-active)]"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : quotes.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          Nenhum orcamento recebido.
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const draft = drafts[quote.id] || {
              quotedTotal: "",
              adminObservation: "",
              deliveryDeadline: "",
            };
            const canEdit = quote.status === "pending" || quote.status === "sent";

            return (
              <div
                key={quote.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-stone-900">
                      {quote.fileName}
                    </h2>
                    <p className="text-sm text-stone-500">
                      Cliente: {quote.userName || quote.userId}
                    </p>
                    <p className="text-sm text-stone-500">
                      Criado em {new Date(quote.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
                    {quote.status}
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
                  <p className="md:col-span-2">
                    Dados de envio: {quote.shippingData}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-sm font-bold text-stone-700">
                      Valor
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={!canEdit}
                      value={draft.quotedTotal}
                      onChange={(event) =>
                        updateDraft(quote.id, "quotedTotal", event.target.value)
                      }
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 disabled:bg-stone-100"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-sm font-bold text-stone-700">
                      Prazo de entrega
                    </span>
                    <input
                      disabled={!canEdit}
                      value={draft.deliveryDeadline}
                      onChange={(event) =>
                        updateDraft(
                          quote.id,
                          "deliveryDeadline",
                          event.target.value,
                        )
                      }
                      placeholder="Ex: 7 dias uteis"
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 disabled:bg-stone-100"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-sm font-bold text-stone-700">
                      Observacao
                    </span>
                    <input
                      disabled={!canEdit}
                      value={draft.adminObservation}
                      onChange={(event) =>
                        updateDraft(
                          quote.id,
                          "adminObservation",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 disabled:bg-stone-100"
                    />
                  </label>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    disabled={!canEdit || savingId === quote.id}
                    onClick={() => sendQuote(quote.id)}
                    className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-black text-[#06110a] transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === quote.id
                      ? "Enviando..."
                      : "Enviar orcamento ao cliente"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminProjectQuotesPage;
