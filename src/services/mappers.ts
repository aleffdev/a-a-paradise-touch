import type { Order, OrderItem, OrderStatus, OrderType, PaymentMethod, Product } from "@/types/domain";

interface RawOrder {
  id: string;
  order_number: number;
  customer_name: string;
  order_type: string;
  items: unknown;
  total: number | string;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  ready_at: string | null;
}

export function mapOrder(raw: RawOrder): Order {
  const status = (raw.status === "recebido" ? "aguardando_pagamento" : raw.status) as OrderStatus;
  const items = Array.isArray(raw.items) ? (raw.items as OrderItem[]) : [];
  return {
    id: raw.id,
    orderNumber: raw.order_number,
    customerName: raw.customer_name || "Cliente",
    orderType: (raw.order_type as OrderType) ?? "local",
    items,
    total: Number(raw.total),
    status,
    paymentMethod: (raw.payment_method as PaymentMethod | null) ?? null,
    notes: raw.notes,
    createdAt: raw.created_at,
    paidAt: raw.paid_at,
    readyAt: raw.ready_at,
  };
}

interface RawProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number | string;
  image: string | null;
  emoji: string;
  flavors: string[] | null;
  available: boolean;
}

export function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    description: raw.description,
    price: Number(raw.price),
    image: raw.image,
    emoji: raw.emoji ?? "🍦",
    flavors: raw.flavors ?? [],
    available: !!raw.available,
  };
}
