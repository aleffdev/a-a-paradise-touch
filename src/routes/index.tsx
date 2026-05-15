import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo-acai-paraiso-uploaded.png";
import heroImg from "@/assets/hero-acai.jpg";
import { PalmDecor } from "@/components/totem/PalmDecor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Açaí do Paraíso — Totem de Autoatendimento" },
      { name: "description", content: "Faça seu pedido no totem de autoatendimento da sorveteria Açaí do Paraíso. Açaí trufado, picolés, paletas e muito mais." },
      { property: "og:title", content: "Açaí do Paraíso — Totem de Autoatendimento" },
      { property: "og:description", content: "Sabor tropical e atendimento rápido. Monte seu açaí no totem." },
    ],
  }),
  component: WelcomeScreen,
});

function WelcomeScreen() {
  const { setOrderType, clear } = useCart();

  const start = (type: "local" | "viagem") => {
    clear();
    setOrderType(type);
  };

  return (
    <main className="relative min-h-screen bg-gradient-hero overflow-hidden">
      <PalmDecor />

      {/* Floating hero image */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[50%] max-w-[720px] h-[72vh] bg-cover bg-center opacity-25 lg:opacity-45 mix-blend-luminosity"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Açaí do Paraíso" width={170} height={120} className="h-24 w-36 object-contain drop-shadow-2xl" />
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground drop-shadow">
              Açaí do Paraíso
            </h1>
            <p className="text-primary-foreground/80 text-sm md:text-base">Totem de autoatendimento</p>
          </div>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl">
          <p className="text-primary-foreground/90 text-lg md:text-xl font-medium uppercase tracking-widest mb-4">
            🌴 Bem-vindo ao paraíso
          </p>
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground leading-[0.95] drop-shadow-lg">
            Monte seu açaí
            <br />
            <span className="text-tropical">do seu jeito.</span>
          </h2>
          <p className="mt-6 text-primary-foreground/85 text-lg md:text-xl max-w-xl">
            Escolha como prefere receber seu pedido para começar:
          </p>

          {/* CTA buttons - giant for touch */}
          <div className="mt-10 grid sm:grid-cols-2 gap-5 max-w-2xl">
            <Link
              to="/cardapio"
              onClick={() => start("local")}
              className="group relative overflow-hidden rounded-3xl bg-card text-card-foreground p-8 shadow-card hover:shadow-glow transition-all active:scale-95 border-2 border-transparent hover:border-primary"
            >
              <div className="text-6xl mb-4">🪑</div>
              <div className="font-display text-2xl font-bold text-primary">Retirar no Local</div>
              <p className="text-muted-foreground mt-1">Comer aqui mesmo</p>
              <div className="mt-4 inline-flex items-center text-primary font-semibold">
                Começar pedido →
              </div>
            </Link>

            <Link
              to="/cardapio"
              onClick={() => start("viagem")}
              className="group relative overflow-hidden rounded-3xl bg-gradient-tropical text-tropical-foreground p-8 shadow-card hover:shadow-glow transition-all active:scale-95 border-2 border-transparent"
            >
              <div className="text-6xl mb-4">🛍️</div>
              <div className="font-display text-2xl font-bold">Para Viagem</div>
              <p className="text-tropical-foreground/85 mt-1">Levar pra casa</p>
              <div className="mt-4 inline-flex items-center font-semibold">
                Começar pedido →
              </div>
            </Link>
          </div>
        </div>

        {/* Footer admin link */}
        <div className="mt-10 flex items-center justify-between text-primary-foreground/60 text-sm">
          <span>© Açaí do Paraíso</span>
          <Link to="/admin" className="hover:text-primary-foreground transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
