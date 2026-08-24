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
  userId: string | null;
  /** Nome do usuário que realizou o pedido (duplicado para histórico rápido) */
  userName?: string;
  externalBuyerName?: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
  status: "active" | "completed";
  observation?: string;
  // Novos campos para pagamento
  paymentType?:
    | "online"
    | "presencial"
    | "orcamento"
    | "contato"
    | "pedido_feito_por_fora";
  paymentMethod?:
    | "credit"
    | "debit"
    | "pix"
    | "cheque"
    | "boleto"
    | "whatsapp"
    | "pedido_feito_por_fora";
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
  | "admincustomer"
  | "print_operator";

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

// ===== Frota de impressoras 3D =====

export type PrinterStatus = "idle" | "running" | "overdue" | "maintenance" | "offline";

export interface Printer {
  id: number;
  number: number;
  nickname?: string | null;
  brand?: string | null;
  model?: string | null;
  purchase_date?: string | null;
  status: PrinterStatus;
  total_print_count: number;
  total_print_hours: number;
  notes?: string | null;
  created_at?: string;
}

export type MaintenanceLevel = "ok" | "warning" | "critical";

export interface PrinterPart {
  id: number;
  printer_id: number;
  part_type: string;
  lifespan_prints: number;
  installed_at_count: number;
  last_replaced_at?: string | null;
  replacement_cost?: number;
  created_at?: string;
  // presentes apenas na resposta de /print-farm/maintenance-alerts
  printer_number?: number;
  printer_nickname?: string | null;
  printer_total_print_count?: number;
  usage_count?: number;
  usage_ratio?: number;
  level?: MaintenanceLevel;
}

export interface Filament {
  id: number;
  material: string;
  color?: string | null;
  brand?: string | null;
  cost_per_kg: number;
  stock_grams: number;
  created_at?: string;
}

export interface PrintProduct {
  id: number;
  name: string;
  product_id?: string | null;
  size_variant?: string | null;
  units_per_plate: number;
  estimated_time_minutes: number;
  filament_id?: number | null;
  filament_grams_per_plate: number;
  manual_unit_price?: number | null;
  filament_material?: string;
  filament_color?: string;
  filament_cost_per_kg?: number;
}

export type PrintJobStatus = "running" | "overdue" | "completed";

export interface PrintJob {
  id: number;
  printer_id: number;
  print_product_id: number;
  planned_units: number;
  filament_id?: number | null;
  filament_grams_per_plate_snapshot?: number;
  filament_cost_per_kg_snapshot?: number;
  unit_sale_price_snapshot?: number | null;
  started_at: string;
  estimated_end_at: string;
  finished_at?: string | null;
  status: PrintJobStatus;
  success_count?: number | null;
  fail_count?: number | null;
  loss_filament_grams?: number | null;
  loss_cost?: number | null;
  revenue_value?: number | null;
  created_by_role?: string;
  started_by_operator_id?: number | null;
  started_by_operator_name?: string | null;
  finished_by_operator_id?: number | null;
  finished_by_operator_name?: string | null;
  printer_number?: number;
  printer_nickname?: string | null;
  product_name?: string;
}

export interface PrintOperator {
  id: number;
  name: string;
  username: string;
  active: boolean;
  created_at?: string;
}

export interface PrintFarmSummaryRow {
  printer_id: number;
  printer_number: number;
  printer_nickname?: string | null;
  jobs: number;
  success: number;
  fail: number;
  lossCost: number;
  revenue: number;
  onTime: number;
}

export interface PrintFarmOperatorSummaryRow {
  operator_id: number | null;
  operator_name: string;
  jobs: number;
  success: number;
  fail: number;
  lossCost: number;
  revenue: number;
  onTime: number;
}

export interface PrintFarmSummary {
  totals: {
    jobs: number;
    success: number;
    fail: number;
    lossCost: number;
    revenue: number;
    onTime: number;
  };
  byPrinter: PrintFarmSummaryRow[];
  byOperator: PrintFarmOperatorSummaryRow[];
}

