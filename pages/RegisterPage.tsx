import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";
import { updateUser } from "../services/apiService";

const RegisterPage: React.FC = () => {
  const { currentUser, login } = useAuth();
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const isEdit = !!currentUser;

  // Preencher campos se for edição
  useEffect(() => {
    if (isEdit && currentUser) {
      setCpf(currentUser.cpf || "");
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setCep(currentUser.cep || "");
      setAddress(currentUser.address || "");
      setPhone(currentUser.telefone || currentUser.phone || "");
      setPassword(""); // nunca preencher senha
    } else {
      const params = new URLSearchParams(window.location.search);
      const cpfParam = params.get("cpf");
      if (cpfParam) setCpf(cpfParam);
    }
  }, [isEdit, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf || cpf.replace(/\D/g, "").length !== 11) {
      setError("CPF inválido. Digite 11 dígitos.");
      return;
    }
    if (!name.trim() || name.trim().length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Email inválido");
      return;
    }
    if (!cep.trim() || cep.replace(/\D/g, "").length !== 8) {
      setError("CEP inválido. Digite 8 dígitos.");
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setError("Endereço completo obrigatório");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
      setError("Telefone obrigatório e válido");
      return;
    }
    if (!password || password.length < 6) {
      setError("Senha obrigatória (mínimo 6 caracteres)");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      if (isEdit && currentUser) {
        // Atualizar dados do usuário
        const data = await updateUser(currentUser.id, {
          cpf,
          name,
          email,
          cep,
          address,
          phone,
          password,
        });
        if (data.success) {
          login({ ...currentUser, ...data.user });
          await Swal.fire({
            title: "Dados atualizados!",
            text: "Suas informações foram salvas.",
            icon: "success",
            confirmButtonColor: "#0057c8",
          });
          navigate("/menu");
        } else {
          setError(data.error || "Erro ao atualizar dados");
        }
      } else {
        // Cadastro normal
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/users/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cpf,
              name,
              email,
              cep,
              address,
              phone,
              password,
            }),
          },
        );
        if (!response.ok) {
          throw new Error("Erro ao cadastrar");
        }
        const data = await response.json();
        if (data.success) {
          await Swal.fire({
            title: "Cadastro realizado!",
            text: "Sua conta foi criada com sucesso.",
            icon: "success",
            confirmButtonColor: "#0057c8",
          });
          navigate("/login");
        }
      }
    } catch (err) {
      setError(
        isEdit
          ? "Erro ao atualizar dados. Tente novamente."
          : "Erro ao cadastrar. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050604] bg-[radial-gradient(circle_at_16%_8%,rgba(37,99,235,0.24),transparent_24rem),radial-gradient(circle_at_86%_78%,rgba(239,36,36,0.14),transparent_22rem)] p-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-blue-500/20 bg-[#071226] p-10 shadow-2xl shadow-blue-950/40">
        <h1 className="mb-6 text-3xl font-bold text-white">
          {isEdit ? "Editar meus dados" : "Cadastro"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="cpf"
              className="mb-2 block text-sm font-semibold text-blue-100"
            >
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-lg border-2 border-blue-500/20 bg-[#050604] px-4 py-3 text-white placeholder:text-blue-200/45 focus:border-blue-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-blue-100"
            >
              Nome Completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full rounded-lg border-2 border-blue-500/20 bg-[#050604] px-4 py-3 text-white placeholder:text-blue-200/45 focus:border-blue-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-blue-100"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              className="w-full rounded-lg border-2 border-blue-500/20 bg-[#050604] px-4 py-3 text-white placeholder:text-blue-200/45 focus:border-blue-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="cep"
              className="mb-2 block text-sm font-semibold text-blue-100"
            >
              CEP
            </label>
            <input
              id="cep"
              type="text"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="00000-000"
              className="w-full rounded-lg border-2 border-blue-500/20 bg-[#050604] px-4 py-3 text-white placeholder:text-blue-200/45 focus:border-blue-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-semibold text-blue-100"
            >
              Endereço Completo
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
              className="w-full rounded-lg border-2 border-blue-500/20 bg-[#050604] px-4 py-3 text-white placeholder:text-blue-200/45 focus:border-blue-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-semibold text-blue-100"
            >
              Telefone
            </label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(99) 99999-9999"
              className="w-full rounded-lg border-2 border-blue-500/20 bg-[#050604] px-4 py-3 text-white placeholder:text-blue-200/45 focus:border-blue-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-blue-100"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite uma senha"
              className="w-full rounded-lg border-2 border-blue-500/20 bg-[#050604] px-4 py-3 text-white placeholder:text-blue-200/45 focus:border-blue-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          {error && <p className="mt-2 text-sm font-semibold text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors text-lg disabled:bg-[var(--color-primary)]/50 disabled:cursor-wait"
          >
            {isLoading
              ? isEdit
                ? "Salvando..."
                : "Cadastrando..."
              : isEdit
                ? "Salvar alterações"
                : "Cadastrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
