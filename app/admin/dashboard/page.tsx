"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { LayoutDashboard, TrendingUp, ShoppingBag, Receipt, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface TopProduct {
  name: string;
  total_qty: number;
  total_revenue: number;
}

interface HourlyData {
  hour: number;
  count: number;
}

interface Stats {
  todayRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  monthOrders: number;
  avgTicket: number;
  topProducts: TopProduct[];
  hourlyOrders: HourlyData[];
}

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [todayRes, monthRes, itemsRes, allOrdersRes] = await Promise.all([
        supabase.from("orders").select("total").eq("status", "delivered").gte("created_at", todayStart),
        supabase.from("orders").select("total").eq("status", "delivered").gte("created_at", monthStart),
        supabase.from("order_items").select("quantity, unit_price, product:products(name)").gte("created_at", monthStart),
        supabase.from("orders").select("created_at").eq("status", "delivered").gte("created_at", monthStart),
      ]);

      const todayOrders = todayRes.data ?? [];
      const monthOrders = monthRes.data ?? [];
      const items = (itemsRes.data ?? []) as unknown as Array<{ quantity: number; unit_price: number; product: { name: string } | null }>;
      const allOrders = (allOrdersRes.data ?? []) as Array<{ created_at: string }>;

      const todayRevenue = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0);
      const monthRevenue = monthOrders.reduce((s, o) => s + (o.total ?? 0), 0);
      const avgTicket = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0;

      // Top products
      const productMap: Record<string, TopProduct> = {};
      for (const item of items) {
        const name = item.product?.name ?? "Desconhecido";
        if (!productMap[name]) productMap[name] = { name, total_qty: 0, total_revenue: 0 };
        productMap[name].total_qty += item.quantity;
        productMap[name].total_revenue += item.quantity * item.unit_price;
      }
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 7);

      // Hourly distribution
      const hourMap: Record<number, number> = {};
      for (const o of allOrders) {
        const h = new Date(o.created_at).getHours();
        hourMap[h] = (hourMap[h] ?? 0) + 1;
      }
      const hourlyOrders = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourMap[i] ?? 0,
      })).filter((h) => h.count > 0);

      setStats({ todayRevenue, todayOrders: todayOrders.length, monthRevenue, monthOrders: monthOrders.length, avgTicket, topProducts, hourlyOrders });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border p-5 h-28 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Faturamento Hoje", value: formatCurrency(stats.todayRevenue), icon: TrendingUp, color: "text-green-500" },
    { label: "Pedidos Hoje", value: stats.todayOrders, icon: ShoppingBag, color: "text-blue-500" },
    { label: "Faturamento do Mês", value: formatCurrency(stats.monthRevenue), icon: Receipt, color: "text-primary" },
    { label: "Ticket Médio", value: formatCurrency(stats.avgTicket), icon: Users, color: "text-purple-500" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Resumo de vendas — mês atual</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <div className="bg-card rounded-2xl border p-5">
          <h2 className="font-semibold mb-4">🏆 Top Produtos do Mês</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  formatter={(value) => [`${value} un`, "Quantidade"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="total_qty" fill="oklch(0.60 0.21 46)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hourly Distribution */}
        <div className="bg-card rounded-2xl border p-5">
          <h2 className="font-semibold mb-4">⏰ Pedidos por Hora</h2>
          {stats.hourlyOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.hourlyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(h) => `${h}h`}
                  formatter={(v) => [v, "Pedidos"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Line type="monotone" dataKey="count" stroke="oklch(0.60 0.21 46)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
