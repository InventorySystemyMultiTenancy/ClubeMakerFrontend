import { useAuth } from "../contexts/AuthContext";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import type { CartItem, Product } from "../types";
import type { User } from "../types";

/*
  Define o formato do contexto do carrinho.
  - cartItems: lista de itens no carrinho
  - addToCart: adiciona um produto (ou incrementa quantidade se já existir)
  - removeFromCart: remove um item pelo id
  - updateQuantity: atualiza a quantidade de um item (se <= 0 remove)
  - clearCart: esvazia o carrinho
  - cartTotal: total calculado do carrinho
*/
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateUnitPrice: (productId: string, unitPrice: number) => void;
  updateDiscountPercent: (productId: string, discountPercent: number) => void;
  clearCart: () => void;
  cartTotal: number;
  observation: string;
  setObservation: (obs: string) => void;
  selectedOrderCustomer: User | null;
  setSelectedOrderCustomer: (user: User | null) => void;
}

// Cria o contexto com tipo opcional (undefined por padrão até o Provider ser usado)
const CartContext = createContext<CartContextType | undefined>(undefined);

/*
  Provider do contexto do carrinho.
  Envolve a árvore de componentes que precisa acessar o carrinho.
  Recebe children como propriedade.
*/
export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 1. Inicialização Inteligente: Tenta ler do LocalStorage primeiro
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem("kiosk_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Erro ao recuperar carrinho:", error);
      return [];
    }
  });

  const [observation, setObservation] = useState<string>(() => {
    try {
      return localStorage.getItem("kiosk_observation") || "";
    } catch (error) {
      console.error("Erro ao recuperar observação:", error);
      return "";
    }
  });

  const [selectedOrderCustomer, setSelectedOrderCustomer] =
    useState<User | null>(() => {
      try {
        const raw = localStorage.getItem("kiosk_selected_order_customer");
        return raw ? (JSON.parse(raw) as User) : null;
      } catch (error) {
        console.error("Erro ao recuperar cliente selecionado:", error);
        return null;
      }
    });

  // 2. Efeito de Persistência: Salva no LocalStorage sempre que o carrinho mudar
  useEffect(() => {
    try {
      localStorage.setItem("kiosk_cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar carrinho:", error);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem("kiosk_observation", observation);
    } catch (error) {
      console.error("Erro ao salvar observação:", error);
    }
  }, [observation]);

  useEffect(() => {
    try {
      if (selectedOrderCustomer) {
        localStorage.setItem(
          "kiosk_selected_order_customer",
          JSON.stringify(selectedOrderCustomer),
        );
      } else {
        localStorage.removeItem("kiosk_selected_order_customer");
      }
    } catch (error) {
      console.error("Erro ao salvar cliente selecionado:", error);
    }
  }, [selectedOrderCustomer]);

  /*
    Adiciona um produto ao carrinho.
    - Se o produto já existir (mesmo id), incrementa a quantidade em 1.
    - Caso contrário, adiciona o produto com quantity = 1.
    Usa a função de atualização baseada no estado anterior para evitar condições de corrida.
  */
  const { currentUser } = useAuth();
  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      const canManageCustomerSale =
        currentUser?.role === "admincustomer" || currentUser?.role === "admin";
      const quantidadeVenda = product.quantidadeVenda ?? 1;
      const addQuantidade = canManageCustomerSale ? 1 : quantidadeVenda;
      if (existingItem) {
        const novaQuantidade = existingItem.quantity + addQuantidade;
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: novaQuantidade } : item,
        );
      }
      return [
        ...prevItems,
        {
          ...product,
          quantity: addQuantidade,
          originalUnitPrice: product.price,
          customUnitPrice: product.price,
          discountPercent: 0,
        },
      ];
    });
  };

  /*
    Remove um item do carrinho pelo productId.
    Filtra os itens mantendo apenas os que não possuem o id informado.
  */
  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId),
    );
  };

  /*
    Atualiza a quantidade de um item.
    - Se a quantidade informada for menor ou igual a zero, remove o item.
    - Caso contrário, mapeia os itens e atualiza a quantidade do item correspondente.
  */
  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => i.id === productId);
      if (!item) return prevItems;
      const canManageCustomerSale =
        currentUser?.role === "admincustomer" || currentUser?.role === "admin";
      const quantidadeVenda = item.quantidadeVenda ?? 1;
      let novaQuantidade = Math.max(quantity, 0);
      if (!canManageCustomerSale && novaQuantidade > 0) {
        novaQuantidade =
          Math.round(novaQuantidade / quantidadeVenda) * quantidadeVenda;
      }
      if (novaQuantidade <= 0) {
        return prevItems.filter((i) => i.id !== productId);
      }
      return prevItems.map((i) =>
        i.id === productId ? { ...i, quantity: novaQuantidade } : i,
      );
    });
  };

  const calculateAdjustedUnitPrice = (
    unitPrice: number,
    discountPercent: number,
  ) => {
    const safeUnitPrice = Math.max(0, Number(unitPrice) || 0);
    const safeDiscount = Math.min(
      100,
      Math.max(0, Number(discountPercent) || 0),
    );
    return Number((safeUnitPrice * (1 - safeDiscount / 100)).toFixed(2));
  };

  const updateUnitPrice = (productId: string, unitPrice: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== productId) return item;
        const discountPercent = item.discountPercent ?? 0;
        return {
          ...item,
          customUnitPrice: Math.max(0, Number(unitPrice) || 0),
          price: calculateAdjustedUnitPrice(unitPrice, discountPercent),
        };
      }),
    );
  };

  const updateDiscountPercent = (
    productId: string,
    discountPercent: number,
  ) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== productId) return item;
        const customUnitPrice = item.customUnitPrice ?? item.price;
        return {
          ...item,
          customUnitPrice,
          discountPercent: Math.min(
            100,
            Math.max(0, Number(discountPercent) || 0),
          ),
          price: calculateAdjustedUnitPrice(customUnitPrice, discountPercent),
        };
      }),
    );
  };

  // Limpa o carrinho, definindo a lista de itens como vazia
  // O useEffect atualizará o localStorage automaticamente
  const clearCart = () => {
    setCartItems([]);
    setObservation("");
    setSelectedOrderCustomer(null);
  };

  // Calcula o total do carrinho somando price * quantity de cada item
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  // Fornece o estado e as funções do carrinho para os componentes filhos
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateUnitPrice,
        updateDiscountPercent,
        clearCart,
        cartTotal,
        observation,
        setObservation,
        selectedOrderCustomer,
        setSelectedOrderCustomer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/*
  Hook customizado para consumir o contexto do carrinho.
  Lança um erro se usado fora do CartProvider, ajudando a detectar uso incorreto.
*/
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
