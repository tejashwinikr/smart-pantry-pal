import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, AlertTriangle, ShoppingCart, Repeat, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QuickAddPantryDialog } from "@/components/quick-add-pantry";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function daysUntil(date: string | null) {
  if (!date) return Infinity;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [pantry, items, freq] = await Promise.all([
        supabase.from("pantry_items").select("*").order("expiry_date", { ascending: true, nullsFirst: false }),
        supabase.from("grocery_items").select("*").eq("purchased", false),
        supabase.from("frequent_items").select("*").order("purchase_count", { ascending: false }).limit(5),
      ]);
      return {
        pantry: pantry.data ?? [],
        items: items.data ?? [],
        frequent: freq.data ?? [],
      };
    },
  });

  const expiringSoon = (data?.pantry ?? []).filter((p) => {
    const d = daysUntil(p.expiry_date);
    return d >= 0 && d <= 7;
  });

  const stats = [
    { label: "Pantry items", value: data?.pantry.length ?? 0, icon: Package, color: "text-primary bg-primary/10" },
    { label: "Expiring soon", value: expiringSoon.length, icon: AlertTriangle, color: "text-accent-foreground bg-accent/30" },
    { label: "Active list items", value: data?.items.length ?? 0, icon: ShoppingCart, color: "text-chart-3 bg-chart-3/10" },
    { label: "Frequent items", value: data?.frequent.length ?? 0, icon: Repeat, color: "text-chart-4 bg-chart-4/10" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your kitchen at a glance.</p>
        </div>
        <QuickAddPantryDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <div className="mt-4 text-3xl font-bold">{isLoading ? "—" : s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-accent-foreground" /> Expiring soon
          </div>
          <div className="mt-4 space-y-2">
            {expiringSoon.length === 0 && <p className="text-sm text-muted-foreground">Nothing's about to expire. Nice.</p>}
            {expiringSoon.slice(0, 6).map((p) => {
              const d = daysUntil(p.expiry_date);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.quantity} {p.unit}</div>
                  </div>
                  <Badge variant={d <= 2 ? "destructive" : "secondary"}>
                    {d <= 0 ? "Today" : `${d}d`}
                  </Badge>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" /> Most purchased
          </div>
          <div className="mt-4 space-y-2">
            {(data?.frequent ?? []).length === 0 && <p className="text-sm text-muted-foreground">Mark grocery items as purchased to see your frequents.</p>}
            {(data?.frequent ?? []).map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <div>
                  <div className="font-medium">{f.item_name}</div>
                  <div className="text-xs text-muted-foreground">{f.category}</div>
                </div>
                <Badge variant="outline">×{f.purchase_count}</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
