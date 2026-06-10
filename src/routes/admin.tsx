import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CategoryId } from "@/data/menu";
import { formatBRL } from "@/contexts/CartContext";
import { buildCatalogItems, useAvailability, setItemAvailability, AvailabilityItem, AvailabilityType } from "@/hooks/useAvailability";
import { ordersService, productsService, computeStats } from "@/services";
import type { Order, PaymentMethod } from "@/types/domain";
import { PAID_STATUSES, PAYMENT_METHOD_LABEL, ORDER_STATUS_LABEL } from "@/types/domain";
import { toast } from "sonner";
import { Lock, LogOut, Plus, Trash2, Eye, EyeOff, ChevronLeft, ShoppingBag, TrendingUp, Search, History, CreditCard, CheckCircle2, Wallet, Calendar, ChefHat, X } from "lucide-react";
import logo from "@/assets/logo-acai-paraiso-uploaded.png";

const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY = "acai_admin_authed";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel Admin — Açaí do Paraíso" }, { name: "robots", content: "noindex" }] }),
  component: AdminScreen,
});

interface DBProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  flavors: string[];
  emoji: string;
  available: boolean;
}

function AdminScreen() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem(STORAGE_KEY); setAuthed(false); }} />;
}

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      onAuth();
    } else {
      toast.error("Senha incorreta");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-hero flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-md bg-card rounded-3xl p-8 shadow-glow border border-border">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold text-center">Painel Admin</h1>
        <p className="text-muted-foreground text-center text-sm mt-1">Açaí do Paraíso</p>

        <label className="block mt-8">
          <span className="text-sm font-medium">Senha de acesso</span>
          <div className="mt-2 relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Digite a senha"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Mostrar senha"
            >
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          className="mt-6 w-full bg-gradient-purple text-primary-foreground font-bold py-3 rounded-xl shadow-soft active:scale-[0.99]"
        >
          Entrar
        </button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Senha demo: <code className="bg-secondary px-1.5 py-0.5 rounded">admin123</code>
        </p>

        <Link to="/" className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Voltar ao totem
        </Link>
      </form>
    </main>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"orders" | "history" | "financial" | "products">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [o, p] = await Promise.all([
        ordersService.list(),
        productsService.list(),
      ]);
      setOrders(o);
      setProducts(p as unknown as DBProduct[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = ordersService.subscribe(() => load());
    return unsubscribe;
  }, []);

  const pendingOrders = orders.filter((o) => o.status === "aguardando_pagamento");
  const historyOrders = orders.filter((o) => PAID_STATUSES.includes(o.status));

  const todayRevenue = historyOrders
    .filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card/95 backdrop-blur border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Açaí do Paraíso" width={90} height={64} className="h-14 w-20 object-contain" />
            <div>
              <h1 className="font-display text-xl font-bold">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">Açaí do Paraíso</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/cozinha" className="inline-flex items-center gap-1.5 text-sm bg-tropical/15 text-tropical font-semibold hover:bg-tropical/25 px-3 py-2 rounded-lg">
              <ChefHat className="w-4 h-4" /> Cozinha
            </Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">
              Ver totem
            </Link>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-sm bg-secondary hover:bg-accent px-3 py-2 rounded-lg"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <KpiCard icon={<ShoppingBag className="w-5 h-5" />} label="Pendentes" value={String(pendingOrders.length)} />
          <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Receita do dia" value={formatBRL(todayRevenue)} />
          <KpiCard icon={<History className="w-5 h-5" />} label="Pagos no total" value={String(historyOrders.length)} />
        </div>

        <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 w-fit flex-wrap">
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>Pedidos pendentes</TabBtn>
          <TabBtn active={tab === "history"} onClick={() => setTab("history")}>Histórico</TabBtn>
          <TabBtn active={tab === "financial"} onClick={() => setTab("financial")}>Financeiro</TabBtn>
          <TabBtn active={tab === "products"} onClick={() => setTab("products")}>Cardápio</TabBtn>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando...</div>
        ) : tab === "orders" ? (
          <OrdersTab orders={pendingOrders} onPaid={load} onDetail={setDetail} />
        ) : tab === "history" ? (
          <HistoryTab orders={historyOrders} onDetail={setDetail} />
        ) : tab === "financial" ? (
          <FinancialTab orders={historyOrders} />
        ) : (
          <CatalogTab extraProducts={products} reload={load} />
        )}
      </main>

      {detail && <OrderDetailModal order={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}{label}</div>
      <div className="font-display text-3xl font-bold text-foreground mt-2">{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function OrdersTab({ orders, onPaid, onDetail }: { orders: Order[]; onPaid: () => void; onDetail: (o: Order) => void }) {
  const [search, setSearch] = useState("");
  const filtered = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      o.customerName.toLowerCase().includes(q) ||
      String(o.orderNumber).includes(q) ||
      o.items.some((it) => it.name.toLowerCase().includes(q))
    );
  });

  if (orders.length === 0) return <Empty msg="Nenhum pedido pendente agora." />;
  return (
    <div className="space-y-4">
      <SearchBox value={search} onChange={setSearch} placeholder="Buscar por nome, pedido ou item..." />
      {filtered.length === 0 && <Empty msg="Nenhum pedido encontrado para essa busca." />}
      {filtered.map((o) => (
        <PendingOrderCard key={o.id} order={o} onPaid={onPaid} onDetail={() => onDetail(o)} />
      ))}
    </div>
  );
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function HistoryTab({ orders, onDetail }: { orders: Order[]; onDetail: (o: Order) => void }) {
  const [search, setSearch] = useState("");
  const [start, setStart] = useState<string>(todayStr());
  const [end, setEnd] = useState<string>(todayStr());
  const [allDates, setAllDates] = useState(false);
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");

  const filtered = orders.filter((o) => {
    if (!allDates) {
      const od = new Date(o.createdAt);
      const d = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, "0")}-${String(od.getDate()).padStart(2, "0")}`;
      if (d < start || d > end) return false;
    }
    if (methodFilter !== "all" && o.paymentMethod !== methodFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return o.customerName.toLowerCase().includes(q) || String(o.orderNumber).includes(q);
  });

  const periodTotal = filtered.reduce((s, o) => s + o.total, 0);

  if (orders.length === 0) return <Empty msg="Histórico vazio. Os pedidos pagos aparecerão aqui." />;
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome do cliente ou número do pedido..." className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" /> De
            <input type="date" value={start} onChange={(e) => { setStart(e.target.value); setAllDates(false); }} disabled={allDates} className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm disabled:opacity-50" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            até
            <input type="date" value={end} onChange={(e) => { setEnd(e.target.value); setAllDates(false); }} disabled={allDates} className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm disabled:opacity-50" />
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={allDates} onChange={(e) => setAllDates(e.target.checked)} />
            Todos os dias
          </label>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
            <option value="all">Todos os pagamentos</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
            <option value="all">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="em_preparo">Em preparo</option>
            <option value="pronto">Pronto</option>
          </select>
          <div className="ml-auto text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-display font-bold text-tropical">{formatBRL(periodTotal)}</span>
            <span className="text-muted-foreground"> · {filtered.length} pedido(s)</span>
          </div>
        </div>
      </div>
      {filtered.length === 0 ? <Empty msg="Nenhum pedido nesse período." /> : filtered.map((o) => (
        <HistoryOrderRow key={o.id} order={o} onDetail={() => onDetail(o)} />
      ))}
    </div>
  );
}

function FinancialTab({ orders }: { orders: Order[] }) {
  const [start, setStart] = useState<string>(todayStr());
  const [end, setEnd] = useState<string>(todayStr());
  const [allDates, setAllDates] = useState(false);

  const filtered = orders.filter((o) => {
    if (allDates) return true;
    const od = new Date(o.createdAt);
    const d = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, "0")}-${String(od.getDate()).padStart(2, "0")}`;
    return d >= start && d <= end;
  });

  const stats = computeStats(filtered);
  const maxMethod = Math.max(1, ...Object.values(stats.byMethod).map((b) => b.total));
  const maxProduct = stats.topProducts[0]?.quantity ?? 1;

  // Week/month from full orders
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30);
  const weekRevenue = orders.filter((o) => new Date(o.createdAt) >= weekStart).reduce((s, o) => s + o.total, 0);
  const monthRevenue = orders.filter((o) => new Date(o.createdAt) >= monthStart).reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-soft">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <label className="text-sm flex items-center gap-2">De
          <input type="date" value={start} onChange={(e) => { setStart(e.target.value); setAllDates(false); }} disabled={allDates} className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm disabled:opacity-50" />
        </label>
        <label className="text-sm flex items-center gap-2">até
          <input type="date" value={end} onChange={(e) => { setEnd(e.target.value); setAllDates(false); }} disabled={allDates} className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm disabled:opacity-50" />
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={allDates} onChange={(e) => setAllDates(e.target.checked)} />
          Todo o período
        </label>
        <span className="ml-auto text-xs text-muted-foreground">Somente pedidos pagos contam aqui.</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-purple text-primary-foreground rounded-2xl p-5 shadow-glow">
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm"><Wallet className="w-5 h-5" /> Receita</div>
          <div className="font-display text-3xl font-bold mt-2">{formatBRL(stats.totalRevenue)}</div>
          <div className="text-primary-foreground/80 text-xs mt-1">{stats.ordersCount} pedido(s)</div>
        </div>
        <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Ticket médio" value={formatBRL(stats.averageTicket)} />
        <KpiCard icon={<History className="w-5 h-5" />} label="Últimos 7 dias" value={formatBRL(weekRevenue)} />
        <KpiCard icon={<History className="w-5 h-5" />} label="Últimos 30 dias" value={formatBRL(monthRevenue)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h3 className="font-display text-xl font-bold mb-4">Vendas por forma de pagamento</h3>
          <div className="space-y-3">
            {(Object.entries(stats.byMethod) as [PaymentMethod, { total: number; count: number }][]).map(([key, data]) => {
              const pct = stats.totalRevenue > 0 ? (data.total / stats.totalRevenue) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">{PAYMENT_METHOD_LABEL[key]}</span>
                    <span className="text-muted-foreground">{data.count} · {formatBRL(data.total)}</span>
                  </div>
                  <div className="h-2 mt-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-tropical" style={{ width: `${(data.total / maxMethod) * 100}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{pct.toFixed(1)}% do total</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h3 className="font-display text-xl font-bold mb-4">Produtos mais vendidos</h3>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.slice(0, 6).map((p, i) => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate">#{i + 1} {p.name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{p.quantity}× · {formatBRL(p.revenue)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-purple rounded-full" style={{ width: `${(p.quantity / maxProduct) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-soft">
      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-transparent outline-none" />
    </div>
  );
}

function PendingOrderCard({ order: o, onPaid, onDetail }: { order: Order; onPaid: () => void; onDetail: () => void }) {
  const [payment, setPayment] = useState<PaymentMethod>("dinheiro");
  const [saving, setSaving] = useState(false);

  const markPaid = async () => {
    setSaving(true);
    try {
      await ordersService.confirmPayment(o.id, payment);
      toast.success(`Pagamento de ${o.customerName} confirmado — enviado para a cozinha.`);
      onPaid();
    } catch {
      toast.error("Erro ao confirmar pagamento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <button onClick={onDetail} className="text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-2xl font-bold text-primary">#{o.orderNumber}</span>
            <span className="text-sm font-bold text-foreground">{o.customerName}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-tropical/15 text-tropical font-medium">
              {o.orderType === "local" ? "Local" : "Viagem"}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-700 font-medium">
              {ORDER_STATUS_LABEL[o.status]}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(o.createdAt).toLocaleString("pt-BR")}
          </div>
        </button>
        <div className="font-display text-2xl font-bold">{formatBRL(o.total)}</div>
      </div>
      <div className="mt-3 pt-3 border-t border-border space-y-1">
        {o.items.map((it, i) => (
          <div key={i} className="text-sm flex justify-between gap-3 items-start">
            <span className="text-foreground">
              {it.quantity}× {it.name}
              {it.description && <span className="block text-xs text-muted-foreground mt-0.5">{it.description}</span>}
            </span>
            <span className="text-muted-foreground whitespace-nowrap">{formatBRL(it.price * it.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center">
        <label className="flex-1 text-sm font-medium">
          Forma de pagamento
          <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-3">
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="debito">Cartão de débito</option>
            <option value="credito">Cartão de crédito</option>
          </select>
        </label>
        <button onClick={markPaid} disabled={saving} className="inline-flex items-center justify-center gap-2 bg-gradient-tropical text-tropical-foreground font-bold px-5 py-4 rounded-xl shadow-soft disabled:opacity-50 active:scale-95">
          <CreditCard className="w-5 h-5" /> {saving ? "Salvando..." : "Confirmar Pagamento"}
        </button>
      </div>
    </div>
  );
}

function HistoryOrderRow({ order: o, onDetail }: { order: Order; onDetail: () => void }) {
  const statusTone: Record<Order["status"], string> = {
    aguardando_pagamento: "bg-amber-500/15 text-amber-700",
    pago: "bg-blue-500/15 text-blue-700",
    em_preparo: "bg-indigo-500/15 text-indigo-700",
    pronto: "bg-emerald-500/15 text-emerald-700",
  };
  return (
    <button onClick={onDetail} className="w-full text-left bg-card hover:bg-accent/40 transition-colors border border-border rounded-2xl p-4 shadow-soft flex items-center gap-4 flex-wrap">
      <span className="font-display text-xl font-bold text-primary">#{o.orderNumber}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{o.customerName}</div>
        <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("pt-BR")} · {o.orderType === "local" ? "Local" : "Viagem"}</div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusTone[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span>
      <span className="text-xs text-muted-foreground">{o.paymentMethod ? PAYMENT_METHOD_LABEL[o.paymentMethod] : "—"}</span>
      <span className="font-display text-lg font-bold">{formatBRL(o.total)}</span>
    </button>
  );
}

function OrderDetailModal({ order: o, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-glow border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between">
          <div>
            <div className="font-display text-2xl font-bold text-primary">Pedido #{o.orderNumber}</div>
            <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("pt-BR")}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent" aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <DetailRow label="Cliente" value={o.customerName} />
            <DetailRow label="Tipo" value={o.orderType === "local" ? "Consumir no local" : "Levar para viagem"} />
            <DetailRow label="Status" value={ORDER_STATUS_LABEL[o.status]} />
            <DetailRow label="Pagamento" value={o.paymentMethod ? PAYMENT_METHOD_LABEL[o.paymentMethod] : "—"} />
            {o.paidAt && <DetailRow label="Pago em" value={new Date(o.paidAt).toLocaleString("pt-BR")} />}
            {o.readyAt && <DetailRow label="Pronto em" value={new Date(o.readyAt).toLocaleString("pt-BR")} />}
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="font-display font-bold mb-2">Itens</h3>
            <div className="space-y-2">
              {o.items.map((it, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <div>
                    <div>{it.quantity}× {it.name}</div>
                    {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">{formatBRL(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4 flex justify-between items-baseline">
            <span className="font-display font-bold">Total</span>
            <span className="font-display text-2xl font-bold text-tropical">{formatBRL(o.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}


const TYPE_LABEL: Record<AvailabilityType, string> = {
  category: "Categoria",
  size: "Tamanho de Açaí",
  topping: "Acompanhamento",
  calda: "Calda",
  product: "Produto",
  flavor: "Sabor",
};

function CatalogTab({ extraProducts, reload }: { extraProducts: DBProduct[]; reload: () => void }) {
  const { map: availMap, reload: reloadAvail } = useAvailability();
  const [filter, setFilter] = useState<"all" | AvailabilityType | "extra">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Built-in catalog items with current availability
  const catalogItems = useMemo(() => {
    return buildCatalogItems().map((it) => ({
      ...it,
      available: availMap[it.item_key] !== false,
    }));
  }, [availMap]);

  const toggleBuiltIn = async (item: AvailabilityItem) => {
    const newVal = !(availMap[item.item_key] !== false);
    const { error } = await setItemAvailability(item, newVal);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(newVal ? "Disponível" : "Indisponível");
    reloadAvail();
  };

  const filteredCatalog = catalogItems.filter((it) => {
    if (filter !== "all" && filter !== "extra" && it.item_type !== filter) return false;
    if (search && !it.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const showExtras = filter === "all" || filter === "extra";
  const filteredExtras = extraProducts.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-soft">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar item..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="all">Todos</option>
          <option value="category">Categorias</option>
          <option value="product">Produtos</option>
          <option value="flavor">Sabores</option>
          <option value="size">Tamanhos de Açaí</option>
          <option value="topping">Acompanhamentos</option>
          <option value="calda">Caldas</option>
          <option value="extra">Produtos extras (admin)</option>
        </select>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-medium px-4 py-2 rounded-lg shadow-soft active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" /> Novo produto extra
        </button>
      </div>

      {showForm && <ExtraProductForm onCreated={() => { setShowForm(false); reload(); }} />}

      {/* Built-in catalog items */}
      {filter !== "extra" && (
        <div className="grid gap-2">
          {filteredCatalog.length === 0 && filter !== "all" && (
            <Empty msg="Nenhum item nesta categoria." />
          )}
          {filteredCatalog.map((it) => (
            <div key={it.item_key} className={`bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-soft ${!it.available ? "opacity-60" : ""}`}>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md whitespace-nowrap">
                {TYPE_LABEL[it.item_type]}
              </span>
              <div className="flex-1 min-w-0 font-medium truncate">{it.label}</div>
              <button
                onClick={() => toggleBuiltIn(it)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all active:scale-95 ${it.available ? "bg-tropical/15 text-tropical" : "bg-muted text-muted-foreground"}`}
              >
                {it.available ? "Disponível" : "Indisponível"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Extra DB products */}
      {showExtras && filteredExtras.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold mt-6 mb-3">Produtos extras</h3>
          <div className="grid gap-3">
            {filteredExtras.map((p) => (
              <ExtraProductRow key={p.id} p={p} reload={reload} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExtraProductRow({ p, reload }: { p: DBProduct; reload: () => void }) {
  const toggle = async () => {
    try {
      await productsService.setAvailable(p.id, !p.available);
      toast.success(p.available ? "Marcado como indisponível" : "Marcado como disponível");
      reload();
    } catch { toast.error("Erro ao atualizar"); }
  };
  const remove = async () => {
    if (!confirm("Remover este produto?")) return;
    try {
      await productsService.remove(p.id);
      toast.success("Produto removido");
      reload();
    } catch { toast.error("Erro ao remover"); }
  };
  return (
    <div className={`bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-soft ${!p.available ? "opacity-60" : ""}`}>
      <div className="text-3xl">{p.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{p.name}</div>
        <div className="text-xs text-muted-foreground">{p.category} • {formatBRL(Number(p.price))}</div>
        {p.flavors?.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1 truncate">Sabores: {p.flavors.join(", ")}</div>
        )}
      </div>
      <button
        onClick={toggle}
        className={`text-xs px-3 py-1.5 rounded-full font-medium ${p.available ? "bg-tropical/15 text-tropical" : "bg-muted text-muted-foreground"}`}
      >
        {p.available ? "Disponível" : "Indisponível"}
      </button>
      <button onClick={remove} className="text-muted-foreground hover:text-destructive p-2" aria-label="Remover">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function ExtraProductForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>("picole");
  const [price, setPrice] = useState("");
  const [emoji, setEmoji] = useState("🍦");
  const [flavors, setFlavors] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productsService.create({
        name, category, price: Number(price), emoji,
        flavors: flavors.split(",").map((s) => s.trim()).filter(Boolean),
        available: true,
      });
      toast.success("Produto criado!");
      onCreated();
    } catch { toast.error("Erro ao criar produto"); }
  };

  return (
    <form onSubmit={create} className="bg-card border border-border rounded-2xl p-5 shadow-soft grid sm:grid-cols-2 gap-3">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="px-3 py-2 rounded-lg border border-border bg-background" />
      <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} className="px-3 py-2 rounded-lg border border-border bg-background">
        {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço (ex: 12.50)" type="number" step="0.01" className="px-3 py-2 rounded-lg border border-border bg-background" />
      <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" className="px-3 py-2 rounded-lg border border-border bg-background" />
      <input value={flavors} onChange={(e) => setFlavors(e.target.value)} placeholder="Sabores (separados por vírgula)" className="sm:col-span-2 px-3 py-2 rounded-lg border border-border bg-background" />
      <button type="submit" className="sm:col-span-2 bg-gradient-purple text-primary-foreground font-medium py-2.5 rounded-lg active:scale-95">
        Salvar produto
      </button>
    </form>
  );
}


function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
      {msg}
    </div>
  );
}
