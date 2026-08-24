import React, { useState } from "react";
import type { PrintOperator } from "../../../types";

interface OperatorFormModalProps {
  operator?: PrintOperator | null;
  onSave: (data: { name: string; cpf: string; password: string }) => Promise<void> | void;
  onCancel: () => void;
}

const OperatorFormModal: React.FC<OperatorFormModalProps> = ({ operator, onSave, onCancel }) => {
  const [name, setName] = useState(operator?.name || "");
  const [cpf, setCpf] = useState(operator?.cpf || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const cpfValid = cpf.replace(/\D/g, "").length === 11;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cpfValid) return;
    if (!operator && !password) return;
    setSaving(true);
    try {
      await onSave({ name, cpf, password });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-stone-800">
          👷 {operator ? "Editar operador" : "Novo operador"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">Nome *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João da Silva"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">CPF (login) *</label>
            <input
              type="text"
              required
              disabled={!!operator}
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
            />
            {!operator && cpf && !cpfValid && (
              <p className="mt-1 text-xs text-red-600">CPF inválido, digite os 11 dígitos.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-stone-600">
              {operator ? "Nova senha (deixe em branco para manter)" : "Senha *"}
            </label>
            <input
              type="password"
              required={!operator}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 4 caracteres"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <p className="text-xs text-stone-400">
            O operador usa esse CPF e senha para entrar em uma tela própria, separada do painel admin, onde só consegue iniciar e finalizar impressões.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-stone-300 py-2 font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 font-semibold text-white hover:bg-[var(--color-primary-active)] disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OperatorFormModal;
