import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import {
  getMenuSuggestion,
  getDynamicCartSuggestion,
  getChefMessage,
} from "../services/geminiService";
import { getProducts } from "../services/apiService";
import type { Product, CartItem } from "../types";

// URL da API
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

type IconName =
  | "bear"
  | "box"
  | "rocket"
  | "cart"
  | "bag"
  | "lock"
  | "plus"
  | "minus"
  | "close";

const iconPaths: Record<IconName, string> = {
  bear: "M8 8a2 2 0 1 1-3-1.7 6 6 0 0 1 14 0A2 2 0 1 1 16 8m-8 1h8a4 4 0 0 1 4 4v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2a4 4 0 0 1 4-4Zm2 5h.01M14 14h.01M11 17h2",
  box: "M4 7.5 12 3l8 4.5-8 4.5-8-4.5Zm0 0V16l8 5m0-9v9m0-9 8-4.5V16l-8 5",
  rocket:
    "M13 4c3.5.4 5.8 2.7 6.2 6.2L15 14.4 9.6 9 13 4Zm-4.8 7.2-2.7 1.1L3 18l5.7-2.5 1.1-2.7m3.2 4.2 3.5 3.5 1.1-4.9M7 11 3.5 7.5 8.4 6.4M15 9h.01",
  cart: "M4 5h2l1.2 9.2a2 2 0 0 0 2 1.8h6.9a2 2 0 0 0 1.9-1.4L20 8H7M10 20h.01M17 20h.01",
  bag: "M6 8h12l-1 12H7L6 8Zm3 0a3 3 0 0 1 6 0",
  lock: "M7 11V8a5 5 0 0 1 10 0v3m-11 0h12v10H6V11Zm6 4v2",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
};

const LineIcon: React.FC<{
  name: IconName;
  className?: string;
  strokeWidth?: number;
}> = ({ name, className = "h-5 w-5", strokeWidth = 1.9 }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={iconPaths[name]} />
  </svg>
);

// ==========================================
// 1. COMPONENTE: PRODUCT CARD (Produtos maiores)
// ==========================================
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  quantityInCart?: number;
  onOpenImage: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  quantityInCart = 0,
  onOpenImage,
}) => {
  // Lógica ajustada: Se for null é ilimitado. Se for 0 é esgotado.
  const isOutOfStock = product.stock === 0;
  const primaryImage = product.images?.[0] || product.imageUrl;
  const compareAtPrice =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : null;
  const discount = compareAtPrice
    ? Math.max(
        0,
        Math.round(((compareAtPrice - product.price) / compareAtPrice) * 100),
      )
    : 0;

  return (
    <div
      className={`energy-card group relative flex h-full min-h-[420px] w-full max-w-[300px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isOutOfStock ? "opacity-60 grayscale" : ""
      }`}
    >
      {/* Badges - Apenas ESGOTADO agora */}
      {isOutOfStock && (
        <div className="absolute right-3 top-3 z-10 bg-red-600 px-3 py-1 text-sm font-bold text-white shadow-sm">
          ESGOTADO
        </div>
      )}

      {/* Mídia (Imagem ou Vídeo) */}
      <div className="relative h-56 bg-gray-100 md:h-60">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full cursor-zoom-in object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onClick={() => onOpenImage(product)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-blue-200/70">
            <LineIcon name="box" className="h-16 w-16" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-grow flex-col justify-between border-t border-stone-100 bg-white p-4">
        <div className="px-1 py-1">
          <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-gray-800">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-black text-stone-800">
              R$ {product.price.toFixed(2)}
            </span>
            {compareAtPrice && (
              <>
                <span className="text-sm font-semibold text-slate-400 line-through">
                  R$ {compareAtPrice.toFixed(2)}
                </span>
                <span className="rounded bg-red-100 px-2 py-1 text-xs font-black text-red-700">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>
            {product.quantidadeVenda && product.quantidadeVenda > 1 && (
              <span className="text-xs font-semibold text-stone-500">
                Mínimo: {product.quantidadeVenda} por compra
              </span>
            )}
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`energy-cta inline-flex min-h-12 w-full items-center justify-center rounded-lg px-4 py-3 text-base font-bold transition ${
                isOutOfStock
                  ? "cursor-not-allowed bg-stone-300 text-stone-500"
                  : "bg-blue-600 text-white shadow-sm hover:bg-red-600 active:scale-[0.98]"
              }`}
            >
              {quantityInCart > 0
                ? `Adicionado (${quantityInCart})`
                : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
  );
};

// ==========================================
// 2. COMPONENTE: CART SIDEBAR (Letras e Botões Grandes + Observação)
// ==========================================
interface CartSidebarProps {
  cartItems: CartItem[];
  cartTotal: number;
  updateQuantity: (id: string, q: number) => void;
  updateUnitPrice: (id: string, unitPrice: number) => void;
  updateDiscountPercent: (id: string, discountPercent: number) => void;
  onCheckout: () => void;
  isPlacingOrder: boolean;
  cartSuggestion?: string;
  isMobile?: boolean;
  onClose?: () => void;
  menu: Product[];
  onAddToCart: (product: Product) => void;
  observation: string; // <--- Recebe a observação
  setObservation: (obs: string) => void; // <--- Recebe a função para alterar
  currentUser?: any; // <--- Recebe o usuário atual
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  cartItems,
  cartTotal,
  updateQuantity,
  updateUnitPrice,
  updateDiscountPercent,
  onCheckout,
  isPlacingOrder,
  cartSuggestion,
  isMobile = false,
  onClose,
  menu,
  onAddToCart,
  observation,
  setObservation,
  currentUser,
}) => {
  const [showObservationSaved, setShowObservationSaved] = useState(false);
  const observationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const canEditCartPricing =
    currentUser?.role === "admin" || currentUser?.role === "admincustomer";

  const containerClass = isMobile
    ? "fixed inset-x-0 bottom-0 z-[200] flex max-h-[90vh] translate-y-0 transform flex-col rounded-t-3xl border-t border-stone-200 bg-white shadow-[0_-10px_60px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out"
    : "flex h-full flex-col overflow-hidden border-l border-stone-200 bg-white shadow-xl";

  // Lógica para encontrar o produto sugerido
  const suggestedProduct = useMemo(() => {
    if (!cartSuggestion || !menu) return null;

    console.log("🔍 [CART SUGGESTION] Buscando produto:", {
      suggestion: cartSuggestion,
      menuLength: menu.length,
    });

    const found = menu.find(
      (p) =>
        cartSuggestion.toLowerCase().includes(p.name.toLowerCase()) ||
        (p.name.toLowerCase().includes("coca") &&
          cartSuggestion.toLowerCase().includes("coca")),
    );

    if (found) {
      console.log("✅ [CART SUGGESTION] Produto encontrado:", {
        name: found.name,
        id: found.id,
      });
    } else {
      console.warn("⚠️ [CART SUGGESTION] Produto não encontrado no menu local");
    }

    return found;
  }, [cartSuggestion, menu]);

  const handleObservationChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setObservation(e.target.value);
    setShowObservationSaved(true);

    if (observationTimeoutRef.current) {
      clearTimeout(observationTimeoutRef.current);
    }

    observationTimeoutRef.current = setTimeout(() => {
      setShowObservationSaved(false);
    }, 2000); // Oculta a mensagem após 2 segundos
  };
  return (
    <div className={containerClass}>
      {/* Header do Carrinho */}
      <div
        className={`p-5 flex items-center justify-between ${
          isMobile
            ? "bg-stone-900 text-white rounded-t-3xl"
            : "bg-white border-b border-stone-100"
        }`}
      >
        <h2
          className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${
            isMobile ? "text-white" : "text-gray-800"
          }`}
        >
          <LineIcon name="cart" className="h-7 w-7 text-blue-600" /> Minha Cesta (
          {cartItems.reduce((acc, i) => acc + i.quantity, 0)})
        </h2>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 p-2 text-stone-300 transition hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lista de Itens com Scroll */}
      <div
        className={`min-h-0 flex-1 space-y-4 bg-stone-50 p-4 ${
          cartItems.length === 0
            ? "overflow-hidden"
            : "neon-scrollbar overflow-y-auto"
        }`}
        style={isMobile ? { paddingBottom: 60 } : {}}
      >
        {cartItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-stone-400">
            <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-400">
              <LineIcon name="bag" className="h-16 w-16" />
            </div>
            <p className="text-base font-medium">Seu carrinho esta vazio.</p>
          </div>
        ) : (
          <>
            {/* ITENS DO CARRINHO (BOTÕES GRANDES) */}
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="mb-1 flex items-start gap-2">
                      <p className="text-base font-bold leading-tight text-stone-800 md:text-lg">
                        {item.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 0)}
                        className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-red-400/25 bg-red-500/10 text-red-200 transition hover:border-red-300 hover:bg-red-500/20 hover:text-white"
                        aria-label={`Remover ${item.name} do carrinho`}
                        title="Remover do carrinho"
                      >
                        <LineIcon name="close" className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-blue-600 md:text-base">
                      R$ {item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-1 flex h-10 items-center overflow-hidden rounded-lg border border-stone-300 bg-stone-100 shadow-inner md:h-11">
                    <button
                      onClick={() => {
                        const step = item.quantidadeVenda ?? 1;
                        updateQuantity(item.id, item.quantity - step);
                      }}
                      className="flex h-full w-9 items-center justify-center text-xl font-bold text-slate-300 transition-colors hover:bg-cyan-400/10 hover:text-cyan-300 md:w-10"
                    >
                      -
                    </button>
                    {currentUser?.role === "admincustomer" ? (
                      <input
                        type="number"
                        min={1}
                        max={item.stock ?? 99}
                        value={item.quantity}
                        onChange={(e) => {
                          const q = parseInt(e.target.value);
                          if (!isNaN(q) && q > 0) updateQuantity(item.id, q);
                        }}
                        className="h-full w-12 border-x border-stone-300 bg-white text-center text-base font-bold text-stone-800 md:w-14 md:text-lg"
                      />
                    ) : (
                      <span className="flex h-full w-9 items-center justify-center border-x border-stone-300 bg-white text-base font-bold text-stone-800 md:w-10 md:text-lg">
                        {item.quantity}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        const step = item.quantidadeVenda ?? 1;
                        updateQuantity(item.id, item.quantity + step);
                      }}
                      className="flex h-full w-9 items-center justify-center bg-blue-600 text-xl font-bold text-white transition-colors hover:bg-blue-700 md:w-10"
                    >
                      +
                    </button>
                  </div>
                </div>
                {canEditCartPricing && (
                  <div className="grid grid-cols-2 gap-2 border-t border-stone-200 pt-3">
                    <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
                      Valor unit.
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.customUnitPrice ?? item.price}
                        onChange={(e) =>
                          updateUnitPrice(item.id, Number(e.target.value))
                        }
                        className="mt-1 w-full rounded-md border border-stone-200 bg-white px-2 py-2 text-sm font-bold text-stone-800 outline-none focus:border-blue-400"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
                      Desconto %
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discountPercent ?? 0}
                        onChange={(e) =>
                          updateDiscountPercent(item.id, Number(e.target.value))
                        }
                        className="mt-1 w-full rounded-md border border-stone-200 bg-white px-2 py-2 text-sm font-bold text-stone-800 outline-none focus:border-blue-400"
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer / Checkout */}
      {cartItems.length > 0 && (
        <div className="border-t border-stone-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          {/* CAMPO DE OBSERVAÇÃO - AGORA CONECTADO AO CONTEXTO */}
          <div className="mb-4">
            <label
              htmlFor="observation"
              className="mb-2 block text-base font-bold text-stone-800"
            >
              📝 Alguma observação?
            </label>
            <textarea
              id="observation"
              value={observation}
              onChange={handleObservationChange}
              placeholder="Ex: Em caixa, em sacos..."
              className="w-full rounded-lg border border-stone-200 bg-white p-2 text-sm text-stone-800 placeholder:text-stone-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
              rows={2}
            />
            {showObservationSaved && observation && (
              <p className="text-xs text-[var(--color-success)] font-bold mt-1 animate-pulse">
                ✓ Observação salva!
              </p>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-slate-400">Total</span>
            <span className="text-2xl font-bold text-stone-900 md:text-3xl">
              R$ {cartTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onCheckout}
            disabled={isPlacingOrder}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-lg font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:bg-stone-300 disabled:text-stone-500 md:py-4 md:text-xl"
          >
            {isPlacingOrder ? (
              "Processando..."
            ) : (
              <>
                <span>Finalizar Compra</span>
                <span className="text-3xl">➜</span>
              </>
            )}
          </button>
        </div>
      )}
      {cartItems.length === 0 && (
        <div className="border-t border-cyan-300/20 bg-[#050914] p-4 shadow-[0_-4px_20px_rgba(0,229,255,0.1)]">
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-800 py-4 text-lg font-black text-slate-500"
          >
            <LineIcon name="lock" className="h-5 w-5" />
            Finalizar Compra
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. COMPONENTE: CATEGORY SIDEBAR
// ==========================================
interface CategorySidebarProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  dynamicCategories?: Array<{ name: string; icon: string; order: number }>; // 🆕
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  dynamicCategories = [], // 🆕
}) => {
  // 🆕 Helper para pegar ícone dinâmico ou fallback
  const getCategoryIcon = (categoryName: string): string => {
    const dynamicCat = dynamicCategories.find((dc) => dc.name === categoryName);
    if (dynamicCat) return dynamicCat.icon;

    // Fallback para icones automaticos baseados em nome - Tema ClubsMaker
    const lowerCat = categoryName.toLowerCase();
    if (lowerCat.includes("plano") || lowerCat.includes("assinatura")) return "$";
    if (lowerCat.includes("evento") || lowerCat.includes("agenda")) return "@";
    if (lowerCat.includes("kit") || lowerCat.includes("produto")) return "#";
    if (lowerCat.includes("acessorio")) return "+";
    if (lowerCat.includes("especial")) return "*";
    return "CM";
  };

  return (
    <aside className="z-40 flex h-full w-[112px] shrink-0 flex-col overflow-hidden border-r border-stone-200 bg-white shadow-xl md:w-48">
      {/* Logo Area */}
      <div className="hidden h-16 items-center justify-center border-b border-stone-100 bg-blue-700 md:flex">
        <a
          href="#/criar-projeto"
          className="energy-cta rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-black uppercase tracking-wide text-white shadow-md transition hover:bg-blue-700"
          title="Criar projeto"
        >
          Criar projeto
        </a>
      </div>

      {/* Menu Items Container */}
      <nav className="neon-scrollbar flex-1 space-y-2 overflow-y-auto py-3 pb-6">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex w-full flex-col items-center gap-2 border-l-4 px-2 py-4 text-center transition-all duration-200 md:px-6 ${
            selectedCategory === null
              ? "energy-active border-blue-600 bg-blue-50 text-blue-800"
              : "border-transparent text-stone-400 hover:bg-stone-50 hover:text-stone-600"
          }`}
        >
          <span
            className={`text-3xl ${
              selectedCategory === null ? "scale-110" : "grayscale opacity-70"
            }`}
          >
            🧸
          </span>
          <span className="text-xs font-black uppercase tracking-wide md:text-base">
            Todos
          </span>
        </button>

        <div className="mx-4 my-4 border-t border-stone-100"></div>

        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          const icon = getCategoryIcon(category); // 🆕 Usa ícone dinâmico

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`flex w-full flex-col items-center gap-2 border-l-4 px-2 py-4 text-center transition-all duration-200 md:px-6 ${
                isSelected
                  ? "energy-active border-blue-600 bg-blue-50 text-blue-800"
                  : "border-transparent text-stone-400 hover:bg-stone-50 hover:text-stone-600"
              }`}
            >
              <span
                className={`text-3xl transition-transform ${
                  isSelected ? "scale-110" : "grayscale opacity-70"
                }`}
              >
                {icon}
              </span>
              <span
                className={`text-xs font-black uppercase leading-tight tracking-wide md:text-base`}
              >
                {category}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

// ==========================================
// 4. COMPONENTE PRINCIPAL: PAGE LAYOUT
// ==========================================

const MenuPage: React.FC = () => {
  const [menu, setMenu] = useState<Product[]>([]);
  const [suggestion, setSuggestion] = useState<string>("");
  const [cartSuggestion, setCartSuggestion] = useState<string>("");
  const [chefMessage, setChefMessage] = useState<string>("");
  const [isChefLoading, setIsChefLoading] = useState<boolean>(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isCatalogNavOpen, setIsCatalogNavOpen] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    images: string[];
    currentIndex: number;
    productName: string;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    productName: "",
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // 🆕 Estado para categorias dinâmicas
  const [dynamicCategories, setDynamicCategories] = useState<
    Array<{ name: string; icon: string; order: number }>
  >([]);

  const { currentUser } = useAuth();

  // AQUI ESTÁ A MÁGICA: Extraímos observation e setObservation do contexto
  const {
    cartItems,
    addToCart,
    cartTotal,
    updateQuantity,
    updateUnitPrice,
    updateDiscountPercent,
    clearCart,
    observation,
    setObservation,
  } = useCart();
  const touchStartXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const navigate = useNavigate();

  const getProductImages = (product: Product): string[] => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter((url) => typeof url === "string" && url);
    }
    if (product.imageUrl) {
      return [product.imageUrl];
    }
    return [];
  };

  const getCategoryIcon = (categoryName: string): string => {
    const dynamicCat = dynamicCategories.find((dc) => dc.name === categoryName);
    if (dynamicCat) return dynamicCat.icon;
    return "CM";
  };

  const openImageViewer = (product: Product) => {
    const images = getProductImages(product);
    if (images.length === 0) return;
    setIsImageZoomed(false);
    setImageViewer({
      isOpen: true,
      images,
      currentIndex: 0,
      productName: product.name,
    });
  };

  const closeImageViewer = () => {
    setIsImageZoomed(false);
    setImageViewer((prev) => ({ ...prev, isOpen: false }));
  };

  const showNextImage = () => {
    setIsImageZoomed(false);
    setImageViewer((prev) => {
      if (prev.images.length <= 1) return prev;
      return {
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.images.length,
      };
    });
  };

  const showPreviousImage = () => {
    setIsImageZoomed(false);
    setImageViewer((prev) => {
      if (prev.images.length <= 1) return prev;
      return {
        ...prev,
        currentIndex:
          (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
      };
    });
  };

  const handleImageTouchStart = (e: React.TouchEvent<HTMLImageElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    didSwipeRef.current = false;
  };

  const handleImageTouchEnd = (e: React.TouchEvent<HTMLImageElement>) => {
    if (touchStartXRef.current === null) return;

    const touchEndX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = touchEndX - touchStartXRef.current;
    const swipeThreshold = 40;

    if (deltaX <= -swipeThreshold) {
      didSwipeRef.current = true;
      showNextImage();
    } else if (deltaX >= swipeThreshold) {
      didSwipeRef.current = true;
      showPreviousImage();
    }

    touchStartXRef.current = null;
  };

  const handleExpandedImageClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    setIsImageZoomed((prev) => !prev);
  };

  const fetchMenuData = async () => {
    try {
      const data = await getProducts();
      // ✅ Valida se é array antes de setar
      if (Array.isArray(data)) {
        setMenu(data);
      } else {
        console.error(
          "❌ Backend retornou dados inválidos (não é array):",
          data,
        );
        setMenu([]);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar menu:", error);
      setMenu([]); // ✅ Garante array vazio em caso de erro
    }
  };

  // 🆕 Busca categorias do backend
  const fetchCategories = async () => {
    try {
      console.log("🔄 Carregando categorias do backend...");
      const { getCategories } = await import("../services/categoryService");
      const data = await getCategories();
      console.log("📦 Categorias recebidas:", data);

      if (data.length > 0) {
        setDynamicCategories(data);
        console.log(
          `✅ ${data.length} categorias carregadas e setadas no estado`,
        );
      } else {
        console.warn("⚠️ Nenhuma categoria encontrada no backend");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    fetchMenuData();
    fetchCategories(); // 🆕 Carrega categorias
  }, []);

  useEffect(() => {
    const fetchSuggestion = async () => {
      if (currentUser && menu.length > 0) {
        setIsSuggestionLoading(true);
        const newSuggestion = await getMenuSuggestion(
          currentUser.historico,
          cartItems,
          menu,
          currentUser.name,
        );
        setSuggestion(newSuggestion);
        setIsSuggestionLoading(false);
      }
    };
    fetchSuggestion();
  }, [cartItems, currentUser, menu]);

  useEffect(() => {
    const fetchChefMessage = async () => {
      if (menu.length === 0) return;
      setIsChefLoading(true);
      try {
        const msg = await getChefMessage(
          currentUser ? currentUser.historico : [],
          currentUser?.name,
          menu,
        );
        setChefMessage(msg);
      } catch (err) {
        setChefMessage("Bem-vindo!");
      } finally {
        setIsChefLoading(false);
      }
    };
    fetchChefMessage();
  }, [menu, currentUser]);

  useEffect(() => {
    const fetchCartSuggestion = async () => {
      if (menu.length > 0 && cartItems.length > 0) {
        const dynamicSuggestion = await getDynamicCartSuggestion(
          cartItems,
          menu,
          currentUser?.name,
        );
        setCartSuggestion(dynamicSuggestion);
      } else {
        setCartSuggestion("");
      }
    };
    fetchCartSuggestion();
  }, [cartItems, menu, currentUser]);

  const latestProducts = useMemo(() => {
    return [...menu]
      .filter((product) => getProductImages(product).length > 0)
      .slice(-5)
      .reverse();
  }, [menu]);

  useEffect(() => {
    if (latestProducts.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentBannerIndex((current) => (current + 1) % latestProducts.length);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [latestProducts.length]);

  useEffect(() => {
    if (currentBannerIndex >= latestProducts.length) {
      setCurrentBannerIndex(0);
    }
  }, [currentBannerIndex, latestProducts.length]);

  const handleCheckout = () => {
    if (!currentUser || cartItems.length === 0) return;
    navigate("/payment");
  };

  const categorizedMenu = useMemo(() => {
    // ✅ Proteção: garante que menu é array antes de usar .reduce
    if (!Array.isArray(menu) || menu.length === 0) {
      return {} as Record<string, Product[]>;
    }

    return menu.reduce(
      (acc, product) => {
        const categoryKey = product.category as Product["category"];
        if (!acc[categoryKey]) acc[categoryKey] = [];
        acc[categoryKey].push(product);
        return acc;
      },
      {} as Record<string, Product[]>,
    );
  }, [menu]);

  // 🆕 Usa categorias dinâmicas do backend (com ordem), ou fallback para categorias com produtos
  const displayCategories = useMemo(() => {
    if (dynamicCategories.length > 0) {
      // Ordena pelas categorias do backend (usando campo order)
      return dynamicCategories
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        .map((cat) => cat.name);
    }
    // Fallback: usa categorias dos produtos existentes
    return Object.keys(categorizedMenu).sort();
  }, [dynamicCategories, categorizedMenu]);

  const totalViewerImages = imageViewer.images.length;
  const normalizedViewerIndex =
    totalViewerImages > 0
      ? ((imageViewer.currentIndex % totalViewerImages) + totalViewerImages) %
        totalViewerImages
      : 0;
  const currentBannerProduct =
    latestProducts.length > 0
      ? latestProducts[currentBannerIndex % latestProducts.length]
      : null;
  const currentBannerImage = currentBannerProduct
    ? getProductImages(currentBannerProduct)[0]
    : "";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#050604] font-sans text-stone-800">
      {/* 1. SIDEBAR ESQUERDA */}
      {false && (
      <CategorySidebar
        categories={displayCategories} // 🆕 Usa categorias dinâmicas ordenadas
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        dynamicCategories={dynamicCategories}
      />
      )}

      {/* 2. ÁREA CENTRAL */}
      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#050604] bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.16)_0_1px,transparent_2px),linear-gradient(110deg,rgba(37,99,235,0.05)_0_1px,transparent_1px)] [background-size:160px_160px,56px_56px]">
        <div className="flex justify-center border-b border-blue-500/30 bg-[#071226] px-4 py-5">
          <button
            type="button"
            className="inline-flex min-h-14 items-center gap-4 border border-blue-400 bg-blue-700 px-7 py-3 text-lg font-black uppercase tracking-wide text-white shadow-[7px_7px_0_rgba(0,0,0,0.55)] transition hover:bg-blue-600"
            onClick={() => setIsCatalogNavOpen((open) => !open)}
          >
            Ver catálogo
            <span className="bg-blue-500 px-2 py-0.5 text-white">
              {isCatalogNavOpen ? "-" : "+"}
            </span>
          </button>
        </div>

        {isCatalogNavOpen && (
          <nav className="flex gap-2 overflow-x-auto border-b border-blue-500/20 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold transition ${
                selectedCategory === null
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-stone-200 bg-white text-stone-600 hover:border-blue-400 hover:text-blue-700"
              }`}
            >
              Todos
            </button>
            {displayCategories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold transition ${
                  selectedCategory === category
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-stone-200 bg-white text-stone-600 hover:border-blue-400 hover:text-blue-700"
                }`}
              >
                <span className="mr-2">{getCategoryIcon(category)}</span>
                {category}
              </button>
            ))}
          </nav>
        )}
        {/* Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 pb-48 scroll-smooth md:p-8 md:pb-8">
          {/* Mensagens IA */}

          {/* Grid de Produtos */}
          <div className="mx-auto max-w-[1600px]">
            {selectedCategory === null ? (
              <>
                {currentBannerProduct && (
                  <section className="relative mb-10 grid min-h-[360px] overflow-hidden border border-blue-500/40 bg-[#071226] shadow-2xl md:grid-cols-[0.58fr_0.42fr] lg:min-h-[532px]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(96,165,250,0.22)_0_2px,transparent_3px),linear-gradient(105deg,rgba(96,165,250,0.08)_0_1px,transparent_1px)] [background-size:160px_160px,64px_64px]" />
                    <div className="relative z-10 flex flex-col justify-center p-7 text-white md:p-12 lg:p-14">
                      <span className="mb-5 inline-flex w-fit bg-blue-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white shadow-[6px_6px_0_rgba(0,0,0,0.7)]">
                        Novidades!
                      </span>
                      <h2 className="max-w-3xl text-5xl font-black uppercase leading-[0.9] text-white md:text-7xl lg:text-8xl">
                        Últimos lançamentos!
                      </h2>
                      <p className="mt-5 text-2xl font-black uppercase text-blue-200">
                        Produto ClubeMaker
                      </p>
                      <strong className="mt-3 max-w-2xl text-lg font-black text-blue-50 md:text-xl">
                        {currentBannerProduct.name}
                      </strong>
                      <button
                        type="button"
                        onClick={() => openImageViewer(currentBannerProduct)}
                        className="mt-8 w-fit bg-white px-7 py-4 text-base font-black uppercase text-[#071226] shadow-[7px_7px_0_rgba(0,0,0,0.75)] transition hover:bg-blue-100"
                      >
                        Ver detalhes
                      </button>
                    </div>
                    <div className="relative z-10 flex min-h-[300px] items-center justify-center p-7 md:min-h-full md:p-10">
                      <img
                        src={currentBannerImage}
                        alt={currentBannerProduct.name}
                        className="max-h-[72%] w-[76%] max-w-xl rotate-[-2deg] object-contain shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                        loading="eager"
                      />
                    </div>
                    {latestProducts.length > 1 && (
                      <div className="absolute bottom-5 left-7 z-20 flex gap-2 md:left-12 lg:left-14">
                        {latestProducts.map((product, index) => (
                          <button
                            type="button"
                            key={`banner-dot-${product.id}`}
                            aria-label={`Ver novidade ${index + 1}`}
                            onClick={() => setCurrentBannerIndex(index)}
                            className={`h-1.5 transition-all ${
                              index === currentBannerIndex
                                ? "w-14 bg-blue-300"
                                : "w-11 bg-white/30"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
                <h2 className="mb-6 text-4xl font-black uppercase tracking-wide text-white md:text-5xl">
                  Produtos em destaque
                </h2>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {[...menu]
                  .sort((a, b) => {
                    const aOOS = a.stock === 0 ? 1 : 0;
                    const bOOS = b.stock === 0 ? 1 : 0;
                    if (aOOS !== bOOS) return aOOS - bOOS;
                    return a.name.localeCompare(b.name, "pt-BR");
                  })
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      onOpenImage={openImageViewer}
                      quantityInCart={
                        cartItems.find((i) => i.id === product.id)?.quantity ||
                        0
                      }
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="animate-fadeIn">
                <h3 className="mb-6 text-2xl font-black uppercase tracking-wide text-white md:text-3xl">
                  {selectedCategory}
                </h3>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                  {[...(categorizedMenu[selectedCategory] || [])]
                    .sort((a, b) => {
                      const aOOS = a.stock === 0 ? 1 : 0;
                      const bOOS = b.stock === 0 ? 1 : 0;
                      return aOOS - bOOS;
                    })
                    .map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={addToCart}
                        onOpenImage={openImageViewer}
                        quantityInCart={
                          cartItems.find((i) => i.id === product.id)
                            ?.quantity || 0
                        }
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {cartItems.length > 0 && !isMobileCartOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex">
            <div
              className="relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-full border border-white/25 bg-blue-600 text-white shadow-[0_0_36px_rgba(37,99,235,0.55)] transition hover:scale-105"
              onClick={() => setIsMobileCartOpen(true)}
            >
              <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-blue-700">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
              <span className="text-4xl">🛒</span>
              <span className="hidden">
                <span className="min-[900px]:text-2xl">🛒</span> Minha Cesta
                <p>{cartItems.reduce((acc, i) => acc + i.quantity, 0)}</p>
                <span className="text-sm bg-[var(--color-secondary)] text-white px-2 py-1 rounded-full m-2 animate-pulse">
                  ▲ Ver
                </span>
              </span>
              <span className="mt-1 text-[10px] font-black text-yellow-300">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* 4. COLUNA DIREITA (Carrinho Desktop) */}
      {false && (
      <div className="z-20 hidden h-full w-[360px] shadow-2xl xl:block">
        <CartSidebar
          cartItems={cartItems}
          cartTotal={cartTotal}
          updateQuantity={updateQuantity}
          updateUnitPrice={updateUnitPrice}
          updateDiscountPercent={updateDiscountPercent}
          onCheckout={handleCheckout}
          isPlacingOrder={isPlacingOrder}
          cartSuggestion={cartSuggestion}
          menu={menu}
          onAddToCart={addToCart}
          observation={observation}
          setObservation={setObservation}
          currentUser={currentUser}
        />
      </div>
      )}

      {/* 5. DRAWER MOBILE EXPANDIDO */}
      {isMobileCartOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            onClick={() => setIsMobileCartOpen(false)}
          />

          <CartSidebar
            cartItems={cartItems}
            cartTotal={cartTotal}
            updateQuantity={updateQuantity}
            updateUnitPrice={updateUnitPrice}
            updateDiscountPercent={updateDiscountPercent}
            onCheckout={handleCheckout}
            isPlacingOrder={isPlacingOrder}
            cartSuggestion={cartSuggestion}
            isMobile={true}
            onClose={() => setIsMobileCartOpen(false)}
            menu={menu}
            onAddToCart={addToCart}
            observation={observation}
            setObservation={setObservation}
            currentUser={currentUser}
          />
        </>
      )}

      {imageViewer.isOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/75 flex items-center justify-center p-4"
          onClick={closeImageViewer}
        >
          <div
            className="max-w-4xl max-h-[90vh] w-full flex flex-col items-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {imageViewer.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showPreviousImage();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    showPreviousImage();
                  }}
                  aria-label="Imagem anterior"
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/60 text-white text-2xl font-bold hover:bg-black/80 transition"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showNextImage();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    showNextImage();
                  }}
                  aria-label="Próxima imagem"
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/60 text-white text-2xl font-bold hover:bg-black/80 transition"
                >
                  ›
                </button>
              </>
            )}

            <img
              src={imageViewer.images[normalizedViewerIndex]}
              alt={`${imageViewer.productName} - imagem ${normalizedViewerIndex + 1}`}
              className={`max-h-[78vh] w-auto max-w-full object-contain rounded-xl shadow-2xl cursor-pointer transition-transform duration-200 ${
                isImageZoomed ? "scale-150" : "scale-100"
              }`}
              onClick={handleExpandedImageClick}
              onTouchStart={handleImageTouchStart}
              onTouchEnd={handleImageTouchEnd}
            />
            <p className="mt-3 text-white text-sm md:text-base font-medium">
              Toque para dar zoom ({normalizedViewerIndex + 1}/
              {totalViewerImages})
            </p>
            {imageViewer.images.length > 1 && (
              <div className="mt-3 flex items-center gap-2">
                {imageViewer.images.map((_, index) => (
                  <button
                    key={`viewer-dot-${index}`}
                    type="button"
                    onClick={() => {
                      setIsImageZoomed(false);
                      setImageViewer((prev) => ({
                        ...prev,
                        currentIndex: index,
                      }));
                    }}
                    aria-label={`Ver imagem ${index + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition-opacity ${
                      index === normalizedViewerIndex
                        ? "bg-white opacity-100"
                        : "bg-white opacity-40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
