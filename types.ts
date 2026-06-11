/**
 * Representa um produto disponivel no catalogo.
 *
 * @interface Product
 *
 * @property {string} id - O identificador único do produto.
 * @property {string} name - O nome do produto.
 * @property {string} description - Uma descrição detalhada do produto.
 * @property {number} price - O preço do produto em moeda local.
 * @property {string} category - A categoria do produto.
 * @property {string} imageUrl - A URL principal da imagem do produto.
 * @property {string[]} images - Lista de URLs de imagens do produto.
 * @property {string} videoUrl - A URL do vídeo do produto.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  priceRaw: number; // Custo unitario
  category: string;
  imageUrl?: string;
  images?: string[];
  videoUrl: string;
  popular?: boolean;
  stock?: number;
  minStock?: number; // Estoque mínimo
  quantidadeVenda?: number; // Quantidade mínima de venda
  active?: boolean; // Produto ativo ou inativo
}

export interface OrderItem {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  originalUnitPrice?: number | null;
  customUnitPrice?: number | null;
  discountPercent?: number | null;
  projectQuoteId?: string;
  projectFileName?: string;
  projectSize?: string;
  projectHeight?: string;
  projectWidth?: string;
  projectDepth?: string;
  projectColorQuantity?: string;
  projectColors?: string;
  projectPieceQuantity?: string;
  projectShippingData?: string;
  projectDeliveryDeadline?: string;
  projectAdminObservation?: string | null;
  projectHasFile?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  /** Nome do usuário que realizou o pedido (duplicado para histórico rápido) */
  userName?: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
  status: "active" | "completed";
  observation?: string;
  // Novos campos para pagamento
  paymentType?: "online" | "presencial" | "orcamento";
  paymentMethod?: "credit" | "debit" | "pix";
  installments?: number;
  fee?: number;
  paymentStatus?: "pending" | "paid" | "authorized" | "canceled";
  entregueCliente?: boolean; // Indica se o pedido foi entregue ao cliente
  projectQuote?: ProjectQuote;
}

export type UserRole =
  | "customer"
  | "kitchen"
  | "admin"
  | "admincustomer";

export interface User {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  historico: Order[];
  pontos?: number;
  role?: UserRole; // Tipo de usuário: customer (padrão), kitchen ou admin
}

export interface CartItem extends Product {
  quantity: number;
  originalUnitPrice?: number;
  customUnitPrice?: number;
  discountPercent?: number;
}

export interface ProjectQuote {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string | null;
  customerPhone?: string | null;
  fileName: string;
  fileSize: number;
  hasFile?: boolean;
  projectLink?: string | null;
  size: string;
  height: string;
  width: string;
  depth: string;
  colorQuantity: string;
  colors: string;
  pieceQuantity: string;
  shippingData: string;
  status: "pending" | "sent" | "approved" | "rejected";
  quotedTotal?: number | null;
  adminObservation?: string | null;
  deliveryDeadline?: string | null;
  orderId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectSavedFile {
  id: string;
  sourceQuoteId?: string | null;
  fileName: string;
  fileSize: number;
  note?: string | null;
  createdAt: string;
}

