import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { TotemHeader } from "@/components/totem/TotemHeader";
import { Trash2, Minus, Plus, ChevronLeft, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/carrinho")({
  component: CartScreen,
});

function CartScreen() {
  const { items, total, updateQuantity, removeItem, orderType, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const finalize = async () => {
    if (items.length === 0) return;
    const cleanName = customerName.trim().replace(/\s+/g, " ");
    if (cleanName.length < 2) {
      toast.error("Digite o nome do cliente para finalizar.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: cleanName,
          order_type: orderType ?? "local",
          items: items as never,
          total,
        })
        .select("order_number")
        .single();

      if (error) throw error;
      clear();
      navigate({ to: "/sucesso/$orderNumber", params: { orderNumber: String(data.order_number) } });
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível finalizar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TotemHeader showCart={false} />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/cardapio" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm">
          <ChevronLeft className="w-4 h-4" /> Continuar comprando
        </Link>
        <h2 className="font-display text-4xl font-bold mb-2">Seu pedido</h2>
        <p className="text-muted-foreground mb-8">Revise antes de finalizar.</p>

        {items.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-display text-2xl font-bold">Carrinho vazio</h3>
            <p className="text-muted-foreground mt-2">Que tal escolher algo delicioso?</p>
            <Link
              to="/cardapio"
              className="mt-6 inline-block bg-gradient-purple text-primary-foreground font-bold px-6 py-3 rounded-full shadow-soft"
            >
              Ver cardápio
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-card border border-border p-4 flex gap-4 items-start shadow-soft">
                  <div className="text-4xl">{item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground mt-1 break-words">{item.description}</div>
                    )}
                    <div className="text-tropical font-bold mt-2">{formatBRL(item.price)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive p-2"
                      aria-label="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-95"
                        aria-label="Diminuir"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95"
                        aria-label="Aumentar"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 rounded-3xl bg-gradient-card border border-border p-6 shadow-card">
              <div className="flex justify-between mb-2 text-muted-foreground">
                <span>Tipo de pedido</span>
                <span className="font-medium text-foreground">
                  {orderType === "local" ? "🪑 Retirar no local" : "🛍️ Para viagem"}
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-border">
                <span className="font-display text-xl font-bold">Total</span>
                <span className="font-display text-3xl font-bold text-primary">{formatBRL(total)}</span>
              </div>
              <label className="block mt-5 pt-5 border-t border-border">
                <span className="text-sm font-semibold text-foreground">Nome do cliente</span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={80}
                  placeholder="Digite seu nome"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <button
                onClick={finalize}
                disabled={submitting || customerName.trim().length < 2}
                className="mt-6 w-full bg-gradient-purple text-primary-foreground font-bold text-lg py-5 rounded-2xl shadow-glow disabled:opacity-50 active:scale-[0.99] transition-all"
              >
                {submitting ? "Enviando pedido..." : "Finalizar Pedido"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
