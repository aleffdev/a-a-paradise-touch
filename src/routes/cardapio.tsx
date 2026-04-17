import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CATEGORIES } from "@/data/menu";
import { useCart } from "@/contexts/CartContext";
import { TotemHeader } from "@/components/totem/TotemHeader";

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
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to="/categoria/$categoryId"
              params={{ categoryId: cat.id }}
              className="group relative overflow-hidden rounded-3xl bg-card shadow-card hover:shadow-glow transition-all hover:-translate-y-1 active:scale-95 border border-border"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  width={768}
                  height={768}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-primary-foreground">
                <div className="text-3xl mb-1">{cat.emoji}</div>
                <div className="font-display text-xl md:text-2xl font-bold leading-tight">
                  {cat.name}
                </div>
                <div className="text-primary-foreground/80 text-sm mt-1">{cat.tagline}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
