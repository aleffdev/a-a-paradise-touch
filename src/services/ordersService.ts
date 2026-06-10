/**
 * Serviço REST-like de pedidos.
 *
 * Hoje delega para Supabase. Para migrar a PHP+MySQL, basta habilitar
 * USE_REST_API em src/services/apiClient.ts — cada função já tem o bloco
 * REST correspondente comentado abaixo, alinhado com os endpoints sugeridos:
 *
 *   GET    /orders                  -> list(filters)
 *   GET    /orders/:id              -> getById
 *   POST   /orders                  -> create
 *   PUT    /orders/:id/payment      -> confirmPayment
 *   PUT    /orders/:id/start        -> startPreparation
 *   PUT    /orders/:id/ready        -> markReady
 */

import { supabase } from "@/integrations/supabase/client";
import { USE_REST_API, restFetch } from "./apiClient";
import { mapOrder } from "./mappers";
import type {
  Order,
  NewOrderInput,
  OrderFilters,
  PaymentMethod,
} from "@/types/domain";
import { PAID_STATUSES } from "@/types/domain";

const SELECT = "id, order_number, customer_name, order_type, items, total, status, payment_method, notes, created_at, paid_at, ready_at";

export const ordersService = {
  async list(filters: OrderFilters = {}): Promise<Order[]> {
    if (USE_REST_API) {
      return restFetch<Order[]>(`/orders?${new URLSearchParams(filters as Record<string, string>).toString()}`);
    }
    let q = supabase.from("orders").select(SELECT).order("created_at", { ascending: false }).limit(500);
    if (filters.status?.length) q = q.in("status", filters.status);
    if (filters.paymentMethod) q = q.eq("payment_method", filters.paymentMethod);
    if (filters.startDate) q = q.gte("created_at", filters.startDate);
    if (filters.endDate) q = q.lte("created_at", `${filters.endDate}T23:59:59`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapOrder);
  },

  async getById(id: string): Promise<Order | null> {
    if (USE_REST_API) return restFetch<Order>(`/orders/${id}`);
    const { data, error } = await supabase.from("orders").select(SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapOrder(data) : null;
  },

  async create(input: NewOrderInput): Promise<Order> {
    if (USE_REST_API) {
      return restFetch<Order>("/orders", { method: "POST", body: JSON.stringify(input) });
    }
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: input.customerName,
        order_type: input.orderType,
        items: input.items as never,
        total: input.total,
        notes: input.notes ?? null,
        status: "aguardando_pagamento",
      })
      .select(SELECT)
      .single();
    if (error) throw error;
    return mapOrder(data);
  },

  async confirmPayment(id: string, method: PaymentMethod): Promise<void> {
    if (USE_REST_API) {
      await restFetch(`/orders/${id}/payment`, { method: "PUT", body: JSON.stringify({ method }) });
      return;
    }
    const { error } = await supabase
      .from("orders")
      .update({ status: "pago", payment_method: method, paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async startPreparation(id: string): Promise<void> {
    if (USE_REST_API) { await restFetch(`/orders/${id}/start`, { method: "PUT" }); return; }
    const { error } = await supabase.from("orders").update({ status: "em_preparo" }).eq("id", id);
    if (error) throw error;
  },

  async markReady(id: string): Promise<void> {
    if (USE_REST_API) { await restFetch(`/orders/${id}/ready`, { method: "PUT" }); return; }
    const { error } = await supabase
      .from("orders")
      .update({ status: "pronto", ready_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  listPending(): Promise<Order[]> {
    return this.list({ status: ["aguardando_pagamento"] });
  },

  listKitchen(): Promise<Order[]> {
    return this.list({ status: ["pago", "em_preparo", "pronto"] });
  },

  listHistory(filters: Omit<OrderFilters, "status"> = {}): Promise<Order[]> {
    return this.list({ ...filters, status: PAID_STATUSES });
  },

  /** Assina mudanças em tempo real. Hoje via Supabase Realtime; amanhã pode virar polling. */
  subscribe(onChange: () => void): () => void {
    if (USE_REST_API) {
      const t = window.setInterval(onChange, 5000);
      return () => window.clearInterval(t);
    }
    const channel = supabase
      .channel(`orders_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => onChange())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
};
