import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Download, Sparkles, Package } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/lists/$listId")({
  component: ListDetail,
});

function ListDetail() {
  const { listId } = Route.useParams();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [quantity, setQuantity] = useState(1);

  const { data: list } = useQuery({
    queryKey: ["list", listId],
    queryFn: async () => {
      const { data } = await supabase.from("grocery_lists").select("*").eq("id", listId).maybeSingle();
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["list-items", listId],
    queryFn: async () => {
      const { data, error } = await supabase.from("grocery_items").select("*").eq("list_id", listId).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: frequent } = useQuery({
    queryKey: ["frequent-short"],
    queryFn: async () => {
      const { data } = await supabase.from("frequent_items").select("*").order("purchase_count", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async (payload: { name: string; category: string; quantity: number }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("grocery_items").insert({
        list_id: listId, user_id: u.user.id,
        name: payload.name, category: payload.category, quantity: payload.quantity,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["list-items", listId] }); setName(""); setQuantity(1); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, purchased }: { id: string; purchased: boolean }) => {
      const { error } = await supabase.from("grocery_items").update({ purchased }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["list-items", listId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["frequent"] });
      qc.invalidateQueries({ queryKey: ["frequent-short"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("grocery_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["list-items", listId] }),
  });

  const addMissingFromPantry = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data: pantry } = await supabase.from("pantry_items").select("*");
      const low = (pantry ?? []).filter((p) => Number(p.quantity) <= 1);
      if (low.length === 0) throw new Error("No low-stock pantry items");
      const rows = low.map((p) => ({
        list_id: listId, user_id: u.user!.id, name: p.name, category: p.category, quantity: 1,
      }));
      const { error } = await supabase.from("grocery_items").insert(rows);
      if (error) throw error;
      return low.length;
    },
    onSuccess: (n) => { toast.success(`Added ${n} item${n === 1 ? "" : "s"} from pantry`); qc.invalidateQueries({ queryKey: ["list-items", listId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportPdf = () => {
    if (!list || !items) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(list.title, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text(new Date().toLocaleDateString(), 14, 27);
    doc.setTextColor(0);
    let y = 40;
    const byCat: Record<string, typeof items> = {};
    items.forEach((i) => { (byCat[i.category] ??= []).push(i); });
    Object.entries(byCat).forEach(([cat, list]) => {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(cat, 14, y); y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      list.forEach((i) => {
        doc.text(`${i.purchased ? "[x]" : "[ ]"} ${i.name}  (${i.quantity})`, 18, y);
        y += 6;
        if (y > 280) { doc.addPage(); y = 20; }
      });
      y += 3;
    });
    doc.save(`${list.title}.pdf`);
  };

  const addFrequent = (f: { item_name: string; category: string | null }) => {
    add.mutate({ name: f.item_name, category: f.category ?? "Other", quantity: 1 });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/lists" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to lists
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{list?.title ?? "..."}</h1>
          <p className="text-sm text-muted-foreground">{items?.length ?? 0} items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => addMissingFromPantry.mutate()}>
            <Package className="mr-2 h-4 w-4" /> Add low-stock
          </Button>
          <Button variant="outline" onClick={exportPdf}><Download className="mr-2 h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-[1fr_180px_100px_auto]">
          <Input placeholder="Add item..." value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name && add.mutate({ name, category, quantity })} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <Button disabled={!name.trim() || add.isPending} onClick={() => add.mutate({ name, category, quantity })}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {(frequent ?? []).length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Quick add frequent
            </div>
            <div className="flex flex-wrap gap-2">
              {frequent!.map((f) => (
                <button key={f.id} onClick={() => addFrequent(f)}
                  className="rounded-full border bg-secondary/40 px-3 py-1 text-xs font-medium transition hover:bg-secondary">
                  + {f.item_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {(items ?? []).map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm"
            >
              <Checkbox checked={it.purchased} onCheckedChange={(v) => toggle.mutate({ id: it.id, purchased: !!v })} />
              <div className="min-w-0 flex-1">
                <div className={`truncate font-medium ${it.purchased ? "text-muted-foreground line-through" : ""}`}>{it.name}</div>
                <div className="text-xs text-muted-foreground">Qty {it.quantity}</div>
              </div>
              <Badge variant="secondary" className={CATEGORY_COLORS[it.category] ?? ""}>{it.category}</Badge>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(it.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
        {items && items.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No items yet. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
