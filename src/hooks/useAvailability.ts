import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, SIMPLE_PRODUCTS, ACAI_SIZES, ACAI_TOPPINGS, ACAI_CALDAS } from "@/data/menu";

export type AvailabilityType = "category" | "product" | "flavor" | "size" | "topping" | "calda";

export interface AvailabilityItem {
  item_key: string;
  item_type: AvailabilityType;
  label: string;
  available: boolean;
}

/** Build the canonical list of every togglable item in the menu */
export function buildCatalogItems(): AvailabilityItem[] {
  const items: AvailabilityItem[] = [];

  // Categories
  CATEGORIES.forEach((c) =>
    items.push({ item_key: `category:${c.id}`, item_type: "category", label: c.name, available: true })
  );

  // Açaí sizes
  ACAI_SIZES.forEach((s) =>
    items.push({ item_key: `size:${s.id}`, item_type: "size", label: `Açaí ${s.label} (${s.scoops} bolas)`, available: true })
  );

  // Toppings & caldas
  ACAI_TOPPINGS.forEach((t) =>
    items.push({ item_key: `topping:${t}`, item_type: "topping", label: `Topping: ${t}`, available: true })
  );
  ACAI_CALDAS.forEach((c) =>
    items.push({ item_key: `calda:${c}`, item_type: "calda", label: `Calda: ${c}`, available: true })
  );

  // Simple products + their flavors
  SIMPLE_PRODUCTS.forEach((p) => {
    items.push({ item_key: `product:${p.id}`, item_type: "product", label: p.name, available: true });
    p.flavors.forEach((f) =>
      items.push({ item_key: `flavor:${p.id}:${f}`, item_type: "flavor", label: `${p.name} — ${f}`, available: true })
    );
  });

  return items;
}

/** Load availability map { item_key -> available } merged with defaults (true) */
export function useAvailability() {
  const [map, setMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("item_availability").select("item_key, available");
    const next: Record<string, boolean> = {};
    data?.forEach((r) => { next[r.item_key] = r.available; });
    setMap(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("item_availability_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "item_availability" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const isAvailable = useCallback((key: string) => map[key] !== false, [map]);

  return { map, isAvailable, loading, reload: load };
}

/** Toggle availability for a specific item */
export async function setItemAvailability(item: AvailabilityItem, available: boolean) {
  return supabase
    .from("item_availability")
    .upsert({
      item_key: item.item_key,
      item_type: item.item_type,
      label: item.label,
      available,
    }, { onConflict: "item_key" });
}
