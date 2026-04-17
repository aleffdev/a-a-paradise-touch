import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { ShoppingBag } from "lucide-react";
import { useCart, formatBRL } from "@/contexts/CartContext";

interface TotemHeaderProps {
  showCart?: boolean;
}

export function TotemHeader({ showCart = true }: TotemHeaderProps) {
  const { count, total, orderType } = useCart();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Açaí do Paraíso" width={48} height={48} className="h-12 w-12 object-contain" />
          <div className="hidden sm:block">
            <h1 className="font-display text-xl font-bold text-primary leading-none">Açaí do Paraíso</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Sabor tropical, atendimento rápido</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {orderType && (
            <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-tropical/10 text-tropical text-sm font-medium">
              {orderType === "local" ? "🪑 Retirar no local" : "🛍️ Para viagem"}
            </span>
          )}
          {showCart && (
            <Link
              to="/carrinho"
              className="relative inline-flex items-center gap-2 bg-gradient-purple text-primary-foreground px-5 py-3 rounded-full font-semibold shadow-soft hover:shadow-glow transition-all active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{formatBRL(total)}</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-tropical text-tropical-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-background">
                  {count}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
