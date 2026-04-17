import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CategoryId } from "@/data/menu";
import { formatBRL } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Lock, LogOut, Plus, Trash2, Eye, EyeOff, ChevronLeft, BarChart3, ShoppingBag, TrendingUp } from "lucide-react";

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

interface DBOrder {
  id: string;
  order_number: number;
  order_type: string;
  items: { name: string; quantity: number; price: number; productKey: string }[];
  total: number;
  status: string;
  created_at: string;
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
  const [tab, setTab] = useState<"orders" | "products" | "reports">("orders");
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [o, p] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ]);
    if (o.data) setOrders(o.data as unknown as DBOrder[]);
    if (p.data) setProducts(p.data as unknown as DBProduct[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const todayRevenue = orders
    .filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + Number(o.total), 0);

  // top sellers
  const tally = new Map<string, { name: string; qty: number }>();
  orders.forEach((o) => {
    o.items?.forEach((it) => {
      const k = it.productKey ?? it.name;
      const cur = tally.get(k) ?? { name: it.name, qty: 0 };
      tally.set(k, { name: cur.name, qty: cur.qty + it.quantity });
    });
  });
  const topSellers = [...tally.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">Painel Admin</h1>
            <p className="text-xs text-muted-foreground">Açaí do Paraíso</p>
          </div>
          <div className="flex items-center gap-2">
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
        {/* KPI cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <KpiCard icon={<ShoppingBag className="w-5 h-5" />} label="Pedidos hoje" value={String(orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length)} />
          <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Receita do dia" value={formatBRL(todayRevenue)} />
          <KpiCard icon={<BarChart3 className="w-5 h-5" />} label="Total de pedidos" value={String(orders.length)} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 w-fit">
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>Pedidos</TabBtn>
          <TabBtn active={tab === "products"} onClick={() => setTab("products")}>Produtos</TabBtn>
          <TabBtn active={tab === "reports"} onClick={() => setTab("reports")}>Mais Vendidos</TabBtn>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando...</div>
        ) : tab === "orders" ? (
          <OrdersTab orders={orders} />
        ) : tab === "products" ? (
          <ProductsTab products={products} reload={load} />
        ) : (
          <ReportsTab top={topSellers} />
        )}
      </main>
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

function OrdersTab({ orders }: { orders: DBOrder[] }) {
  if (orders.length === 0) {
    return <Empty msg="Nenhum pedido ainda." />;
  }
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-2xl font-bold text-primary">#{o.order_number}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-tropical/15 text-tropical font-medium">
                  {o.order_type === "local" ? "🪑 Local" : "🛍️ Viagem"}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                  {o.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(o.created_at).toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="font-display text-2xl font-bold">{formatBRL(Number(o.total))}</div>
          </div>
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            {o.items?.map((it, i) => (
              <div key={i} className="text-sm flex justify-between gap-3">
                <span className="text-foreground">{it.quantity}× {it.name}</span>
                <span className="text-muted-foreground">{formatBRL(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductsTab({ products, reload }: { products: DBProduct[]; reload: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>("picole");
  const [price, setPrice] = useState("");
  const [emoji, setEmoji] = useState("🍦");
  const [flavors, setFlavors] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("products").insert({
      name,
      category,
      price: Number(price),
      emoji,
      flavors: flavors.split(",").map(s => s.trim()).filter(Boolean),
      available: true,
    });
    if (error) {
      toast.error("Erro ao criar produto");
      return;
    }
    toast.success("Produto criado!");
    setName(""); setPrice(""); setFlavors(""); setShowForm(false);
    reload();
  };

  const toggle = async (p: DBProduct) => {
    await supabase.from("products").update({ available: !p.available }).eq("id", p.id);
    toast.success(p.available ? "Marcado como indisponível" : "Marcado como disponível");
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produto removido");
    reload();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Produtos extras adicionados pelo admin (o cardápio padrão sempre fica visível).
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-medium px-4 py-2 rounded-lg shadow-soft active:scale-95"
        >
          <Plus className="w-4 h-4" /> Novo produto
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-soft grid sm:grid-cols-2 gap-3">
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
      )}

      {products.length === 0 ? (
        <Empty msg="Nenhum produto extra cadastrado." />
      ) : (
        <div className="grid gap-3">
          {products.map((p) => (
            <div key={p.id} className={`bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-soft ${!p.available ? "opacity-60" : ""}`}>
              <div className="text-3xl">{p.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.category} • {formatBRL(Number(p.price))}</div>
                {p.flavors?.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 truncate">Sabores: {p.flavors.join(", ")}</div>
                )}
              </div>
              <button
                onClick={() => toggle(p)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${p.available ? "bg-tropical/15 text-tropical" : "bg-muted text-muted-foreground"}`}
              >
                {p.available ? "Disponível" : "Indisponível"}
              </button>
              <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive p-2" aria-label="Remover">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsTab({ top }: { top: { name: string; qty: number }[] }) {
  if (top.length === 0) return <Empty msg="Sem dados de vendas ainda." />;
  const max = top[0].qty;
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
      <h3 className="font-display text-xl font-bold mb-5">Produtos Mais Vendidos</h3>
      <div className="space-y-4">
        {top.map((t, i) => (
          <div key={t.name}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">#{i + 1} {t.name}</span>
              <span className="text-muted-foreground">{t.qty} vendido(s)</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-purple rounded-full transition-all" style={{ width: `${(t.qty / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
      {msg}
    </div>
  );
}
