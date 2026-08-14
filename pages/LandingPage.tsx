import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/clubemaker-logo.png";

const serviceCards = [
  {
    title: "Produtos autorais em 3D",
    text: "Chaveiros, miniaturas e itens colecionaveis criados e fabricados pela ClubeMaker.",
    accent: "var(--color-accent)",
  },
  {
    title: "Acabamento de vitrine",
    text: "Pecas pensadas para venda, presente e colecao, com visual caprichado e pronta entrega conforme estoque.",
    accent: "var(--color-secondary)",
  },
  {
    title: "Novidades por categoria",
    text: "Linhas tematicas, personagens, acessorios e produtos especiais organizados no catalogo.",
    accent: "var(--color-success)",
  },
];

const processSteps = [
  {
    title: "Entre na loja",
    text: "Acesse a plataforma com CPF ou CNPJ para ver o catalogo disponivel.",
    icon: "login",
  },
  {
    title: "Escolha seus produtos",
    text: "Navegue pelas categorias, adicione os itens ao carrinho e confira os detalhes.",
    icon: "shop",
  },
  {
    title: "Finalize a compra",
    text: "Nos separamos os produtos fabricados pela ClubeMaker e cuidamos do envio.",
    icon: "delivery",
  },
];

const plushEmojis = ["🧸", "🐻", "🐰", "🦊", "🐼", "🐨"];
const floatingPlush = ["🧸", "🐰", "🐻", "🐼", "🦊", "🐨", "🧸", "🐰"];

const iconPaths = {
  login: "M9 11V8a3 3 0 0 1 6 0v3m-8 0h10v8H7v-8Zm4 4h2",
  shop: "M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0M5 8l1-4h12l1 4",
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
    <div className="bg-[#050604] text-slate-900">
      <section className="club-hero relative min-h-[calc(100vh-4.3125rem)] overflow-hidden text-white">
        <div className="club-marquee" aria-label="Mensagem principal">
          <div className="club-marquee-track">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={`marquee-${index}`}>
                Montamos seus projetos 3D e realizando seus sonhos
              </span>
            ))}
          </div>
        </div>

        <div className="club-grid" />
        <div className="club-scanline" />

        {floatingPlush.map((emoji, index) => (
          <span
            key={`float-${index}`}
            className={`club-floating-plush plush-${index + 1}`}
            aria-hidden="true"
          >
            {emoji}
          </span>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4.3125rem)] max-w-7xl flex-col items-center justify-center px-5 pb-16 pt-24 text-center md:px-8 lg:px-10">
          <div className="club-logo-stage" aria-label="Clube Maker">
            <div className="club-orbit club-orbit-one">
              {plushEmojis.map((emoji, index) => (
                <span
                  key={`orbit-one-${index}`}
                  style={
                    {
                      "--angle": `${index * (360 / plushEmojis.length)}deg`,
                    } as React.CSSProperties
                  }
                >
                  {emoji}
                </span>
              ))}
            </div>
            <div className="club-orbit club-orbit-two">
              {[...plushEmojis].reverse().map((emoji, index) => (
                <span
                  key={`orbit-two-${index}`}
                  style={
                    {
                      "--angle": `${index * (360 / plushEmojis.length)}deg`,
                    } as React.CSSProperties
                  }
                >
                  {emoji}
                </span>
              ))}
            </div>
            <img
              src={logo}
              alt="Clube Maker"
              className="club-hero-logo"
            />
          </div>

          <div className="mt-8 max-w-4xl">
            <div className="mb-5">
              <Link
                to="/login?redirect=/menu"
                className="energy-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-base font-black text-slate-900 shadow-[0_0_28px_rgba(251,191,36,0.45)] transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200/40"
              >
                Comprar agora
              </Link>
            </div>
            <p className="club-neon-kicker">Projetos 3D personalizados</p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-7xl">
              A sua ideia ganhando forma, cor e presença.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-blue-50 sm:text-lg">
              Criamos, modelamos e produzimos pecas 3D para transformar
              referencias, personagens e projetos especiais em produtos reais.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/login?redirect=/criar-projeto"
                className="energy-cta inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-[0_0_24px_rgba(37,99,235,0.45)] transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                Criar meu projeto
              </Link>
              <Link
                to="/login?redirect=/criar-projeto"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/16 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                Ver como funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#071226] px-5 py-20 text-white md:px-8 lg:px-10">
        <div className="club-plush-river" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={`river-${index}`}>
              {plushEmojis[index % plushEmojis.length]}
            </span>
          ))}
        </div>
        <div className="club-scroll-reveal relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">
            Do desenho ao objeto
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-black text-white sm:text-5xl">
            Mais que imprimir: a ClubeMaker ajuda a construir a ideia junto com
            você.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
            Ajustamos medidas, estilo, acabamento e detalhes para cada projeto
            nascer com personalidade.
          </p>
        </div>

        <div className="club-scroll-reveal relative mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-3">
          {serviceCards.map((card) => (
            <article
              key={card.title}
              className="energy-card rounded-lg border border-blue-300/20 bg-white/8 p-6 shadow-[0_0_28px_rgba(37,99,235,0.14)] backdrop-blur"
            >
              <div
                className="mb-5 h-2 w-16 rounded-full"
                style={{ backgroundColor: card.accent }}
              />
              <h3 className="text-xl font-bold text-white">
                {card.title}
              </h3>
              <p className="mt-3 leading-7 text-blue-100">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="como-funciona"
        className="bg-[#f5faff] px-5 py-20 md:px-8 lg:px-10"
      >
        <div className="club-scroll-reveal mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
              Jornada simples
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#071a3d] sm:text-4xl">
              Comprar na ClubeMaker e simples.
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
                Entre na plataforma e escolha os produtos fabricados pela
                ClubeMaker.
              </p>
            </div>
            <Link
              to="/login?redirect=/criar-projeto"
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
