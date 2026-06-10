import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import { ordersService } from "@/services";
import { ORDER_STATUS_LABEL } from "@/types/domain";
import type { Order } from "@/types/domain";
import { toast } from "sonner";
import { ChefHat, Clock, CheckCircle2, Play, Store, ShoppingBag, ChevronLeft } from "lucide-react";
import logo from "@/assets/logo-acai-paraiso-uploaded.png";

/** Quantos minutos pedidos "pronto" continuam visíveis na cozinha para conferência. */
const READY_VISIBLE_MINUTES = 5;

export const Route = createFileRoute("/cozinha")({
  head: () => ({
    meta: [
      { title: "Painel da Cozinha — Açaí do Paraíso" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KitchenScreen,
});

function KitchenScreen() {
  const { orders, loading } = useOrders({ status: ["pago", "em_preparo", "pronto"] });
  // Tick para reavaliar quais "prontos" já saíram da janela de visibilidade
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 15_000);
    return () => window.clearInterval(t);
  }, []);

  const now = Date.now();
  const cutoff = now - READY_VISIBLE_MINUTES * 60_000;

  const visible = orders
    .filter((o) => {
      if (o.status === "pago" || o.status === "em_preparo") return true;
      if (o.status === "pronto") {
        const readyAt = o.readyAt ? new Date(o.readyAt).getTime() : 0;
        return readyAt >= cutoff;
      }
      return false;
    })
    .sort((a, b) => {
      // pago primeiro, depois em_preparo, depois pronto; dentro do mesmo, mais antigo primeiro
      const order = { pago: 0, em_preparo: 1, pronto: 2, aguardando_pagamento: 3 };
      const diff = order[a.status] - order[b.status];
      if (diff !== 0) return diff;
      const aTime = new Date(a.paidAt ?? a.createdAt).getTime();
      const bTime = new Date(b.paidAt ?? b.createdAt).getTime();
      return aTime - bTime;
    });

  const counts = {
    pago: visible.filter((o) => o.status === "pago").length,
    em_preparo: visible.filter((o) => o.status === "em_preparo").length,
    pronto: visible.filter((o) => o.status === "pronto").length,
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card/95 backdrop-blur border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Açaí do Paraíso" width={90} height={64} className="h-14 w-20 object-contain" />
            <div>
              <h1 className="font-display text-xl font-bold flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-tropical" /> Painel da Cozinha
              </h1>
              <p className="text-xs text-muted-foreground">Açaí do Paraíso · atualiza em tempo real</p>
            </div>
          </div>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" /> Totem
          </Link>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-4 flex gap-3 flex-wrap">
          <Pill color="amber" label="Aguardando preparo" value={counts.pago} />
          <Pill color="blue" label="Em preparo" value={counts.em_preparo} />
          <Pill color="green" label="Pronto" value={counts.pronto} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando pedidos...</div>
        ) : visible.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center">
            <ChefHat className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="font-display text-2xl font-bold">Tudo em ordem!</h2>
            <p className="text-muted-foreground mt-2">Nenhum pedido na fila no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((o) => (
              <KitchenCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Pill({ color, label, value }: { color: "amber" | "blue" | "green"; label: string; value: number }) {
  const cls =
    color === "amber"
      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
      : color === "blue"
        ? "bg-blue-500/15 text-blue-700 border-blue-500/30"
        : "bg-emerald-500/15 text-emerald-700 border-emerald-500/30";
  return (
    <div className={`inline-flex items-center gap-2 border ${cls} px-3 py-1.5 rounded-full text-sm font-medium`}>
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function KitchenCard({ order: o }: { order: Order }) {
  const [busy, setBusy] = useState(false);

  const startPrep = async () => {
    setBusy(true);
    try { await ordersService.startPreparation(o.id); toast.success(`Pedido #${o.orderNumber} em preparo`); }
    catch { toast.error("Erro ao iniciar preparo"); }
    finally { setBusy(false); }
  };
  const markReady = async () => {
    setBusy(true);
    try { await ordersService.markReady(o.id); toast.success(`Pedido #${o.orderNumber} pronto para retirada`); }
    catch { toast.error("Erro ao marcar como pronto"); }
    finally { setBusy(false); }
  };

  const tone =
    o.status === "pronto"
      ? "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 ring-2 ring-emerald-400/40 shadow-glow"
      : o.status === "em_preparo"
        ? "border-blue-300 bg-blue-50/40 dark:bg-blue-950/10"
        : "border-amber-300 bg-amber-50/40 dark:bg-amber-950/10";

  const elapsed = elapsedLabel(o.paidAt ?? o.createdAt);

  return (
    <article className={`rounded-2xl border-2 p-5 shadow-soft transition-all ${tone}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-3xl font-bold text-primary">#{o.orderNumber}</span>
            <span className="font-bold text-foreground text-lg truncate">{o.customerName}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold ${
              o.orderType === "local"
                ? "bg-purple-500/15 text-purple-700"
                : "bg-orange-500/15 text-orange-700"
            }`}>
              {o.orderType === "local" ? <><Store className="w-3 h-3" /> Local</> : <><ShoppingBag className="w-3 h-3" /> Viagem</>}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" /> {elapsed}
            </span>
          </div>
        </div>
        <StatusBadge status={o.status} />
      </header>

      <ul className="mt-4 pt-4 border-t border-border space-y-1.5">
        {o.items.map((it, i) => (
          <li key={i} className="text-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base text-foreground">{it.quantity}×</span>
              <span className="font-medium">{it.name}</span>
            </div>
            {it.description && (
              <div className="text-xs text-muted-foreground ml-7 mt-0.5">{it.description}</div>
            )}
          </li>
        ))}
      </ul>

      {o.notes && (
        <div className="mt-3 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 px-3 py-2 rounded-lg">
          <strong>Obs:</strong> {o.notes}
        </div>
      )}

      <footer className="mt-4 pt-4 border-t border-border">
        {o.status === "pago" && (
          <button
            onClick={startPrep}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-soft active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Iniciar preparo
          </button>
        )}
        {o.status === "em_preparo" && (
          <button
            onClick={markReady}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-soft active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Marcar como pronto
          </button>
        )}
        {o.status === "pronto" && (
          <div className="text-center text-sm font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center justify-center gap-2 w-full py-2">
            <CheckCircle2 className="w-5 h-5" /> Pronto — chamar {o.customerName}
          </div>
        )}
      </footer>
    </article>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const cls =
    status === "pronto"
      ? "bg-emerald-500 text-white"
      : status === "em_preparo"
        ? "bg-blue-500 text-white"
        : "bg-amber-500 text-white";
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${cls}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

function elapsedLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const h = Math.floor(mins / 60);
  return `há ${h}h${mins % 60}min`;
}
