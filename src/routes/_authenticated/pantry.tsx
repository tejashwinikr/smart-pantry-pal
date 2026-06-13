import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";
import { QuickAddPantryDialog, usePantry } from "@/components/quick-add-pantry";

export const Route = createFileRoute("/_authenticated/pantry")({
  component: Pantry,
});

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function Pantry() {
  const qc = useQueryClient();
  const { data: items, isLoading } = usePantry();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const updateQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase.from("pantry_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("pantry_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["pantry"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  const filtered = (items ?? []).filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "all") return true;
    if (filter === "expiring") { const d = daysUntil(p.expiry_date); return d !== null && d <= 7; }
    if (filter === "out") return Number(p.quantity) <= 0;
    return p.category === filter;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pantry</h1>
          <p className="text-sm text-muted-foreground">Track what you have and when it expires.</p>
        </div>
        <QuickAddPantryDialog />
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="expiring">Expiring ≤ 7 days</SelectItem>
            <SelectItem value="out">Out of stock</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filtered.map((p) => {
            const d = daysUntil(p.expiry_date);
            const expiring = d !== null && d <= 7 && d >= 0;
            const expired = d !== null && d < 0;
            return (
              <motion.div key={p.id} layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.name}</div>
                    <Badge variant="secondary" className={`mt-1 ${CATEGORY_COLORS[p.category] ?? ""}`}>{p.category}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => updateQty.mutate({ id: p.id, quantity: Math.max(0, Number(p.quantity) - 1) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center text-lg font-semibold">{Number(p.quantity)} <span className="text-xs font-normal text-muted-foreground">{p.unit}</span></div>
                  <Button variant="outline" size="icon" onClick={() => updateQty.mutate({ id: p.id, quantity: Number(p.quantity) + 1 })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {p.expiry_date && (
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Expires {new Date(p.expiry_date).toLocaleDateString()}</span>
                    {expired ? <Badge variant="destructive">Expired</Badge>
                      : expiring ? <Badge className="bg-warning text-warning-foreground hover:bg-warning">{d}d left</Badge>
                      : <Badge variant="outline">{d}d</Badge>}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No items match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
