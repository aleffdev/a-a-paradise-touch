import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

const ORDER_TYPE_KEY = "totem:orderType";
const CART_KEY = "totem:cart";

export type OrderType = "local" | "viagem";

export interface CartItem {
  id: string;             // unique line id
  productKey: string;     // product identifier (acai-M, picole, etc.)
  name: string;           // display name e.g. "Açaí Médio (6 bolas)"
  price: number;
  quantity: number;
  description?: string;   // toppings / flavor / calda summary
  emoji: string;
}

interface CartContextValue {
  items: CartItem[];
  orderType: OrderType | null;
  setOrderType: (t: OrderType) => void;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items]);
  const [orderType, setOrderTypeState] = useState<OrderType | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = window.sessionStorage.getItem(ORDER_TYPE_KEY);
    return saved === "local" || saved === "viagem" ? saved : null;
  });

  const setOrderType = useCallback((t: OrderType) => {
    setOrderTypeState(t);
    if (typeof window !== "undefined") window.sessionStorage.setItem(ORDER_TYPE_KEY, t);
  }, []);

  const addItem: CartContextValue["addItem"] = useCallback((item) => {
    setItems((prev) => [
      ...prev,
      { ...item, id: crypto.randomUUID(), quantity: item.quantity ?? 1 },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, orderType, setOrderType, addItem, removeItem, updateQuantity, clear, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
