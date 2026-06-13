import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/lists/")({
  component: Lists,
});

function Lists() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const { data: lists } = useQuery({
    queryKey: ["lists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grocery_lists").select("*, grocery_items(id, purchased)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("grocery_lists").insert({ user_id: u.user.id, title });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("List created"); qc.invalidateQueries({ queryKey: ["lists"] }); setOpen(false); setTitle(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grocery_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["lists"] }); },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grocery lists</h1>
          <p className="text-sm text-muted-foreground">Organize your shopping into multiple lists.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New list</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a new list</DialogTitle></DialogHeader>
            <Input placeholder="e.g. Weekly groceries" value={title} onChange={(e) => setTitle(e.target.value)} />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!title.trim() || create.isPending} onClick={() => create.mutate()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(lists ?? []).map((l, i) => {
          const total = (l.grocery_items as { purchased: boolean }[] | null)?.length ?? 0;
          const done = (l.grocery_items as { purchased: boolean }[] | null)?.filter((x) => x.purchased).length ?? 0;
          return (
            <motion.div key={l.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md">
                <Link to="/lists/$listId" params={{ listId: l.id }} className="block">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><ShoppingBasket className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{l.title}</div>
                      <div className="text-xs text-muted-foreground">{done}/{total} purchased</div>
                    </div>
                  </div>
                </Link>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove.mutate(l.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {lists && lists.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No lists yet. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
}
