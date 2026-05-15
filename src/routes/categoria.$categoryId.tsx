import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CATEGORIES, SIMPLE_PRODUCTS, CategoryId } from "@/data/menu";
import { useCart } from "@/contexts/CartContext";
import { TotemHeader } from "@/components/totem/TotemHeader";
import { AcaiBuilder } from "@/components/totem/AcaiBuilder";
import { FlavorPicker } from "@/components/totem/FlavorPicker";
import { useAvailability } from "@/hooks/useAvailability";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/categoria/$categoryId")({
  component: CategoryScreen,
});

function CategoryScreen() {
  const { categoryId } = Route.useParams();
  const { orderType } = useCart();
  const navigate = useNavigate();
  const { isAvailable } = useAvailability();

  useEffect(() => {
    if (!orderType) navigate({ to: "/" });
  }, [orderType, navigate]);

  const category = CATEGORIES.find((c) => c.id === categoryId as CategoryId);
  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <TotemHeader />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold">Categoria não encontrada</h2>
          <Link to="/cardapio" className="mt-4 inline-block text-primary font-semibold">
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  const products = SIMPLE_PRODUCTS.filter((p) => p.category === category.id);

  return (
    <div className="min-h-screen bg-background">
      <TotemHeader />

      {/* Hero */}
      <div className="relative h-56 md:h-64 overflow-hidden">
        <img src={category.image} alt={category.name} width={1920} height={500} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-primary/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-6 pb-6 w-full">
            <Link to="/cardapio" className="inline-flex items-center gap-1 text-primary-foreground/90 hover:text-primary-foreground mb-3 bg-primary/40 backdrop-blur px-3 py-1.5 rounded-full text-sm">
              <ChevronLeft className="w-4 h-4" /> Cardápio
            </Link>
            <div className="text-4xl">{category.emoji}</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground drop-shadow">
              {category.name}
            </h2>
            <p className="text-muted-foreground mt-1">{category.tagline}</p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8 pb-24">
        {category.id === "acai" ? (
          <AcaiBuilder isAvailable={isAvailable} />
        ) : (
          <div className="space-y-5">
            {products.map((p) => (
              <FlavorPicker key={p.id} product={p} isAvailable={isAvailable} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
