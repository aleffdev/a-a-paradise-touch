/**
 * Serviço REST-like de produtos (cardápio extra cadastrado pelo admin).
 *
 * Endpoints futuros (PHP+MySQL):
 *   GET    /products
 *   GET    /products/:id
 *   POST   /products
 *   PUT    /products/:id
 *   DELETE /products/:id
 *   PATCH  /products/:id/availability
 */

import { supabase } from "@/integrations/supabase/client";
import { USE_REST_API, restFetch } from "./apiClient";
import { mapProduct } from "./mappers";
import type { Product, ProductInput } from "@/types/domain";

export const productsService = {
  async list(): Promise<Product[]> {
    if (USE_REST_API) return restFetch<Product[]>("/products");
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProduct);
  },

  async getById(id: string): Promise<Product | null> {
    if (USE_REST_API) return restFetch<Product>(`/products/${id}`);
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapProduct(data) : null;
  },

  async create(input: ProductInput): Promise<Product> {
    if (USE_REST_API) return restFetch<Product>("/products", { method: "POST", body: JSON.stringify(input) });
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: input.name,
        category: input.category,
        description: input.description ?? null,
        price: input.price,
        image: input.image ?? null,
        emoji: input.emoji ?? "🍦",
        flavors: input.flavors ?? [],
        available: input.available ?? true,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapProduct(data);
  },

  async update(id: string, input: Partial<ProductInput>): Promise<void> {
    if (USE_REST_API) { await restFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(input) }); return; }
    const { error } = await supabase.from("products").update(input).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    if (USE_REST_API) { await restFetch(`/products/${id}`, { method: "DELETE" }); return; }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async setAvailable(id: string, available: boolean): Promise<void> {
    if (USE_REST_API) { await restFetch(`/products/${id}/availability`, { method: "PATCH", body: JSON.stringify({ available }) }); return; }
    const { error } = await supabase.from("products").update({ available }).eq("id", id);
    if (error) throw error;
  },
};
