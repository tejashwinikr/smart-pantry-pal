import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Apple, Bell, ListChecks, PieChart, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Grocery Planner — Plan, track, waste less" },
      { name: "description", content: "Manage grocery lists, track pantry expiry dates, and cut food waste with a beautifully simple planner." },
      { property: "og:title", content: "Smart Grocery Planner" },
      { property: "og:description", content: "Plan groceries, track pantry expiry dates, and stop wasting food." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Apple className="h-5 w-5" /></span>
          Smart Grocery
        </div>
        <div className="flex gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button>Get started</Button></Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/30 px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Less waste. Smarter shopping.
          </span>
          <h1 className="mt-5 text-balance text-5xl font-extrabold tracking-tight md:text-6xl">
            Your pantry, your lists,<br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">all in one place.</span>
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground">
            Track expiry dates, build grocery lists, and never buy the same forgotten jar twice. Smart Grocery Planner keeps your kitchen organized.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="h-12 px-7 text-base">Start free</Button></Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-20 grid gap-5 md:grid-cols-3"
        >
          {[
            { icon: ListChecks, title: "Smart lists", desc: "Multiple grocery lists, categorized & shareable." },
            { icon: Bell, title: "Expiry alerts", desc: "Get warned 7 days before food goes bad." },
            { icon: PieChart, title: "Insights", desc: "See spending and waste trends at a glance." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        <div className="mt-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" /> Your data is private and only visible to you.
        </div>
      </main>
    </div>
  );
}
