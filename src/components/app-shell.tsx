import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Apple, LayoutDashboard, ListChecks, Package, BarChart3, User, LogOut, Moon, Sun, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/lists", label: "Grocery Lists", icon: ListChecks },
  { to: "/pantry", label: "Pantry", icon: Package },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <SidebarContent pathname={pathname} signOut={signOut} theme={theme} toggle={toggle} />
      </aside>

      {/* Mobile top bar */}
      <div className="flex w-full flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Apple className="h-4 w-4" /></span>
            Smart Grocery
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar md:hidden"
            >
              <div className="flex h-14 items-center justify-end px-2">
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
              </div>
              <SidebarContent pathname={pathname} signOut={signOut} theme={theme} toggle={toggle} onNav={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({
  pathname, signOut, theme, toggle, onNav,
}: {
  pathname: string; signOut: () => void;
  theme: string; toggle: () => void; onNav?: () => void;
}) {
  return (
    <>
      <div className="hidden h-16 items-center gap-2 border-b px-6 font-bold md:flex">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Apple className="h-5 w-5" /></span>
        Smart Grocery
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to} to={item.to} onClick={onNav}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t p-3">
        <Button variant="ghost" className="w-full justify-start" onClick={toggle}>
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </>
  );
}
