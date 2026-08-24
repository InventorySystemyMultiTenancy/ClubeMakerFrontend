import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import type { PrintOperator } from "../../../types";
import {
  createPrintOperator,
  deletePrintOperator,
  getPrintOperators,
  updatePrintOperator,
} from "../../../services/printFarmService";
import OperatorFormModal from "./OperatorFormModal";

const OperatorsPanel: React.FC = () => {
  const [operators, setOperators] = useState<PrintOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PrintOperator | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setOperators(await getPrintOperators());
    } catch (error) {
      console.error("Erro ao carregar operadores:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: { name: string; username: string; password: string }) => {
    try {
      if (editing) {
        const payload: { name: string; password?: string } = { name: data.name };
        if (data.password) payload.password = data.password;
        await updatePrintOperator(editing.id, payload);
      } else {
        await createPrintOperator(data);
      }
      setEditing(undefined);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao salvar operador", "error");
    }
  };

  const handleToggleActive = async (operator: PrintOperator) => {
    try {
      await updatePrintOperator(operator.id, { active: !operator.active });
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao atualizar operador", "error");
    }
  };

  const handleDelete = async (operator: PrintOperator) => {
    const result = await Swal.fire({
      title: "Remover operador?",
      html: `Deseja realmente remover <strong>${operator.name}</strong>? O histórico de produções já feitas por ele continua registrado nos relatórios.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await deletePrintOperator(operator.id);
      await load();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao remover operador", "error");
    }
  };

  if (loading) {
    return <p className="p-6 text-center text-stone-500">Carregando operadores...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {operators.length} operador(es) cadastrado(s) · acessam em uma tela própria, separada do admin
        </p>
        <button
          onClick={() => setEditing(null)}
          className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[var(--color-primary-active)]"
        >
          👷 Novo operador
        </button>
      </div>

      {operators.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
          <div className="mb-4 text-6xl">👷</div>
          <h2 className="mb-2 text-2xl font-bold text-stone-800">Nenhum operador cadastrado</h2>
          <p className="text-stone-600">
            Cadastre um funcionário para ele conseguir iniciar e finalizar impressões sem precisar da senha do admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {operators.map((op) => (
            <div key={op.id} className="rounded-xl bg-white p-4 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-stone-800">{op.name}</p>
                  <p className="font-mono text-xs text-stone-400">@{op.username}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    op.active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {op.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setEditing(op)}
                  className="flex-1 rounded-lg bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)]"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleToggleActive(op)}
                  className="flex-1 rounded-lg bg-stone-100 py-1.5 text-sm font-semibold text-stone-600 hover:bg-stone-200"
                >
                  {op.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => handleDelete(op)}
                  className="w-full rounded-lg bg-[var(--color-accent)] py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-secondary)]"
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <OperatorFormModal operator={editing} onSave={handleSave} onCancel={() => setEditing(undefined)} />
      )}
    </div>
  );
};

export default OperatorsPanel;
