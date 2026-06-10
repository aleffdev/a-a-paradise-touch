/**
 * Indicadores financeiros calculados a partir de pedidos pagos.
 *
 * Endpoint futuro: GET /financial?start=&end=
 */

import { ordersService } from "./ordersService";
import { USE_REST_API, restFetch } from "./apiClient";
import type { FinancialStats, Order, PaymentMethod } from "@/types/domain";

const METHODS: PaymentMethod[] = ["dinheiro", "pix", "debito", "credito"];

function emptyStats(): FinancialStats {
  return {
    totalRevenue: 0,
    ordersCount: 0,
    averageTicket: 0,
    byMethod: METHODS.reduce((acc, m) => ({ ...acc, [m]: { total: 0, count: 0 } }), {} as FinancialStats["byMethod"]),
    topProducts: [],
  };
}

export const financialService = {
  async getStats(opts: { startDate?: string; endDate?: string } = {}): Promise<FinancialStats> {
    if (USE_REST_API) {
      const qs = new URLSearchParams(opts as Record<string, string>).toString();
      return restFetch<FinancialStats>(`/financial?${qs}`);
    }
    const orders = await ordersService.listHistory(opts);
    return computeStats(orders);
  },
};

export function computeStats(orders: Order[]): FinancialStats {
  const stats = emptyStats();
  const productTally = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const o of orders) {
    stats.totalRevenue += o.total;
    stats.ordersCount += 1;
    const m = (o.paymentMethod ?? "dinheiro") as PaymentMethod;
    if (stats.byMethod[m]) {
      stats.byMethod[m].total += o.total;
      stats.byMethod[m].count += 1;
    }
    for (const it of o.items) {
      const key = it.productKey ?? it.name;
      const cur = productTally.get(key) ?? { name: it.name, quantity: 0, revenue: 0 };
      cur.quantity += it.quantity;
      cur.revenue += it.price * it.quantity;
      productTally.set(key, cur);
    }
  }

  stats.averageTicket = stats.ordersCount ? stats.totalRevenue / stats.ordersCount : 0;
  stats.topProducts = [...productTally.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8);
  return stats;
}
