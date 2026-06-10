import { useCallback, useEffect, useState } from "react";
import { productsService } from "@/services";
import type { Product } from "@/types/domain";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await productsService.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { products, loading, reload };
}
