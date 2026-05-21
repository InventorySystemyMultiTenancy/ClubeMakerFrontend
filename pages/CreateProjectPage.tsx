import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const CONTACT_WHATSAPP = "5511947094271";

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");
  const [colorQuantity, setColorQuantity] = useState("1");
  const [colors, setColors] = useState("");
  const [pieceQuantity, setPieceQuantity] = useState("1");
  const [shippingData, setShippingData] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [makerWorldSearch, setMakerWorldSearch] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  const canSubmit = useMemo(
    () =>
      file &&
      size.trim() &&
      height.trim() &&
      width.trim() &&
      depth.trim() &&
      colorQuantity.trim() &&
      colors.trim() &&
      pieceQuantity.trim() &&
      shippingData.trim(),
    [
      file,
      size,
      height,
      width,
      depth,
      colorQuantity,
      colors,
      pieceQuantity,
      shippingData,
    ],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!canSubmit || !file) {
      setError("Preencha todos os campos obrigatorios e envie o arquivo.");
      return;
    }

    let fileBase64 = "";
    try {
      fileBase64 = await fileToBase64(file);
    } catch {
      setError("Nao foi possivel ler o arquivo selecionado.");
      return;
    }

    const quote = {
      userId: currentUser?.id,
      userName: currentUser?.name,
      fileName: file.name,
      fileSize: file.size,
      fileBase64,
      size: size.trim(),
      height: height.trim(),
      width: width.trim(),
      depth: depth.trim(),
      colorQuantity: colorQuantity.trim(),
      colors: colors.trim(),
      pieceQuantity: pieceQuantity.trim(),
      shippingData: shippingData.trim(),
    };

    setIsSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/project-quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar o orcamento.");
      }
    } catch (err: any) {
      setError(err.message || "Nao foi possivel salvar o orcamento.");
      setIsSaving(false);
      return;
    }

    const message = encodeURIComponent(
      [
        "Ola! Quero solicitar um orcamento de projeto 3D.",
        "",
        `Cliente: ${currentUser?.name || "Cliente"}`,
        `Arquivo: ${quote.fileName}`,
        `Tamanho: ${quote.size}`,
        `Altura: ${quote.height}`,
        `Largura: ${quote.width}`,
        `Profundidade: ${quote.depth}`,
        `Quantidade de cores: ${quote.colorQuantity}`,
        `Cores: ${quote.colors}`,
        `Quantidade de pecas: ${quote.pieceQuantity}`,
        "",
        `Dados de envio: ${quote.shippingData}`,
      ].join("\n"),
    );

    window.open(`https://wa.me/${CONTACT_WHATSAPP}?text=${message}`, "_blank");
    setIsSaving(false);
    navigate("/meus-orcamentos");
  };

  const handleMakerWorldSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = makerWorldSearch.trim();

    if (!query) {
      return;
    }

    window.open(
      `https://makerworld.com/en/search/models?keyword=${encodeURIComponent(
        query,
      )}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="neon-scrollbar h-full overflow-y-auto bg-[#08111f] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-8 rounded-lg border border-cyan-300/20 bg-[#050914] p-5 shadow-[0_0_20px_rgba(0,229,255,0.08)]">
          <h2 className="mb-4 text-2xl font-black text-white">
            Pesquise seu projeto no Bambu Studio
          </h2>
          <form
            onSubmit={handleMakerWorldSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={makerWorldSearch}
              onChange={(event) => setMakerWorldSearch(event.target.value)}
              placeholder="Ex: chaveiro dragao, suporte celular, miniatura..."
              className="min-h-12 flex-1 rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
            <button
              type="submit"
              className="energy-cta rounded-lg bg-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_18px_rgba(34,211,238,0.35)] transition hover:bg-cyan-400 active:scale-[0.98]"
            >
              Pesquisar no MakerWorld
            </button>
          </form>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="rounded-lg border border-cyan-300/30 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-300/10"
            >
              Ver instruções
            </button>
          </div>
        </section>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
              Orcamento de projeto
            </p>
            <h1 className="text-3xl font-black md:text-4xl">
              Criar projeto 3D
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="rounded-lg border border-cyan-300/30 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-300/10"
          >
            Voltar ao catalogo
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-lg border border-cyan-300/20 bg-[#050914] p-5 shadow-[0_0_20px_rgba(0,229,255,0.08)] md:grid-cols-2 md:p-6"
        >
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-cyan-100">
              Arquivo do projeto *
            </span>
            <input
              type="file"
              required
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1526] px-3 py-3 text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-cyan-400"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-cyan-100">
              Tamanho *
            </span>
            <input
              value={size}
              onChange={(event) => setSize(event.target.value)}
              required
              placeholder="Ex: pequeno, medio, grande ou escala"
              className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-cyan-100">
              Quantidade de pecas *
            </span>
            <input
              type="number"
              min="1"
              value={pieceQuantity}
              onChange={(event) => setPieceQuantity(event.target.value)}
              required
              className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition focus:border-cyan-300"
            />
          </label>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-sm font-bold text-cyan-100">
                Altura *
              </span>
              <input
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                required
                placeholder="Ex: 10 cm"
                className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-cyan-100">
                Largura *
              </span>
              <input
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                required
                placeholder="Ex: 8 cm"
                className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-cyan-100">
                Profundidade *
              </span>
              <input
                value={depth}
                onChange={(event) => setDepth(event.target.value)}
                required
                placeholder="Ex: 6 cm"
                className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
            </label>
          </div>

          <label>
            <span className="mb-2 block text-sm font-bold text-cyan-100">
              Quantidade de cores *
            </span>
            <input
              type="number"
              min="1"
              value={colorQuantity}
              onChange={(event) => setColorQuantity(event.target.value)}
              required
              className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition focus:border-cyan-300"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-cyan-100">
              Quais cores *
            </span>
            <input
              value={colors}
              onChange={(event) => setColors(event.target.value)}
              required
              placeholder="Ex: azul, preto e branco"
              className="w-full rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-bold text-cyan-100">
              Dados de envio *
            </span>
            <textarea
              value={shippingData}
              onChange={(event) => setShippingData(event.target.value)}
              required
              rows={4}
              placeholder="Nome, telefone, endereco completo, CEP e observacoes de entrega"
              className="w-full resize-none rounded-lg border border-cyan-300/20 bg-[#0b1526] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>

          {error && (
            <div className="md:col-span-2 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="energy-cta rounded-lg bg-lime-400 px-6 py-3 text-base font-black text-[#06110a] shadow-[0_0_18px_rgba(163,230,53,0.45)] transition hover:bg-lime-300 active:scale-[0.98]"
            >
              {isSaving ? "Salvando..." : "Salvar e enviar para o WhatsApp"}
            </button>
          </div>
        </form>
      </div>

      {showInstructions && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl rounded-lg border border-cyan-300/20 bg-[#050914] p-4 shadow-[0_0_40px_rgba(0,229,255,0.22)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">Instruções</h2>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Fechar
              </button>
            </div>
            <video
              src="/comobaixar.mp4"
              controls
              autoPlay
              className="max-h-[75vh] w-full rounded-lg bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProjectPage;
