import { useCallback, useEffect, useState } from "react";
import { ordersService } from "@/services";
import type { Order, OrderFilters } from "@/types/domain";

/** Hook reativo de pedidos. Recarrega automaticamente em mudanças via subscribe(). */
export function useOrders(filters: OrderFilters = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Estabiliza dependência: usa string serializada
  const key = JSON.stringify(filters);

  const reload = useCallback(async () => {
    try {
      const data = await ordersService.list(JSON.parse(key));
      setOrders(data);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    reload();
    const unsubscribe = ordersService.subscribe(() => reload());
    return unsubscribe;
  }, [reload]);

  return { orders, loading, error, reload };
}
