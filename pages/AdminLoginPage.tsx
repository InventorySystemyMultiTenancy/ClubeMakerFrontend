import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { login as apiLogin, isAuthenticated } from "../services/apiService";
import { adminUserLogin } from "../services/adminUsersService";
import { getAdminHomePath } from "../utils/adminPermissions";

const AdminLoginPage: React.FC = () => {
  const location = useLocation();
  // Chega pré-preenchido quando a tela de login de cliente detecta, pelo CPF,
  // que a conta é de um administrador cadastrado.
  const cpfFromQuery = new URLSearchParams(location.search).get("cpf") || "";
  const [cpf, setCpf] = useState(cpfFromQuery);
  // A tela pede só a senha (administrador principal). O campo de CPF só aparece
  // para administrador cadastrado: vindo da tela de login com o CPF já detectado,
  // ou se ele pedir pelo link "Entrar com CPF".
  const [useCpf, setUseCpf] = useState(Boolean(cpfFromQuery));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se já está logado como admin, redirecionar
    if (currentUser?.role === "admin" || isAuthenticated()) {
      navigate(getAdminHomePath(currentUser) || "/admin");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useCpf && !cpf.trim()) {
      setError("Informe o CPF");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      // Com CPF: administrador cadastrado, com acesso só às abas liberadas para ele
      if (useCpf && cpf.trim()) {
        try {
          const admin = await adminUserLogin(cpf, password);
          const adminUser = {
            id: admin.id,
            name: admin.name,
            historico: [],
            role: "admin" as const,
            permissions: admin.permissions,
          };
          login(adminUser);
          navigate(getAdminHomePath(adminUser) || "/admin");
        } catch (err: any) {
          setError(err?.message || "CPF ou senha inválidos");
          setPassword("");
        }
        return;
      }

      // Sem CPF: administrador principal (senha compartilhada, acesso total)
      const success = await apiLogin("admin", password);

      if (success) {
        // Atualiza o contexto local com o usuário admin
        const adminUser = {
          id: "admin_user",
          name: "Administrador",
          historico: [],
          role: "admin" as const,
        };
        login(adminUser);
        navigate("/admin");
      } else {
        setError("Senha incorreta");
        setPassword("");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[var(--color-primary-active)] to-[var(--color-primary)] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/selfMachine.jpg"
            alt="Self Machine"
            className="w-24 sm:w-32 h-auto mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl sm:text-4xl font-bold text-[var(--color-primary-active)] mb-2">
            👑 Acesso Administrador
          </h1>
          <p className="text-slate-600">
            {useCpf ? "Digite seu CPF e senha para acessar" : "Digite a senha para acessar"}
          </p>
          {/* Loja: single-tenant, não exibe mais storeId */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {useCpf && (
            <div>
              <label
                htmlFor="cpf"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => {
                  setCpf(e.target.value);
                  setError("");
                }}
                placeholder="000.000.000-00"
                autoFocus={!cpfFromQuery}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                disabled={isLoading}
                autoComplete="username"
                inputMode="numeric"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Digite a senha"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              autoFocus={!useCpf || Boolean(cpfFromQuery)}
              autoComplete="current-password"
              disabled={isLoading}
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--color-primary-active)] text-white font-bold py-3 rounded-lg hover:bg-[var(--color-primary-active)] transition-colors text-lg disabled:bg-[var(--color-primary)]/50 disabled:cursor-wait"
          >
            {isLoading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setUseCpf((value) => !value);
            setCpf("");
            setError("");
          }}
          className="w-full mt-4 py-2 text-sm text-slate-500 underline hover:text-slate-700 transition-colors"
        >
          {useCpf
            ? "Entrar só com a senha do administrador principal"
            : "Sou administrador cadastrado (entrar com CPF)"}
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-1 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
        >
          ← Voltar ao início
        </button>

        <button
          onClick={() => navigate("/operador/login")}
          className="w-full mt-1 py-2 text-sm text-slate-500 underline hover:text-slate-700 transition-colors"
        >
          Sou operador de impressora 3D
        </button>
      </div>
    </div>
  );
};

export default AdminLoginPage;
