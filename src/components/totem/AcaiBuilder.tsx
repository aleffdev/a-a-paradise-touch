import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ACAI_SIZES, ACAI_BASES, ACAI_TOPPINGS, ACAI_CALDAS, AcaiSize } from "@/data/menu";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { useAvailability } from "@/hooks/useAvailability";
import { toast } from "sonner";
import { Plus, Minus, Check } from "lucide-react";

export function AcaiBuilder() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAvailable } = useAvailability();
  const availableSizes = ACAI_SIZES.filter((s) => isAvailable(`size:${s.id}`));
  const availableToppings = ACAI_TOPPINGS.filter((t) => isAvailable(`topping:${t}`));
  const availableCaldas = ACAI_CALDAS.filter((c) => isAvailable(`calda:${c}`));
  const initialSize = availableSizes.find((s) => s.id === "M") ?? availableSizes[0] ?? ACAI_SIZES[1];
  const [size, setSize] = useState<AcaiSize>(initialSize);
  const [bases, setBases] = useState<Record<string, number>>({ Açaí: ACAI_SIZES[1].scoops, Sorvete: 0 });
  const [toppings, setToppings] = useState<string[]>([]);
  const [calda, setCalda] = useState<string | null>(null);

  const totalScoops = Object.values(bases).reduce((a, b) => a + b, 0);
  const remaining = size.scoops - totalScoops;

  const changeSize = (s: AcaiSize) => {
    setSize(s);
    // reset bases proportionally → all to açaí
    setBases({ Açaí: s.scoops, Sorvete: 0 });
  };

  const adjustBase = (base: string, delta: number) => {
    setBases((prev) => {
      const next = { ...prev, [base]: Math.max(0, (prev[base] ?? 0) + delta) };
      const sum = Object.values(next).reduce((a, b) => a + b, 0);
      if (sum > size.scoops) return prev; // cap
      return next;
    });
  };

  const toggleTopping = (t: string) => {
    setToppings((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleAdd = () => {
    if (totalScoops !== size.scoops) {
      toast.error(`Selecione exatamente ${size.scoops} bolas (faltam ${remaining})`);
      return;
    }
    const baseDesc = Object.entries(bases)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n}× ${k}`)
      .join(", ");
    const description = [
      baseDesc,
      toppings.length ? `Acomp.: ${toppings.join(", ")}` : null,
      calda ? `Calda: ${calda}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    addItem({
      productKey: `acai-${size.id}`,
      name: `Açaí Trufado ${size.label} (${size.scoops} bolas)`,
      price: size.price,
      emoji: "🍇",
      description,
    });
    toast.success("Adicionado ao carrinho!");
    navigate({ to: "/cardapio" });
  };

  return (
    <div className="space-y-8">
      {/* Sizes */}
      <Section title="1. Escolha o tamanho">
        <div className="grid grid-cols-3 gap-3">
          {availableSizes.map((s) => (
            <button
              key={s.id}
              onClick={() => changeSize(s)}
              className={`p-5 rounded-2xl border-2 transition-all active:scale-95 text-center ${
                size.id === s.id
                  ? "border-primary bg-primary text-primary-foreground shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="font-display text-2xl font-bold">{s.label}</div>
              <div className="text-sm opacity-80 mt-1">{s.scoops} bolas</div>
              <div className="font-bold mt-2">{formatBRL(s.price)}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* Bases */}
      <Section
        title="2. Misture açaí e sorvete"
        subtitle={
          remaining === 0
            ? "✓ Combinação completa"
            : `${remaining} bolas restantes de ${size.scoops}`
        }
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {ACAI_BASES.map((b) => (
            <div key={b} className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{b}</div>
                <div className="text-sm text-muted-foreground">{bases[b] ?? 0} bola(s)</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustBase(b, -1)}
                  disabled={(bases[b] ?? 0) === 0}
                  className="w-11 h-11 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center disabled:opacity-30 active:scale-95"
                  aria-label={`Remover ${b}`}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-8 text-center font-bold text-lg">{bases[b] ?? 0}</span>
                <button
                  onClick={() => adjustBase(b, 1)}
                  disabled={remaining === 0}
                  className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 active:scale-95"
                  aria-label={`Adicionar ${b}`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Toppings */}
      <Section title="3. Acompanhamentos" subtitle="Selecione os que desejar (uma vez cada)">
        <div className="flex flex-wrap gap-2">
          {availableToppings.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Sem acompanhamentos disponíveis no momento.</p>
          )}
          {availableToppings.map((t) => {
            const active = toppings.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTopping(t)}
                className={`px-4 py-3 rounded-full font-medium transition-all active:scale-95 inline-flex items-center gap-2 ${
                  active
                    ? "bg-tropical text-tropical-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {active && <Check className="w-4 h-4" />}
                {t}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Calda */}
      <Section title="4. Calda" subtitle="Aplicada em cima e embaixo. Escolha apenas uma.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setCalda(null)}
            className={`p-4 rounded-2xl border-2 font-medium transition-all active:scale-95 ${
              calda === null ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            Sem calda
          </button>
          {availableCaldas.map((c) => (
            <button
              key={c}
              onClick={() => setCalda(c)}
              className={`p-4 rounded-2xl border-2 font-medium transition-all active:scale-95 ${
                calda === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Section>

      {/* Sticky add */}
      <div className="sticky bottom-4 z-30">
        <button
          onClick={handleAdd}
          disabled={remaining !== 0}
          className="w-full bg-gradient-purple text-primary-foreground font-bold text-lg py-5 rounded-2xl shadow-glow disabled:opacity-50 disabled:shadow-none active:scale-[0.99] transition-all flex items-center justify-center gap-3"
        >
          {remaining === 0 ? `Adicionar — ${formatBRL(size.price)}` : `Faltam ${remaining} bolas`}
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
