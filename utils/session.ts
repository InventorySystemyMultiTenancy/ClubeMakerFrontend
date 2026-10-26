import type { UserRole } from "../types";

// Sessão expirada: o token JWT tem validade (8h para admin/cozinha/operador, 30 dias
// para cliente), mas o usuário fica salvo no localStorage sem prazo. Quando o token
// vence, o app precisa deslogar e pedir login de novo — senão a tela continua
// "logada" e todas as chamadas à API falham.

export const SESSION_EXPIRED_EVENT = "clubemaker:session-expired";

// Avisa o AuthContext (que desloga e manda para a tela de login certa)
export function notifySessionExpired(): void {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

// Momento (ms) em que o token vence, lido do campo "exp" do JWT. null = sem exp/ilegível.
export function getTokenExpiry(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = JSON.parse(json)?.exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

// Tela de login de cada perfil (rotas do HashRouter)
export function getLoginPathForRole(role: UserRole | undefined): string {
  switch (role) {
    case "admin":
      return "/admin/login";
    case "print_operator":
      return "/operador/login";
    case "kitchen":
      return "/kitchen/login";
    default:
      return "/login";
  }
}
