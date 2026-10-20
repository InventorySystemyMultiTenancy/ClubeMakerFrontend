import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import type { Customer } from "../types";
import {
  createCustomer,
  CustomerFormPayload,
  getCustomers,
  updateCustomer,
} from "../services/customerService";
import { CUSTOMER_FEATURES } from "../utils/customerPermissions";
import CustomerFormModal from "../components/admin/CustomerFormModal";

const formatDocument = (doc: string) =>
  doc.length === 14
    ? doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    : doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // undefined = modal fechado, null = novo cadastro
  const [editing, setEditing] = useState<Customer | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setCustomers(await getCustomers());
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao carregar clientes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: CustomerFormPayload) => {
    try {
      if (editing) {
        await updateCustomer(editing.id, data);
      } else {
        await createCustomer(data);
      }
      setEditing(undefined);
      await load();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: editing ? "Cliente atualizado" : "Cliente cadastrado",
        showConfirmButton: false,
        timer: 2200,
      });
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao salvar cliente", "error");
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const searchDigits = search.replace(/\D/g, "");
  const filtered = customers.filter(
    (c) =>
      !normalizedSearch ||
      c.name.toLowerCase().includes(normalizedSearch) ||
      (c.email || "").toLowerCase().includes(normalizedSearch) ||
      (searchDigits && (c.cpf || "").includes(searchDigits)),
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="mb-1 text-3xl font-bold text-[var(--color-primary-active)]">Clientes</h1>
      <p className="mb-6 text-sm text-stone-500">
        Veja e edite os cadastros, crie o login de novos clientes e escolha as funcionalidades
        liberadas para cada um.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail"
          className="w-full max-w-sm rounded-lg border border-stone-300 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
        />
        <button
          onClick={() => setEditing(null)}
          className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[var(--color-primary-active)]"
        >
          👤 Novo cliente
        </button>
      </div>

      {loading ? (
        <p className="p-6 text-center text-stone-500">Carregando clientes...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
          <div className="mb-4 text-6xl">👤</div>
          <h2 className="mb-2 text-2xl font-bold text-stone-800">
            {customers.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
          </h2>
          <p className="text-stone-600">
            {customers.length === 0
              ? "Cadastre um cliente com login próprio (CPF/CNPJ e senha)."
              : "Tente outro termo de busca."}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-stone-500">{filtered.length} cliente(s)</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((customer) => {
              const features = CUSTOMER_FEATURES.filter((f) =>
                customer.permissions.includes(f.key),
              );
              return (
                <div key={customer.id} className="flex flex-col rounded-xl bg-white p-4 shadow-lg">
                  <p className="font-bold text-stone-800">{customer.name}</p>
                  <p className="font-mono text-xs text-stone-400">
                    {customer.cpf?.length === 14 ? "CNPJ" : "CPF"} {formatDocument(customer.cpf || "")}
                  </p>
                  {customer.email && <p className="text-xs text-stone-400">{customer.email}</p>}
                  {customer.phone && <p className="text-xs text-stone-400">📞 {customer.phone}</p>}
                  {customer.address && (
                    <p className="text-xs text-stone-400">
                      📍 {customer.address}
                      {customer.cep ? ` — ${customer.cep}` : ""}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1">
                    {features.length === 0 ? (
                      <span className="text-xs text-stone-400">Nenhuma funcionalidade extra</span>
                    ) : (
                      features.map((f) => (
                        <span
                          key={f.key}
                          className="rounded-full bg-[var(--color-primary-lighter)] px-2 py-0.5 text-xs font-semibold text-[var(--color-primary-active)]"
                        >
                          {f.label}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="mt-auto flex pt-4">
                    <button
                      onClick={() => setEditing(customer)}
                      className="flex-1 rounded-lg border border-stone-300 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {editing !== undefined && (
        <CustomerFormModal
          customer={editing}
          onSave={handleSave}
          onCancel={() => setEditing(undefined)}
        />
      )}
    </div>
  );
};

export default AdminCustomersPage;
