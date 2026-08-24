import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isAuthenticated } from "../services/apiService";
import { operatorLogin } from "../services/printFarmService";

const PrinterOperatorLoginPage: React.FC = () => {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.role === "print_operator" && isAuthenticated()) {
      navigate("/operador");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const operator = await operatorLogin(cpf, password);
      login({
        id: `operator_${operator.id}`,
        name: operator.name,
        historico: [],
        role: "print_operator",
      });
      navigate("/operador");
    } catch (err: any) {
      setError(err.message || "Usuário ou senha inválidos");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-slate-800">🖨️ Operador de Impressão</h1>
          <p className="text-slate-600">Entre com seu CPF e senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="cpf" className="mb-2 block text-sm font-semibold text-slate-700">
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
              className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 transition-colors focus:border-slate-500 focus:outline-none"
              autoFocus
              disabled={isLoading}
              autoComplete="username"
              inputMode="numeric"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
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
              placeholder="Digite sua senha"
              className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 transition-colors focus:border-slate-500 focus:outline-none"
              disabled={isLoading}
              autoComplete="current-password"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading || !cpf || !password}
            className="w-full rounded-lg bg-slate-700 py-3 text-lg font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
          >
            {isLoading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          className="mt-4 w-full py-2 text-sm text-slate-600 transition-colors hover:text-slate-800"
        >
          ← Voltar ao início
        </button>
      </div>
    </div>
  );
};

export default PrinterOperatorLoginPage;
