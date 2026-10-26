import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import AdminLayout from "./AdminLayout";

// Tema do painel admin: "dark" é o visual atual de todas as abas; "light" é o visual
// claro original (fundo claro, cartões brancos, botões coloridos), usado no
// Histórico de Pedidos. Ao trocar de aba o tema muda com um fade, partindo do
// tema da aba anterior — por isso o último tema fica guardado fora do componente
// (cada rota monta o seu próprio AdminThemeShell).
export type AdminTheme = "dark" | "light";

// null = nenhuma aba do admin aberta ainda (ex.: recarregou a página): abre direto no tema
let lastAdminTheme: AdminTheme | null = null;
// Transição em andamento — evita começar outra igual (o StrictMode roda o efeito
// duas vezes em desenvolvimento e a segunda cancelaria a primeira)
let pendingTransitionTo: AdminTheme | null = null;

const FADE_MS = 600;

type ViewTransitionLike = { finished?: Promise<unknown>; ready?: Promise<unknown> };
type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike;
};

const AdminThemeShell: React.FC<{ theme?: AdminTheme; children: React.ReactNode }> = ({
  theme = "dark",
  children,
}) => {
  const [current, setCurrent] = useState<AdminTheme>(lastAdminTheme ?? theme);
  const [animating, setAnimating] = useState(false);
  const targetRef = useRef<AdminTheme>(theme);
  targetRef.current = theme;

  useEffect(() => {
    lastAdminTheme = theme;
    if (current === theme) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const doc = document as DocumentWithViewTransition;
    if (reduceMotion) {
      setCurrent(theme);
      return;
    }

    // Navegadores com View Transitions: crossfade da tela inteira entre os temas
    if (typeof doc.startViewTransition === "function") {
      if (pendingTransitionTo === theme) return;
      pendingTransitionTo = theme;
      const transition = doc.startViewTransition(() => {
        flushSync(() => setCurrent(targetRef.current));
      });
      // Transição pulada (ex.: outra aba aberta no meio do fade) rejeita estas promises
      transition?.ready?.catch(() => {});
      const done = () => {
        pendingTransitionTo = null;
      };
      transition?.finished ? transition.finished.then(done, done) : done();
      return;
    }

    // Sem View Transitions: transição de CSS no fundo e nas cores (.admin-theme-animating)
    setAnimating(true);
    const frame = requestAnimationFrame(() => setCurrent(theme));
    const timer = setTimeout(() => setAnimating(false), FADE_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
    // current fica de fora de propósito: o efeito só reage à troca de aba (theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <div
      className={`admin-shell ${current === "dark" ? "admin-modern-theme" : "admin-light-theme"} ${
        animating ? "admin-theme-animating" : ""
      }`}
    >
      {/* Fundo escuro em camada própria: some/aparece com opacidade (gradiente não anima) */}
      <div className="admin-shell-bg" aria-hidden="true" />
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
};

export default AdminThemeShell;
