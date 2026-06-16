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
  };

  const registerCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = documentInput.replace(/\D/g, "");

    if (clean.length !== 11 && clean.length !== 14) {
      setError("Documento invalido. Digite 11 digitos (CPF) ou 14 (CNPJ).");
      return;
    }

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
          cpf: clean,
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
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mb-3 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-blue-100 hover:bg-white/10 hover:text-white"
        >
          &larr; voltar
        </button>
        <h1 className="text-3xl font-bold text-[var(--color-primary-active)]">
          Criar cadastro para cliente
        </h1>
      </div>

      <div className="mx-auto max-w-md rounded-2xl border border-blue-500/20 bg-[#071226] p-8 shadow-2xl shadow-blue-950/40">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Cadastrar Conta</h2>
          <p className="text-blue-100">
            Complete o cadastro do cliente sem sair da conta admin.
          </p>
        </div>

        <form
          onSubmit={registerCustomer}
          className="max-h-[60vh] space-y-4 overflow-y-auto px-1"
        >
          <input
            type="text"
            value={documentInput}
            onChange={handleDocChange}
            placeholder="CPF ou CNPJ"
            className="w-full rounded-lg border px-4 py-2"
            disabled={isLoading}
          />
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
            onClick={resetForm}
            className="w-full text-sm text-blue-100 hover:text-white"
            disabled={isLoading}
          >
            Limpar formulario
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateCustomerPage;
