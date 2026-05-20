import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext"; // 🏪 MULTI-TENANT
import Chatbot from "./Chatbot";
import logo from "../assets/clubsmaker-logo.png";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { store } = useStore(); // 🏪 Obtém configurações da loja
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUndeliveredOrder, setHasUndeliveredOrder] = useState(false);

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
    color: "var(--color-accent)",
    fontWeight: 600,
  };

  return (
    <>
      <header
        className="border-b border-[var(--color-accent)] sticky top-0 z-50 h-16 shadow-sm"
        style={{
          background:
            "linear-gradient(90deg, #ffffff 0%, #0057c8 34%, #00377f 72%, #e51b23 100%)",
        }}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo e Chatbot lado a lado no mobile */}
          <div className="flex items-center gap-2 relative">
            <NavLink
              to={currentUser ? "/menu" : "/"}
              className="flex items-center gap-2 group"
            >
              <img
                src={logo}
                alt="ClubsMaker logo"
                className="w-12 h-12 rounded-lg group-hover:scale-105 transition-transform object-cover"
              />
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: "#00377f" }}
              >
                ClubsMaker
              </span>
            </NavLink>
            {/* Chatbot ao lado do logo no mobile */}
            <span className="block md:hidden ml-2">
              <Chatbot />
            </span>
          </div>

          {/* Navegação Central (Desktop) */}
          <nav className="flex items-center gap-4 md:gap-8 max-[1100px]:hidden">
            {currentUser &&
              (!currentUser.role || currentUser.role === "customer") && (
                <NavLink
                  to="/menu"
                  className="text-white transition-colors font-medium"
                >
                  Catálogo
                </NavLink>
              )}

            {currentUser?.role === "kitchen" && (
              <NavLink
                to="/cozinha"
                style={({ isActive }) =>
                  isActive ? activeLinkStyle : undefined
                }
                className="text-white hover:text-[var(--color-accent)] transition-colors font-medium"
              >
                Pedidos Cozinha
              </NavLink>
            )}

            {currentUser?.role === "admincustomer" && (
              <NavLink
                to="/admin/login"
                className="text-white hover:text-[var(--color-accent)] transition-colors font-medium"
              >
                Ir para Admin
              </NavLink>
            )}

            {currentUser?.role === "admin" && (
              <>
                <NavLink
                  to="/admin"
                  className="text-white hover:text-[var(--color-accent)] transition-colors font-medium"
                >
                  Produtos
                </NavLink>
                <NavLink
                  to="/admin/management-report"
                  className="text-[var(--color-accent)] hover:text-white transition-colors font-medium"
                >
                  Relatorio Gestao
                </NavLink>
                <NavLink
                  to="/admin/reports"
                  className="text-[var(--color-accent)] hover:text-white transition-colors font-medium"
                >
                  Relatórios IA
                </NavLink>
              </>
            )}
          </nav>

          {/* Área do Usuário (Desktop) + Menu Hambúrguer (<1100px) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="hidden max-[1100px]:inline-flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--color-secondary)] text-white hover:bg-red-700 transition-colors"
              aria-label="Abrir menu"
              title="Menu"
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

            {/* Área do Usuário (Direita) */}
            <div className="flex items-center gap-4 max-[1100px]:hidden">
              {currentUser ? (
                <>
                  {/* Chatbot só desktop aqui */}
                  <span className="hidden md:block">
                    <Chatbot />
                  </span>
                  <div className="h-6 w-px bg-stone-200 mx-1"></div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right leading-tight">
                      <p className="text-xs text-white font-medium">Olá,</p>
                      <p
                        className="text-sm font-bold max-w-[100px] truncate"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {currentUser.name}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/register?edit=1")}
                      className="edit-btn bg-[var(--color-primary)] text-white font-bold py-1 px-3 rounded-lg ml-2 hover:bg-[var(--color-primary-hover)] transition-colors shadow-md text-xs"
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
                      className={`bg-[var(--color-accent)] text-[var(--color-dark)] font-bold py-1 px-3 rounded-lg ml-2 hover:bg-yellow-300 transition-colors shadow-md text-xs flex items-center gap-2 ${
                        hasUndeliveredOrder
                          ? "animate-pulse ring-2 ring-white ring-offset-2 ring-offset-[var(--color-primary)]"
                          : ""
                      }`}
                      title="Meus Pedidos"
                    >
                      <span>📦</span>
                      <span>Meus Pedidos</span>
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="text-white hover:text-[var(--color-primary)] hover:bg-white p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
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
                <span className="text-sm text-white">Bem-vindo!</span>
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
                  className="text-stone-700 hover:text-[var(--color-primary)] font-medium"
                >
                  Catálogo
                </NavLink>
              )}

            {currentUser?.role === "kitchen" && (
              <NavLink
                to="/cozinha"
                className="text-stone-700 hover:text-[var(--color-primary)] font-medium"
              >
                Pedidos Cozinha
              </NavLink>
            )}

            {currentUser?.role === "admincustomer" && (
              <NavLink
                to="/admin/login"
                className="text-stone-700 hover:text-[var(--color-primary)] font-medium"
              >
                Ir para Admin
              </NavLink>
            )}

            {currentUser?.role === "admin" && (
              <>
                <NavLink
                  to="/admin"
                  className="text-stone-700 hover:text-[var(--color-primary)] font-medium"
                >
                  Produtos
                </NavLink>
                <NavLink
                  to="/admin/management-report"
                  className="text-[var(--color-success)] hover:text-green-800 font-medium"
                >
                  Relatorio Gestao
                </NavLink>
                <NavLink
                  to="/admin/reports"
                  className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] font-medium"
                >
                  Relatórios IA
                </NavLink>
              </>
            )}

            {currentUser ? (
              <>
                <div className="h-px bg-stone-200 my-1" />
                <p className="text-sm text-stone-500">
                  Olá,{" "}
                  <span className="font-bold text-stone-700">
                    {currentUser.name}
                  </span>
                </p>
                <button
                  onClick={() => navigate("/register?edit=1")}
                  className="text-left text-stone-700 hover:text-[var(--color-primary)] font-medium"
                >
                  Editar meus dados
                </button>
                <NavLink
                  to="/meus-pedidos"
                  className={`text-stone-700 hover:text-[var(--color-primary)] font-medium ${
                    hasUndeliveredOrder
                      ? "animate-pulse rounded-lg bg-[var(--color-accent)] px-3 py-2 text-[var(--color-dark)] shadow"
                      : ""
                  }`}
                >
                  Meus Pedidos
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="text-left text-stone-700 hover:text-[var(--color-primary)] font-medium"
                >
                  Sair
                </button>
              </>
            ) : (
              <span className="text-sm text-stone-700">Bem-vindo!</span>
            )}
          </div>
        </div>
      )}

      {/* Traço laranja embaixo do header */}
      <div
        style={{
          height: "5px",
          background:
            "linear-gradient(90deg, var(--color-secondary), var(--color-accent), var(--color-success), var(--color-primary))",
          width: "100%",
        }}
      />
    </>
  );
};

export default Header;

