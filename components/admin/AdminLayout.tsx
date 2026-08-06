import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";

type IconProps = { className?: string };

const HomeIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
);

const CartIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="9" cy="21" r="1.4" />
    <circle cx="18" cy="21" r="1.4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 3h2l2.6 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6" />
  </svg>
);

const TagIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L3 13V4a1 1 0 0 1 1-1h9l7.59 7.59a2 2 0 0 1 0 2.82Z" />
    <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const UserPlusIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />
  </svg>
);

const ClockIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 2" />
  </svg>
);

const DocumentIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM14 3v5h5M9 13h6M9 17h6" />
  </svg>
);

const BriefcaseIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="7.5" width="18" height="12" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5M3 12.5h18" />
  </svg>
);

const SparklesIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

const LogoutIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
  </svg>
);

interface AdminNavItem {
  to: string;
  label: string;
  icon: React.FC<IconProps>;
  onClick?: () => void;
}

const useNavItems = (): AdminNavItem[] => {
  const { clearCart } = useCart();

  return [
    { to: "/admin", label: "Painel", icon: HomeIcon },
    {
      to: "/admin/nova-venda",
      label: "Nova Venda",
      icon: CartIcon,
      onClick: () => clearCart(),
    },
    { to: "/admin/categories", label: "Categorias", icon: TagIcon },
    {
      to: "/admin/criar-cadastro-cliente",
      label: "Criar Cadastro Cliente",
      icon: UserPlusIcon,
    },
    { to: "/historico", label: "Histórico de Pedidos", icon: ClockIcon },
    { to: "/admin/orcamentos", label: "Orçamentos", icon: DocumentIcon },
    {
      to: "/admin/management-report",
      label: "Relatório Gestão",
      icon: BriefcaseIcon,
    },
    { to: "/admin/reports", label: "Relatórios IA", icon: SparklesIcon },
  ];
};

const navLinkClasses = (isActive: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors whitespace-nowrap ${
    isActive
      ? "bg-[var(--color-primary)] text-white shadow"
      : "text-stone-600 hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-active)]"
  }`;

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const navItems = useNavItems();

  const handleLogout = async () => {
    if (!window.confirm("Deseja realmente sair?")) return;
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      <nav className="lg:sticky lg:top-4 lg:w-56 lg:shrink-0">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-2 shadow lg:flex-col lg:gap-1 lg:overflow-visible">
          {navItems.map(({ to, label, icon: Icon, onClick }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              onClick={onClick}
              className={({ isActive }) => navLinkClasses(isActive)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
          <div className="my-1 hidden border-t border-stone-200 lg:block" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogoutIcon className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </div>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export default AdminLayout;
