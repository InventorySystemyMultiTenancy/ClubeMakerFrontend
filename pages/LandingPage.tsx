import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/clubsmaker-logo.png";

const serviceCards = [
  {
    title: "Prototipagem rapida",
    text: "Modelos conceituais, provas de encaixe e testes de engenharia com ciclos curtos.",
    accent: "var(--color-accent)",
  },
  {
    title: "Pecas finais e lotes",
    text: "Producao sob demanda para pecas personalizadas, reposicao e pequenas series.",
    accent: "var(--color-secondary)",
  },
  {
    title: "Materiais avancados",
    text: "Filamentos tecnicos para aplicacoes rigidas, flexiveis e resistentes.",
    accent: "var(--color-success)",
  },
];

const processSteps = [
  {
    title: "Faca o login",
    text: "Acesse sua conta com CPF ou CNPJ em um ambiente seguro.",
    icon: "login",
  },
  {
    title: "Envie o arquivo",
    text: "Suba seu modelo 3D, como STL ou OBJ, e escolha os detalhes do pedido.",
    icon: "upload",
  },
  {
    title: "Receba em casa",
    text: "A equipe prepara, imprime e acompanha o envio ate o destino.",
    icon: "delivery",
  },
];

const iconPaths = {
  login: "M9 11V8a3 3 0 0 1 6 0v3m-8 0h10v8H7v-8Zm4 4h2",
  upload: "M12 16V5m0 0 4 4m-4-4-4 4M5 18h14",
  delivery:
    "M4 8h10v8H4V8Zm10 3h3l3 3v2h-6v-5ZM7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
} as const;

type IconName = keyof typeof iconPaths;

const MiniIcon: React.FC<{ name: IconName; color?: string }> = ({
  name,
  color = "var(--color-primary)",
}) => (
  <svg
    viewBox="0 0 24 24"
    className="h-8 w-8"
    fill="none"
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={iconPaths[name]} />
  </svg>
);

const LandingPage: React.FC = () => {
  return (
    <div className="-m-4 md:-m-8 bg-[#f5faff] text-slate-900">
      <section className="relative overflow-hidden bg-[#071a3d] text-white">
        <div className="absolute inset-0 opacity-35">
          <div className="h-full w-full bg-[radial-gradient(circle_at_80%_18%,rgba(255,217,0,0.34),transparent_24%),radial-gradient(circle_at_10%_68%,rgba(229,27,35,0.28),transparent_24%),linear-gradient(135deg,#071a3d_0%,#00377f_46%,#0057c8_100%)]" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,26,61,0.96),rgba(7,26,61,0.72),rgba(7,26,61,0.92))]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-5.25rem)] max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[1.04fr_0.96fr] md:px-8 lg:px-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50">
              Impressao 3D sob demanda
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Transforme suas ideias em realidade digital e fisica.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-blue-50 sm:text-lg">
              Impressao 3D de alta precisao a poucos cliques. Do prototipo
              industrial a peca personalizada, gerencie pedidos, envie arquivos
              e acompanhe a producao em tempo real.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-secondary)] px-6 py-3 text-base font-bold text-white shadow-lg shadow-red-950/25 transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                Enviar meu projeto
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/16 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                Como funciona
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-3 top-8 h-32 w-32 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/8 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-white p-4 shadow-inner">
                <img
                  src={logo}
                  alt="Clube Maker 3D"
                  className="mx-auto aspect-square w-full max-w-sm object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            O que fazemos
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[#071a3d] sm:text-4xl">
            Solucoes para tirar projetos do arquivo e colocar na mao.
          </h2>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {serviceCards.map((card) => (
            <article
              key={card.title}
              className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"
            >
              <div
                className="mb-5 h-2 w-16 rounded-full"
                style={{ backgroundColor: card.accent }}
              />
              <h3 className="text-xl font-bold text-[#071a3d]">
                {card.title}
              </h3>
              <p className="mt-3 leading-7 text-slate-600">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="como-funciona"
        className="bg-white px-5 py-16 md:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
              Jornada simples
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#071a3d] sm:text-4xl">
              Da ideia ao envio em tres etapas.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">
                    Passo {index + 1}
                  </span>
                  <MiniIcon
                    name={step.icon as IconName}
                    color={
                      index === 0
                        ? "var(--color-primary)"
                        : index === 1
                          ? "var(--color-secondary)"
                          : "var(--color-success)"
                    }
                  />
                </div>
                <h3 className="mt-5 text-xl font-bold text-[#071a3d]">
                  {step.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-lg bg-[#071a3d] px-6 py-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <h3 className="text-2xl font-bold">Pronto para comecar?</h3>
              <p className="mt-2 text-blue-50">
                Entre na plataforma e envie seu projeto para orcamento e
                producao.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-3 font-bold text-[#071a3d] transition hover:bg-yellow-300 sm:mt-0"
            >
              Entrar na plataforma
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
