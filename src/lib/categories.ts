export const CATEGORIES = [
  "Fruits", "Vegetables", "Dairy", "Meat", "Bakery",
  "Snacks", "Beverages", "Household", "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const UNITS = ["kg", "g", "liters", "ml", "pieces", "packets", "boxes"] as const;
export type Unit = (typeof UNITS)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Fruits: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  Vegetables: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  Dairy: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200",
  Meat: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200",
  Bakery: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  Snacks: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200",
  Beverages: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200",
  Household: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  Other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};
