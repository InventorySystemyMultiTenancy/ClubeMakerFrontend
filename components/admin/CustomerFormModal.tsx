import React, { useState } from "react";
import type { Customer, CustomerPermission } from "../../types";
import type { CustomerFormPayload } from "../../services/customerService";
import { CUSTOMER_FEATURES } from "../../utils/customerPermissions";

interface CustomerFormModalProps {
  customer: Customer | null; // null = novo cadastro
  onSave: (data: CustomerFormPayload) => Promise<void> | void;
  onCancel: () => void;
}

// CPF (11 dígitos) ou CNPJ (14 dígitos), igual ao login do cliente
const formatDocument = (value: string) => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 11) {
    return cleaned
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return cleaned
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none disabled:bg-stone-100";

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customer, onSave, onCancel }) => {
  const [name, setName] = useState(customer?.name || "");
  const [cpf, setCpf] = useState(customer ? formatDocument(customer.cpf || "") : "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [cep, setCep] = useState(customer?.cep || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<CustomerPermission[]>(
    customer?.permissions || [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const togglePermission = (permission: CustomerPermission) =>
    setPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const docLength = cpf.replace(/\D/g, "").length;
    if (!name.trim() || !email.trim() || (docLength !== 11 && docLength !== 14)) {
      setError("Preencha nome, CPF/CNPJ (11 ou 14 dígitos) e e-mail.");
      return;
    }
    if (!customer && password.length < 4) {
      setError("Crie uma senha com pelo menos 4 caracteres.");
      return;
    }
    if (customer && password && password.length < 4) {
      setError("A nova senha deve ter pelo menos 4 caracteres.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        cpf,
        email: email.trim(),
        phone: phone.trim(),
        cep: cep.trim(),
        address: address.trim(),
        ...(password ? { password } : {}),
        permissions,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-stone-800">
          {customer ? "✏️ Editar cliente" : "👤 Novo cliente"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo *" className={inputClass} />
          <input
            value={cpf}
            onChange={(e) => setCpf(formatDocument(e.target.value))}
            placeholder="CPF ou CNPJ * (usado no login)"
            className={inputClass}
            inputMode="numeric"
          />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail *" className={inputClass} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className={inputClass} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" className={inputClass} />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Endereço"
              className={`${inputClass} sm:col-span-2`}
            />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={customer ? "Nova senha (deixe em branco para manter)" : "Senha de login *"}
            className={inputClass}
            autoComplete="new-password"
          />

          <fieldset className="rounded-lg border border-stone-200 p-3">
            <legend className="px-1 text-sm font-semibold text-stone-700">
              Funcionalidades liberadas
            </legend>
            <div className="space-y-2">
              {CUSTOMER_FEATURES.map((feature) => (
                <label key={feature.key} className="flex items-start gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={permissions.includes(feature.key)}
                    onChange={() => togglePermission(feature.key)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>{feature.label}</strong>
                    <span className="block text-xs text-stone-500">{feature.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

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

export default CustomerFormModal;
