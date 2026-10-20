import type { AdminPermission, User } from "../types";

// Abas do painel admin que podem ser liberadas/bloqueadas por administrador.
// Manter em sincronia com ADMIN_PERMISSIONS em routes/adminUsers.js no backend.
export const ADMIN_TABS: { key: AdminPermission; label: string; paths: string[] }[] = [
  { key: "painel", label: "Painel", paths: ["/admin"] },
  { key: "nova_venda", label: "Nova Venda", paths: ["/admin/nova-venda", "/admin/payment"] },
  { key: "categorias", label: "Categorias", paths: ["/admin/categories"] },
  { key: "cadastro_cliente", label: "Criar Cadastro Cliente", paths: ["/admin/criar-cadastro-cliente"] },
  { key: "clientes", label: "Clientes", paths: ["/admin/clientes"] },
  { key: "historico", label: "Histórico de Pedidos", paths: ["/historico", "/historico/detalhes"] },
  { key: "orcamentos", label: "Orçamentos", paths: ["/admin/orcamentos"] },
  { key: "impressoras", label: "Impressoras 3D", paths: ["/admin/impressoras"] },
  { key: "relatorio_gestao", label: "Relatório Gestão", paths: ["/admin/management-report"] },
  { key: "relatorios_ia", label: "Relatórios IA", paths: ["/admin/reports"] },
];

// Não é uma aba: permite criar/editar outros administradores (dentro de "Criar Cadastro Cliente")
export const MANAGE_ADMINS_PERMISSION: AdminPermission = "admins";

// Admin principal (senha compartilhada) não tem lista de permissões = acesso total
export function isRestrictedAdmin(user: User | null): boolean {
  return user?.role === "admin" && Array.isArray(user.permissions);
}

export function hasAdminPermission(user: User | null, permission: AdminPermission): boolean {
  if (!user || user.role !== "admin") return false;
  if (!Array.isArray(user.permissions)) return true;
  return user.permissions.includes(permission);
}

export function canManageAdmins(user: User | null): boolean {
  return hasAdminPermission(user, MANAGE_ADMINS_PERMISSION);
}

export function canAccessAdminPath(user: User | null, path: string): boolean {
  if (path === "/admin/criar-cadastro-cliente" && canManageAdmins(user)) return true;
  const tab = ADMIN_TABS.find((t) => t.paths.includes(path));
  return tab ? hasAdminPermission(user, tab.key) : true;
}

// Primeira aba liberada — para onde o admin vai após o login. null = nenhuma aba liberada.
export function getAdminHomePath(user: User | null): string | null {
  for (const tab of ADMIN_TABS) {
    if (canAccessAdminPath(user, tab.paths[0])) return tab.paths[0];
  }
  return null;
}
