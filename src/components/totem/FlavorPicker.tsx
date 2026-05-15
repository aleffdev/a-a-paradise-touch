import { useState } from "react";
import { SimpleProduct } from "@/data/menu";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Check, Minus, Plus } from "lucide-react";

export function FlavorPicker({ product, isAvailable }: { product: SimpleProduct; isAvailable: (key: string) => boolean }) {
  const { addItem } = useCart();
  const [flavor, setFlavor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const productAvailable = isAvailable(`product:${product.id}`);

  const handleAdd = () => {
    if (!flavor) {
      toast.error("Escolha um sabor");
      return;
    }
    addItem({
      productKey: product.id,
      name: `${product.name} — ${flavor}`,
      price: product.price,
      emoji: product.emoji,
      quantity: qty,
    });
    toast.success(`${qty}× ${product.name} adicionado!`);
    setFlavor(null);
    setQty(1);
  };

  if (!productAvailable) {
    return (
      <div className="rounded-3xl bg-card border border-dashed border-border p-6 shadow-soft opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl grayscale">{product.emoji}</div>
            <h3 className="font-display text-2xl font-bold mt-1">{product.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">Indisponível no momento</p>
          </div>
          <span className="bg-muted text-muted-foreground text-xs font-bold px-3 py-1.5 rounded-full">
            Indisponível
          </span>
        </div>
      </div>
    );
  }

  const availableFlavors = product.flavors.filter((f) => isAvailable(`flavor:${product.id}:${f}`));

  return (
    <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-3xl">{product.emoji}</div>
          <h3 className="font-display text-2xl font-bold mt-1">{product.name}</h3>
          <p className="text-tropical font-bold text-lg mt-1">{formatBRL(product.price)}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">Escolha o sabor:</p>
      {availableFlavors.length === 0 ? (
        <p className="text-sm text-muted-foreground italic mb-6">Nenhum sabor disponível no momento.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6">
          {availableFlavors.map((f) => {
            const active = flavor === f;
            return (
              <button
                key={f}
                onClick={() => setFlavor(f)}
                className={`px-4 py-2.5 rounded-full font-medium transition-all active:scale-95 inline-flex items-center gap-2 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {active && <Check className="w-4 h-4" />}
                {f}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-11 h-11 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center active:scale-95"
            aria-label="Diminuir"
          >
            <Minus className="w-5 h-5" />
          </button>
          <span className="w-8 text-center font-bold text-lg">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95"
            aria-label="Aumentar"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleAdd}
          disabled={availableFlavors.length === 0}
          className="flex-1 bg-gradient-purple text-primary-foreground font-bold py-3.5 rounded-2xl shadow-soft hover:shadow-glow active:scale-[0.99] transition-all disabled:opacity-50"
        >
          Adicionar — {formatBRL(product.price * qty)}
        </button>
      </div>
    </div>
  );
}
