import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import Swal from "sweetalert2";
import type { User, Order } from "../types";
import { logout as apiLogout, getToken } from "../services/apiService";
import { getMyAdminAccess } from "../services/adminUsersService";
import { getCustomerToken, saveCustomerToken } from "../services/customerService";
import {
  SESSION_EXPIRED_EVENT,
  getLoginPathForRole,
  getTokenExpiry,
} from "../utils/session";

// Perfis que só funcionam com o jwt_token (login do admin, cozinha e operador)
const TOKEN_ROLES = ["admin", "kitchen", "print_operator"];
// Limite do setTimeout (~24,8 dias); prazos maiores são reagendados ao disparar
const MAX_TIMEOUT_MS = 2_147_483_647;

// Define o formato do contexto de autenticação: quais valores e funções estarão disponíveis
interface AuthContextType {
  currentUser: User | null; // usuário atualmente logado ou null se ninguém estiver logado
  login: (user: User) => void; // função para setar o usuário como logado
  logout: () => Promise<void>; // função para deslogar (limpar o usuário e pagamentos)
  addOrderToHistory: (order: Order) => void; // adiciona um pedido ao histórico do usuário
  refreshAdminAccess: () => Promise<void>; // recarrega as abas liberadas do admin cadastrado
}

// Cria o contexto com um valor inicial indefinido; será provido pelo AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider que envolve a aplicação e fornece o contexto de autenticação
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Estado local que guarda o usuário atual (ou null)
  // Inicializa a partir do localStorage para manter sessão após reload
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch (e) {
      return null;
    }
  });

  // Função para realizar o login: recebe um usuário e atualiza o estado
  const login = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch (e) {
      // ignore
    }
  };

  // Função para realizar logout: limpa pagamentos pendentes e depois deslogar
  const logout = async () => {
    try {
      // --- INTEGRAÇÃO POINT SMART 2 DESATIVADA ---
      // Limpar qualquer pagamento pendente na fila
      // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      // console.log("🧼 Limpando pagamentos pendentes antes de logout...");
      // const response = await fetch(`${API_URL}/api/payment/clear-queue`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      // if (response.ok) {
      //   const data = await response.json();
      //   console.log(`✅ ${data.cleared || 0} pagamento(s) limpo(s)`);
      // }
    } catch (error) {
      console.warn("⚠️ Erro ao limpar pagamentos (continua logout):", error);
    } finally {
      // Limpar token JWT
      apiLogout();
      saveCustomerToken(null);
      // Limpar usuário
      setCurrentUser(null);
      try {
        localStorage.removeItem("currentUser");
      } catch (e) {
        // ignore
      }
    }
  };

  // Adiciona um pedido ao histórico do usuário preservando imutabilidade
  const addOrderToHistory = (order: Order) => {
    setCurrentUser((prevUser) => {
      // Se não houver usuário logado, não faz nada (retorna null)
      if (!prevUser) return null;
      // Retorna um novo objeto de usuário com o histórico atualizado (concatena o novo pedido)
      const next = {
        ...prevUser,
        historico: [...prevUser.historico, order],
      };
      try {
        localStorage.setItem("currentUser", JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  // ========== Sessão expirada ==========
  // Desloga, leva para a tela de login do perfil e avisa o usuário. O AuthProvider
  // fica fora do HashRouter, por isso a navegação é pelo hash da URL.
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const expiringRef = useRef(false);

  const expireSession = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user || expiringRef.current) return;
    expiringRef.current = true;
    try {
      const loginPath = getLoginPathForRole(user.role);
      await logout();
      // Espera o React redesenhar sem usuário: as rotas protegidas redirecionam
      // sozinhas para /admin/login, e o login certo do perfil precisa vir depois.
      await new Promise((resolve) => setTimeout(resolve, 50));
      window.location.hash = `#${loginPath}`;
      await Swal.fire({
        icon: "warning",
        title: "Sessão expirada",
        text: "Por segurança, sua sessão expirou. Faça login novamente para continuar.",
        confirmButtonText: "Fazer login",
        allowOutsideClick: false,
      });
    } finally {
      expiringRef.current = false;
    }
    // logout só mexe em estado/localStorage; não depende de props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 401 de qualquer chamada à API (token vencido ou acesso revogado)
  useEffect(() => {
    const onExpired = () => {
      expireSession();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [expireSession]);

  // Desloga sozinho no instante em que o token vence, sem esperar uma chamada falhar
  useEffect(() => {
    if (!currentUser) return;
    const isCustomer = !currentUser.role || currentUser.role === "customer";
    const usesStaffToken = TOKEN_ROLES.includes(currentUser.role || "");
    if (!isCustomer && !usesStaffToken) return;

    const token = usesStaffToken ? getToken() : getCustomerToken();
    if (!token) {
      // Admin/cozinha/operador sem token já perdeu o acesso: pede login de novo.
      // Cliente sem token (sessão antiga) continua navegando normalmente.
      if (usesStaffToken) expireSession();
      return;
    }
    const expiresAt = getTokenExpiry(token);
    if (!expiresAt) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      if (Date.now() >= expiresAt) {
        expireSession();
        return true;
      }
      return false;
    };
    const schedule = () => {
      if (check()) return;
      timer = setTimeout(schedule, Math.min(expiresAt - Date.now(), MAX_TIMEOUT_MS));
    };
    schedule();

    // Com a tela bloqueada ou a aba em segundo plano o timer pode atrasar:
    // confere de novo quando o usuário volta para o app.
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [currentUser, expireSession]);

  // Admin cadastrado (login por CPF): busca as abas liberadas no servidor, para que
  // mudanças de acesso feitas por outro admin valham sem sair e entrar de novo.
  // Acesso revogado (desativado/excluído) desloga na hora.
  const isRestrictedAdmin =
    currentUser?.role === "admin" && Array.isArray(currentUser.permissions);
  const refreshAdminAccess = useCallback(async () => {
    if (!isRestrictedAdmin) return;
    try {
      const access = await getMyAdminAccess();
      if (access.master || !("name" in access)) return;
      const { name, permissions } = access;
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, name, permissions };
        try {
          localStorage.setItem("currentUser", JSON.stringify(next));
        } catch (e) {
          // ignore
        }
        return next;
      });
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await expireSession();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestrictedAdmin]);

  useEffect(() => {
    refreshAdminAccess();
  }, [refreshAdminAccess]);

  // Providencia os valores/funções do contexto para os componentes filhos
  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, addOrderToHistory, refreshAdminAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para consumir o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // Garante que o hook seja usado dentro de um AuthProvider; caso contrário lança erro
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
