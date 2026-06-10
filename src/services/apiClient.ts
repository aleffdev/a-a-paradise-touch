/**
 * Ponto único de configuração do backend.
 *
 * Hoje: USE_REST_API = false → os serviços delegam para o Supabase
 *       (src/integrations/supabase/client).
 *
 * Amanhã (PHP + MySQL via XAMPP): defina VITE_API_BASE no .env e mude
 *       USE_REST_API para true. Cada serviço já tem o bloco `if (USE_REST_API)`
 *       pronto com a chamada `fetch()` correspondente — nenhum componente
 *       precisa mudar.
 */

export const USE_REST_API = false as boolean;

export const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE) ||
  "http://localhost/acai-do-paraiso/api";

export async function restFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}
