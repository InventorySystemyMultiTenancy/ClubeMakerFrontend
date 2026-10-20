import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import type { AdminUser } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "../../services/adminUsersService";
import { ADMIN_TABS, MANAGE_ADMINS_PERMISSION } from "../../utils/adminPermissions";
import AdminUserFormModal, { AdminUserFormData } from "./AdminUserFormModal";

const formatCpf = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

const AdminUsersPanel: React.FC = () => {
  const { currentUser, refreshAdminAccess } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  // undefined = modal fechado, null = novo cadastro
  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setAdmins(await getAdminUsers());
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao carregar administradores", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const afterChange = async () => {
    await load();
    // Se o admin logado editou o próprio cadastro, atualiza as abas dele na hora
    await refreshAdminAccess();
  };

  const handleSave = async (data: AdminUserFormData) => {
    try {
      if (editing) {
        await updateAdminUser(editing.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          permissions: data.permissions,
          ...(data.password ? { password: data.password } : {}),
        });
      } else {
        await createAdminUser(data);
      }
      setEditing(undefined);
      await afterChange();
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: editing ? "Administrador atualizado" : "Administrador cadastrado",
        showConfirmButton: false,
        timer: 2200,
      });
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao salvar administrador", "error");
    }
  };

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      await updateAdminUser(admin.id, { active: !admin.active });
      await afterChange();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao atualizar administrador", "error");
    }
  };

  const handleDelete = async (admin: AdminUser) => {
    const result = await Swal.fire({
      title: "Remover administrador?",
      text: `${admin.name} perde o acesso ao painel imediatamente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteAdminUser(admin.id);
      await afterChange();
    } catch (error: any) {
      Swal.fire("Erro", error.message || "Erro ao remover administrador", "error");
    }
  };

  if (loading) {
    return <p className="p-6 text-center text-stone-500">Carregando administradores...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {admins.length} administrador(es) cadastrado(s) · entram pelo login do admin com CPF e senha
        </p>
        <button
          onClick={() => setEditing(null)}
          className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[var(--color-primary-active)]"
        >
          👑 Novo administrador
        </button>
      </div>

      {admins.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
          <div className="mb-4 text-6xl">👑</div>
          <h2 className="mb-2 text-2xl font-bold text-stone-800">Nenhum administrador cadastrado</h2>
          <p className="text-stone-600">
            Cadastre um administrador com login próprio e escolha quais abas ele pode acessar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {admins.map((admin) => {
            const isSelf = admin.id === currentUser?.id;
            const tabs = ADMIN_TABS.filter((tab) => admin.permissions.includes(tab.key));
            return (
              <div key={admin.id} className="rounded-xl bg-white p-4 shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-stone-800">
                      {admin.name}
                      {isSelf && <span className="ml-1 text-xs font-normal text-stone-400">(você)</span>}
                    </p>
                    <p className="font-mono text-xs text-stone-400">CPF {formatCpf(admin.cpf)}</p>
                    {admin.email && <p className="text-xs text-stone-400">{admin.email}</p>}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      admin.active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {admin.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {tabs.length === ADMIN_TABS.length ? (
                    <span className="rounded-full bg-[var(--color-primary-lighter)] px-2 py-0.5 text-xs font-semibold text-[var(--color-primary-active)]">
                      Todas as abas
                    </span>
                  ) : tabs.length === 0 ? (
                    <span className="text-xs text-red-600">Nenhuma aba liberada</span>
                  ) : (
                    tabs.map((tab) => (
                      <span key={tab.key} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                        {tab.label}
                      </span>
                    ))
                  )}
                  {admin.permissions.includes(MANAGE_ADMINS_PERMISSION) && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Gerencia admins
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditing(admin)}
                    className="flex-1 rounded-lg bg-[var(--color-primary)] py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)]"
                  >
                    ✏️ Editar acesso
                  </button>
                  {!isSelf && (
                    <>
                      <button
                        onClick={() => handleToggleActive(admin)}
                        className="flex-1 rounded-lg bg-stone-100 py-1.5 text-sm font-semibold text-stone-600 hover:bg-stone-200"
                      >
                        {admin.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        className="w-full rounded-lg bg-[var(--color-accent)] py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-secondary)]"
                      >
                        🗑️ Remover
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== undefined && (
        <AdminUserFormModal
          admin={editing}
          isSelf={Boolean(editing && editing.id === currentUser?.id)}
          onSave={handleSave}
          onCancel={() => setEditing(undefined)}
        />
      )}
    </div>
  );
};

export default AdminUsersPanel;
