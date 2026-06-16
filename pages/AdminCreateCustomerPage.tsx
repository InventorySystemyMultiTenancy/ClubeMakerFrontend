import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

const AdminCreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [documentInput, setDocumentInput] = useState("");
  const [cleanedDoc, setCleanedDoc] = useState("");
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [existingCustomerName, setExistingCustomerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [cep, setCep] = useState("");
  const [phone, setPhone] = useState("");

  const resetForm = () => {
    setDocumentInput("");
    setCleanedDoc("");
    setRequiresRegistration(false);
    setExistingCustomerName("");
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setAddress("");
    setCep("");
    setPhone("");
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentInput(formatDocument(e.target.value));
    setError("");
    setRequiresRegistration(false);
    setExistingCustomerName("");
  };

  const checkDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = documentInput.replace(/\D/g, "");

    if (clean.length !== 11 && clean.length !== 14) {
      setError("Documento invalido. Digite 11 digitos (CPF) ou 14 (CNPJ).");
      return;
    }

    setIsLoading(true);
    setError("");
    setCleanedDoc(clean);

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/check-cpf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: clean }),
      });

      if (!response.ok) throw new Error("Erro ao verificar documento");

      const data = await response.json();
      if (data.exists && data.user) {
        setExistingCustomerName(data.user.name || "Cliente ja cadastrado");
        setRequiresRegistration(false);
        return;
      }

      setRequiresRegistration(true);
    } catch (err) {
      setError("Erro ao verificar documento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const registerCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha os campos obrigatorios.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: cleanedDoc,
          name: name.trim(),
          email: email.trim(),
          address: address.trim(),
          cep: cep.trim(),
          phone: phone.trim(),
          password: password.trim(),
          role: "customer",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.user) {
        setError(data.error || "Erro ao cadastrar");
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Cadastro criado!",
        text: "O cliente foi cadastrado sem sair da conta admin.",
        confirmButtonText: "OK",
      });
      resetForm();
    } catch (err) {
      setError("Erro de rede ao cadastrar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[var(--color-primary-active)]">
          Criar cadastro para cliente
        </h1>
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="rounded-lg bg-stone-200 px-5 py-2 font-bold text-stone-800 hover:bg-stone-300"
        >
          Voltar ao painel
        </button>
      </div>

      <div className="mx-auto max-w-md rounded-2xl border border-blue-500/20 bg-[#071226] p-8 shadow-2xl shadow-blue-950/40">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            {requiresRegistration
              ? "Cadastrar Conta"
              : "Fazer login ou verificar conta"}
          </h2>
          <p className="text-blue-100">
            {requiresRegistration
              ? "Complete o cadastro do cliente"
              : "Digite o CPF para verificar se o cliente ja tem uma conta"}
          </p>
        </div>

        {!requiresRegistration && (
          <form onSubmit={checkDocument} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-blue-100">
                CPF para login ou consulta de conta
              </label>
              <input
                type="text"
                value={documentInput}
                onChange={handleDocChange}
                placeholder="Digite o CPF: 000.000.000-00"
                className="w-full rounded-lg border-2 border-blue-500/20 bg-[#050604] px-4 py-3 text-lg text-white placeholder:text-blue-200/45 focus:border-blue-400 focus:outline-none"
                disabled={isLoading}
              />
            </div>
            {existingCustomerName && (
              <div className="rounded-lg border border-green-400/30 bg-green-950/30 p-3 text-sm font-semibold text-green-100">
                Cliente ja cadastrado: {existingCustomerName}
              </div>
            )}
            {error && (
              <p className="text-sm font-semibold text-red-300">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-950/40 transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? "Verificando CPF..." : "Verificar CPF e continuar"}
            </button>
          </form>
        )}

        {requiresRegistration && (
          <form
            onSubmit={registerCustomer}
            className="max-h-[60vh] space-y-4 overflow-y-auto px-1"
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome Completo"
              className="w-full rounded-lg border px-4 py-2"
              disabled={isLoading}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-lg border px-4 py-2"
              disabled={isLoading}
            />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Endereco"
              className="w-full rounded-lg border px-4 py-2"
              disabled={isLoading}
            />
            <input
              type="text"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="CEP"
              className="w-full rounded-lg border px-4 py-2"
              disabled={isLoading}
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefone"
              className="w-full rounded-lg border px-4 py-2"
              disabled={isLoading}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha"
              className="w-full rounded-lg border px-4 py-2"
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm font-semibold text-red-300">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[var(--color-primary)] py-3 font-bold text-white disabled:opacity-60"
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </button>
            <button
              type="button"
              onClick={() => setRequiresRegistration(false)}
              className="w-full text-sm text-blue-100 hover:text-white"
              disabled={isLoading}
            >
              Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminCreateCustomerPage;
