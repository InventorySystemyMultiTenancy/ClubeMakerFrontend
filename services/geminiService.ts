import type { Order, CartItem, Product } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Gera uma sugestão de compra personalizada baseada no histórico e carrinho.
 */
export const getMenuSuggestion = async (
  userHistory: Order[],
  cartItems: CartItem[],
  menu: Product[],
  userName?: string,
): Promise<string> => {
  const clientName = userName || "amigo(a)";

  // Analisa o que está no carrinho
  const cartDetails = cartItems
    .map((item) => `${item.quantity}x ${item.name} (${item.category})`)
    .join(", ");

  const categoriesInCart = new Set(cartItems.map((i) => i.category));
  const hasMainItem = cartItems.length > 0;
  const hasMultipleCategories = categoriesInCart.size > 1;

  // Monta contexto inteligente
  let contexto = "";
  if (cartItems.length === 0) {
    contexto = "O carrinho esta vazio. Sugira um produto popular para comecar.";
  } else if (hasMainItem && !hasMultipleCategories) {
    contexto =
      "Ha itens no carrinho. Sugira um produto do catalogo que combine bem.";
  } else if (hasMainItem && cartItems.length < 3) {
    contexto =
      "Ha itens principais no carrinho. Sugira um produto extra do catalogo para completar a compra.";
  } else if (!hasMainItem) {
    contexto = "So ha complemento no carrinho. Sugira um produto principal para acompanhar.";
  } else {
    contexto =
      "O carrinho esta completo. Elogie a escolha e sugira adicionar mais uma unidade ou experimentar outro produto.";
  }

  const prompt = `
Voce e um atendente do ClubsMaker. Fale diretamente com ${clientName} de forma calorosa, simpatica e profissional.

Catálogo atual do site: ${menu.map((p) => `${p.name} (R$ ${Number(p.price).toFixed(2)})`).join(", ")}

Carrinho atual: ${cartDetails || "vazio"}

${contexto}

Regras:
- Use o nome ${clientName} na mensagem
- Recomende apenas produtos do catálogo acima, com os valores reais do site
- Não ofereça descontos nem mencione promoções
- Seja específico sobre O QUE recomendar (nome do produto do catálogo)
- Dê um motivo convincente (ex: "é um dos mais procurados", "combina com o que já escolheu", "ótima opção para presentear", etc)
- Máximo 25 palavras
- Tom brasileiro, caloroso, simpático e profissional

Exemplo: "${clientName}, que tal levar o ${menu[0]?.name}? Ele e um dos favoritos do ClubsMaker!"
  `;

  try {
    const response = await fetch(`${API_URL}/api/ai/suggestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Erro na API:", response.status, errorData);
      throw new Error("Erro na requisição");
    }

    const data = await response.json();
    return (
      data.text || "Experimente um dos itens favoritos do ClubsMaker!"
    );
  } catch (error) {
    console.error("Erro ao obter sugestão:", error);
    return "Que tal escolher um produto do catalogo hoje?";
  }
};

/**
 * Gera sugestões dinâmicas ("Que tal levar também...?") baseadas no que já está no carrinho.
 */
export const getDynamicCartSuggestion = async (
  cartItems: CartItem[],
  menu: Product[],
  userName?: string,
): Promise<string> => {
  if (cartItems.length === 0) return "";

  const clientName = userName || "amigo(a)";
  const cartNames = cartItems
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(", ");

  // Analisa categorias e produtos específicos
  const categoriesInCart = new Set(cartItems.map((i) => i.category));
  const productNames = cartItems.map((i) => i.name.toLowerCase());

  let sugestao = "";
  let motivo = "";

  if (categoriesInCart.size <= 1) {
    sugestao = "um produto de outra categoria";
    motivo = "para complementar sua escolha";
  } else if (cartItems.length < 3) {
    sugestao = "um produto extra do catalogo";
    motivo = "para completar a compra";
  } else if (categoriesInCart.size === 1) {
    sugestao = "mais uma unidade do que você já escolheu";
    motivo = "aproveitar a mesma escolha";
  } else {
    sugestao = "outro sabor para experimentar";
    motivo = "variar o sabor";
  }

  const prompt = `
Voce e um atendente do ClubsMaker falando com ${clientName}.

Catálogo atual do site: ${menu.map((p) => `${p.name} (R$ ${Number(p.price).toFixed(2)})`).join(", ")}

Carrinho: ${cartNames}

Sugira adicionar: ${sugestao} (apenas produtos do catálogo acima)
Motivo: ${motivo}

Crie uma frase curta (máximo 20 palavras), chamando ${clientName} pelo nome, de forma simpática e profissional. Não ofereça descontos nem promoções.

Exemplo: "${clientName}, que tal levar tambem o ${menu[0]?.name}? E uma otima escolha para o clube!"
  `;

  try {
    const response = await fetch(`${API_URL}/api/ai/suggestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    return data.text || "";
  } catch (error) {
    return "";
  }
};

/**
 * Gera uma mensagem de boas-vindas ou agradecimento do atendente virtual.
 */
export const getChefMessage = async (
  userHistory: Order[],
  userName?: string,
  menu?: Product[],
): Promise<string> => {
  const clientName = userName || "amigo(a)";
  const isNewCustomer = !userHistory || userHistory.length === 0;
  const orderCount = userHistory?.length || 0;

  const prompt = `
Voce e um atendente do ClubsMaker.

Catálogo atual do site: ${menu?.map((p) => `${p.name} (R$ ${Number(p.price).toFixed(2)})`).join(", ")}

Cliente: ${clientName}
Status: ${
    isNewCustomer
      ? "Cliente novo, primeira visita"
      : `Cliente fiel com ${orderCount} pedidos anteriores`
  }

Crie uma mensagem calorosa e pessoal (máximo 25 palavras):
- Use o nome ${clientName}
- Se for novo: dê boas-vindas entusiasmadas
- Se for recorrente: agradeça a fidelidade e demonstre alegria em vê-lo(a) novamente
- Recomende um produto do catálogo acima, sem oferecer descontos
- Tom brasileiro, caloroso, simpático e profissional

Exemplo novo: "Ola ${clientName}! Seja muito bem-vindo(a)! Temos itens como o ${menu?.[0]?.name} esperando por voce!"
Exemplo recorrente: "${clientName}, que alegria ter voce aqui de novo! O ${menu?.[0]?.name} e sempre um sucesso!"
  `;

  try {
    const response = await fetch(`${API_URL}/api/ai/suggestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    return (
      data.text ||
      `Ola ${clientName}, o ClubsMaker preparou tudo com carinho para voce!`
    );
  } catch (error) {
    return `Ola ${clientName}, seja bem-vindo ao ClubsMaker!`;
  }
};

/**
 * Inicia a sessão de chat (neste modelo stateless, é apenas para log/placeholder).
 */
export const startChat = () => {
  console.log("Sessão de chat inicializada (gerenciada pelo backend).");
};

/**
 * Envia mensagem do usuário para o Chatbot e retorna a resposta.
 */
export const sendMessageToChatbot = async (
  message: string,
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error("Erro no chat");

    const data = await response.json();
    return data.text || "Desculpe, não entendi. Pode repetir?";
  } catch (error) {
    console.error("Erro no chatbot:", error);
    return "Estou com dificuldade de conexão no momento. Tente novamente mais tarde.";
  }
};
