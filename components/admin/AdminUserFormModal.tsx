import React, { useState } from "react";
import type { AdminPermission, AdminUser } from "../../types";
import { ADMIN_TABS, MANAGE_ADMINS_PERMISSION } from "../../utils/adminPermissions";

export interface AdminUserFormData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
  permissions: AdminPermission[];
}

interface AdminUserFormModalProps {
  admin: AdminUser | null; // null = novo cadastro
  isSelf: boolean;
  onSave: (data: AdminUserFormData) => Promise<void> | void;
  onCancel: () => void;
}

const formatCpf = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none disabled:bg-stone-100";

const AdminUserFormModal: React.FC<AdminUserFormModalProps> = ({ admin, isSelf, onSave, onCancel }) => {
  const [name, setName] = useState(admin?.name || "");
  const [cpf, setCpf] = useState(admin ? formatCpf(admin.cpf || "") : "");
  const [email, setEmail] = useState(admin?.email || "");
  const [phone, setPhone] = useState(admin?.phone || "");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<AdminPermission[]>(admin?.permissions || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const togglePermission = (permission: AdminPermission) =>
    setPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission],
    );

  const allTabsSelected = ADMIN_TABS.every((tab) => permissions.includes(tab.key));
  const toggleAllTabs = () =>
    setPermissions((prev) => {
      const withoutTabs = prev.filter((p) => !ADMIN_TABS.some((tab) => tab.key === p));
      return allTabsSelected ? withoutTabs : [...withoutTabs, ...ADMIN_TABS.map((tab) => tab.key)];
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || (!admin && cpf.replace(/\D/g, "").length !== 11)) {
      setError("Preencha nome, CPF (11 dígitos) e e-mail.");
      return;
    }
    if (!admin && password.length < 4) {
      setError("Crie uma senha com pelo menos 4 caracteres.");
      return;
    }
    if (admin && password && password.length < 4) {
      setError("A nova senha deve ter pelo menos 4 caracteres.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({ name: name.trim(), cpf, email: email.trim(), phone: phone.trim(), password, permissions });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-stone-800">
          {admin ? "✏️ Editar administrador" : "👑 Novo administrador"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo *" className={inputClass} />
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="CPF * (usado no login)"
            className={inputClass}
            disabled={Boolean(admin)}
            inputMode="numeric"
          />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail *" className={inputClass} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className={inputClass} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={admin ? "Nova senha (deixe em branco para manter)" : "Senha *"}
            className={inputClass}
            autoComplete="new-password"
          />

          <fieldset className="rounded-lg border border-stone-200 p-3">
            <legend className="px-1 text-sm font-semibold text-stone-700">Abas que pode acessar</legend>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
              <input type="checkbox" checked={allTabsSelected} onChange={toggleAllTabs} />
              Todas as abas
            </label>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {ADMIN_TABS.map((tab) => (
                <label key={tab.key} className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={permissions.includes(tab.key)}
                    onChange={() => togglePermission(tab.key)}
                  />
                  {tab.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={permissions.includes(MANAGE_ADMINS_PERMISSION)}
              onChange={() => togglePermission(MANAGE_ADMINS_PERMISSION)}
              disabled={isSelf}
              className="mt-0.5"
            />
            <span>
              <strong>Pode gerenciar administradores</strong>
              <span className="block text-xs">
                Criar, editar e remover outros administradores e mudar o acesso deles.
                {isSelf && " Você não pode remover essa permissão de si mesmo."}
              </span>
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

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

export default AdminUserFormModal;
