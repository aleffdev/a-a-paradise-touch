import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/sucesso/$orderNumber")({
  component: SuccessScreen,
});

function SuccessScreen() {
  const [count, setCount] = useState(15);

  useEffect(() => {
    const t = setInterval(() => setCount((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (count === 0) window.location.href = "/";
  }, [count]);

  return (
    <main className="min-h-screen bg-gradient-hero flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center bg-card rounded-[2rem] p-10 shadow-glow border border-border animate-float">
        <div className="w-24 h-24 mx-auto rounded-full bg-tropical/15 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-14 h-14 text-tropical" strokeWidth={2} />
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground">Pedido recebido!</h1>
        <p className="text-foreground mt-3 text-lg">
          Por favor, vá até o <span className="font-bold">caixa</span> e informe seu <span className="font-bold">nome</span> para realizar o pagamento.
        </p>

        <p className="text-sm text-muted-foreground mt-6">Bom apetite! 🌴</p>

        <Link
          to="/"
          className="mt-8 inline-block bg-gradient-purple text-primary-foreground font-bold px-8 py-4 rounded-full shadow-soft hover:shadow-glow active:scale-95 transition-all"
        >
          Novo pedido {count > 0 ? `(${count}s)` : ""}
        </Link>
      </div>
    </main>
  );
}
