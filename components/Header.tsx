import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext"; // 🏪 MULTI-TENANT
import logo from "../assets/clubemaker-logo.png";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { store } = useStore(); // 🏪 Obtém configurações da loja
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUndeliveredOrder, setHasUndeliveredOrder] = useState(false);
  // Rotas onde o admin está "comprando" (catálogo/checkout), não no painel administrativo
  const isAdminPurchaseFlow =
    location.pathname === "/admin/nova-venda" ||
    location.pathname === "/admin/payment";
  const isAdminArea =
    (location.pathname.startsWith("/admin") && !isAdminPurchaseFlow) ||
    location.pathname.startsWith("/historico");

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!currentUser || currentUser.role === "admin" || currentUser.role === "kitchen") {
      setHasUndeliveredOrder(false);
      return;
    }

    let isMounted = true;

    const fetchCustomerOrders = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/users/${currentUser.id}/orders`);
        if (!response.ok) {
          throw new Error("Erro ao buscar pedidos");
        }

        const data = await response.json();
        const hasPendingDelivery =
          Array.isArray(data) &&
          data.some((order) => !order.entregueCliente);

        if (isMounted) {
          setHasUndeliveredOrder(hasPendingDelivery);
        }
      } catch (error) {
        if (isMounted) {
          setHasUndeliveredOrder(false);
        }
      }
    };

    fetchCustomerOrders();

    return () => {
      isMounted = false;
    };
  }, [currentUser, location.pathname]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate("/");
  };

  const activeLinkStyle = {
    color: "#2563eb",
    fontWeight: 600,
  };

  return (
    <>
      <header className="monster-header border-b border-stone-200 sticky top-0 z-50 h-16">
        <div className="container mx-auto px-3 sm:px-4 h-full flex items-center justify-between gap-3 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-2 relative min-w-0">
            <NavLink
              to={currentUser ? "/menu" : "/"}
              className="flex items-center gap-2 group min-w-0"
            >
              <img
                src={logo}
                alt="ClubeMaker logo"
                className="monster-header-logo w-10 h-10 sm:w-12 sm:h-12 rounded-lg group-hover:scale-105 transition-transform object-cover shrink-0"
              />
              <span className="monster-header-brand text-base sm:text-xl font-bold text-stone-800 tracking-tight truncate">
                ClubeMaker
              </span>
            </NavLink>
          </div>

          {/* Navegação Central (Desktop) */}
          <nav className="flex items-center gap-4 md:gap-8 max-[1100px]:hidden">
            {currentUser &&
              (!currentUser.role || currentUser.role === "customer") && (
                <NavLink
                  to="/menu"
                  className="monster-header-link transition-colors"
                >
                  Catálogo
                </NavLink>
              )}

            {currentUser &&
              (!currentUser.role ||
                currentUser.role === "customer" ||
                currentUser.role === "admincustomer") && (
                <NavLink
                  to="/meus-orcamentos"
                  className="monster-header-link transition-colors"
                >
                  Orçamentos
                </NavLink>
              )}

            {currentUser?.role === "kitchen" && (
              <NavLink
                to="/cozinha"
                style={({ isActive }) =>
                  isActive ? activeLinkStyle : undefined
                }
                className="monster-header-link transition-colors"
              >
                Pedidos Cozinha
              </NavLink>
            )}

            {currentUser?.role === "admincustomer" && (
              <NavLink
                to="/admin/login"
                className="monster-header-link transition-colors"
              >
                Ir para Admin
              </NavLink>
            )}

            {currentUser?.role === "admin" &&
              (isAdminArea ? (
                <button
                  onClick={() => navigate("/admin/nova-venda")}
                  className="monster-header-action bg-blue-100 text-blue-700 font-bold py-1 px-4 rounded-lg hover:bg-blue-200 transition-colors shadow-md text-sm"
                >
                  ← Voltar ao site
                </button>
              ) : (
                <NavLink
                  to="/admin"
                  className="monster-header-action bg-blue-600 text-white font-bold py-1 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm"
                >
                  Aba administrativa
                </NavLink>
              ))}
          </nav>

          {/* Área do Usuário (Desktop) + Menu Hambúrguer (<1100px) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="monster-header-action hidden max-[1100px]:inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors shrink-0 disabled:hidden"
              aria-label="Abrir menu"
              title="Menu"
              disabled={!currentUser}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {!currentUser && (
              <button
                onClick={() => navigate("/login")}
                className="login-shortcut monster-header-action inline-flex min-[1101px]:hidden items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700"
                aria-label="Fazer login"
                title="Fazer login"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="login-shortcut-icon h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
                  />
                </svg>
                <span className="login-shortcut-label">Fazer login</span>
              </button>
            )}

            {/* Área do Usuário (Direita) */}
            <div className="flex items-center gap-4 max-[1100px]:hidden">
              {currentUser ? (
                <>
                  <div className="h-6 w-px bg-stone-200 mx-1"></div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right leading-tight">
                      <p className="text-xs text-stone-500 font-medium">Olá,</p>
                      <p
                        className="text-sm font-bold max-w-[100px] truncate"
                        style={{ color: "#1d4ed8" }}
                      >
                        {currentUser.name}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/register?edit=1")}
                      className="monster-header-action edit-btn bg-blue-600 text-white font-bold py-1 px-3 rounded-lg ml-2 hover:bg-blue-700 transition-colors shadow-md text-xs"
                      title="Editar meus dados"
                    >
                      <span className="edit-btn-label">Editar meus dados</span>
                      <span
                        className="edit-btn-icon"
                        style={{ display: "none" }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z"
                          />
                        </svg>
                      </span>
                    </button>
                    <NavLink
                      to="/meus-pedidos"
                      className={`monster-header-action bg-blue-100 text-blue-700 font-bold py-1 px-3 rounded-lg ml-2 hover:bg-blue-200 transition-colors shadow-md text-xs flex items-center gap-2 ${
                        hasUndeliveredOrder
                          ? "animate-pulse ring-2 ring-white ring-offset-2 ring-offset-blue-700"
                          : ""
                      }`}
                      title="Meus Pedidos"
                    >
                      <span>📦</span>
                      <span>Meus Pedidos</span>
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="text-stone-500 hover:text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                      title="Sair"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <span className="text-sm text-stone-600">Bem-vindo!</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="min-[1101px]:hidden bg-white border-b border-stone-200 shadow-md">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {currentUser &&
              (!currentUser.role || currentUser.role === "customer") && (
                <NavLink
                  to="/menu"
                  className="text-stone-700 hover:text-blue-600 font-medium"
                >
                  Catálogo
                </NavLink>
              )}

            {currentUser &&
              (!currentUser.role ||
                currentUser.role === "customer" ||
                currentUser.role === "admincustomer") && (
                <NavLink
                  to="/meus-orcamentos"
                  className="text-stone-700 hover:text-blue-600 font-medium"
                >
                  Orçamentos
                </NavLink>
              )}

            {currentUser?.role === "kitchen" && (
              <NavLink
                to="/cozinha"
                className="text-stone-700 hover:text-blue-600 font-medium"
              >
                Pedidos Cozinha
              </NavLink>
            )}

            {currentUser?.role === "admincustomer" && (
              <NavLink
                to="/admin/login"
                className="text-stone-700 hover:text-blue-600 font-medium"
              >
                Ir para Admin
              </NavLink>
            )}

            {currentUser?.role === "admin" &&
              (isAdminArea ? (
                <button
                  onClick={() => navigate("/admin/nova-venda")}
                  className="text-left text-stone-700 hover:text-blue-600 font-medium"
                >
                  ← Voltar ao site
                </button>
              ) : (
                <NavLink
                  to="/admin"
                  className="text-stone-700 hover:text-blue-600 font-medium"
                >
                  Aba administrativa
                </NavLink>
              ))}

            {currentUser ? (
              <>
                <div className="h-px bg-stone-200 my-1" />
                <p className="text-sm text-stone-500">
                  Olá,{" "}
                  <span className="font-bold text-blue-600">
                    {currentUser.name}
                  </span>
                </p>
                <button
                  onClick={() => navigate("/register?edit=1")}
                  className="text-left text-stone-700 hover:text-blue-600 font-medium"
                >
                  Editar meus dados
                </button>
                <NavLink
                  to="/meus-pedidos"
                  className={`text-stone-700 hover:text-blue-600 font-medium ${
                    hasUndeliveredOrder
                      ? "animate-pulse rounded-lg bg-blue-600 px-3 py-2 text-white shadow"
                      : ""
                  }`}
                >
                  Meus Pedidos
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="text-left text-stone-700 hover:text-blue-600 font-medium"
                >
                  Sair
                </button>
              </>
            ) : (
              <span className="text-sm text-stone-600">Bem-vindo!</span>
            )}
          </div>
        </div>
      )}

      {/* Traço azul embaixo do header */}
      <div style={{ height: "4px", background: "#2563eb", width: "100%" }} />
    </>
  );
};

export default Header;
