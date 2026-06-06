import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CATEGORIES } from "@/data/menu";
import { useCart } from "@/contexts/CartContext";
import { TotemHeader } from "@/components/totem/TotemHeader";
import { useAvailability } from "@/hooks/useAvailability";

export const Route = createFileRoute("/cardapio")({
  head: () => ({
    meta: [
      { title: "Cardápio — Açaí do Paraíso" },
      { name: "description", content: "Escolha entre açaí trufado, picolés, esquimó, paletas mexicanas, estruzados e potes." },
    ],
  }),
  component: MenuScreen,
});

function MenuScreen() {
  const { orderType } = useCart();
  const navigate = useNavigate();
  const { isAvailable } = useAvailability();

  // Guard: must have selected order type
  useEffect(() => {
    if (!orderType) navigate({ to: "/" });
  }, [orderType, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <TotemHeader />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <p className="text-tropical font-semibold uppercase tracking-widest text-sm">Cardápio</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-2">
            O que vai ser hoje?
          </h2>
          <p className="text-muted-foreground mt-3">
            Toque na categoria para escolher seus produtos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => {
            const available = isAvailable(`category:${cat.id}`);
            const Wrapper: any = available ? Link : "div";
            const wrapperProps = available
              ? { to: "/categoria/$categoryId", params: { categoryId: cat.id } }
              : { "aria-disabled": true };
            return (
              <Wrapper
                key={cat.id}
                {...wrapperProps}
                className={`group relative overflow-hidden rounded-3xl bg-card shadow-card border border-border transition-all ${
                  available
                    ? "hover:shadow-glow hover:-translate-y-1 active:scale-95"
                    : "opacity-60 grayscale cursor-not-allowed"
                }`}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    width={768}
                    height={768}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-700 ${available ? "group-hover:scale-110" : ""}`}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
                {!available && (
                  <div className="absolute top-3 right-3 bg-background/90 text-foreground text-xs font-bold px-3 py-1 rounded-full shadow-soft">
                    Indisponível
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-primary-foreground">
                  <div className="font-display text-xl md:text-2xl font-bold leading-tight">
                    {cat.name}
                  </div>
                  <div className="text-primary-foreground/80 text-sm mt-1">{cat.tagline}</div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </main>
    </div>
  );
}
