/**
 * Tipos de domínio — independentes de qualquer backend.
 * Os serviços (src/services) convertem do formato cru (Supabase hoje, REST PHP amanhã)
 * para estes tipos. Componentes só conhecem estes tipos.
 */

export type OrderType = "local" | "viagem";

export type OrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "em_preparo"
  | "pronto";

export type PaymentMethod = "dinheiro" | "pix" | "debito" | "credito";

export interface OrderItem {
  productKey: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  emoji?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  orderType: OrderType;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  readyAt: string | null;
}

export interface NewOrderInput {
  customerName: string;
  orderType: OrderType;
  items: OrderItem[];
  total: number;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  image: string | null;
  emoji: string;
  flavors: string[];
  available: boolean;
}

export interface ProductInput {
  name: string;
  category: string;
  description?: string;
  price: number;
  image?: string;
  emoji?: string;
  flavors?: string[];
  available?: boolean;
}

export interface FinancialStats {
  totalRevenue: number;
  ordersCount: number;
  averageTicket: number;
  byMethod: Record<PaymentMethod, { total: number; count: number }>;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export interface OrderFilters {
  status?: OrderStatus[];
  paymentMethod?: PaymentMethod;
  startDate?: string; // ISO yyyy-mm-dd
  endDate?: string;
  search?: string; // nome ou número
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_preparo: "Em preparo",
  pronto: "Pronto para retirada",
};

export const PAID_STATUSES: OrderStatus[] = ["pago", "em_preparo", "pronto"];
