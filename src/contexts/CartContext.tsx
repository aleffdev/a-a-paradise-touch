import { createContext, useContext, useState, ReactNode, useCallback } from "react";

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
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType | null>(null);

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
