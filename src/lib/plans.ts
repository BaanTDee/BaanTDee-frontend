// Subscription plan catalog — shared by the upgrade page and the
// payment-return page so plan metadata lives in exactly one place.

export type PlanName = "standard" | "pro" | "agency";
export type BillingPeriod = "monthly" | "annual";
export type PlanKey =
  | "standard_monthly" | "pro_monthly" | "agency_monthly"
  | "standard_annual"  | "pro_annual"  | "agency_annual";

export interface PlanPricing { key: PlanKey; price: number }
export interface Plan {
  name: PlanName;
  displayName: string;
  color: string;
  badge?: string;
  features: string[];
  monthly: PlanPricing;
  annual: PlanPricing;
}

export const PLAN_DATA: Plan[] = [
  {
    name: "standard",
    displayName: "Standard",
    color: "#2563eb",
    features: ["12 ประกาศ", "10 รูป/ประกาศ"],
    monthly: { key: "standard_monthly", price: 199 },
    annual:  { key: "standard_annual",  price: 2200 },
  },
  {
    name: "pro",
    displayName: "Pro",
    color: "#4f46e5",
    badge: "แนะนำ",
    features: ["30 ประกาศ", "15 รูป/ประกาศ"],
    monthly: { key: "pro_monthly", price: 499 },
    annual:  { key: "pro_annual",  price: 5400 },
  },
  {
    name: "agency",
    displayName: "Agency",
    color: "#7c3aed",
    features: ["200 ประกาศ", "20 รูป/ประกาศ", "ทีม 5 คน"],
    monthly: { key: "agency_monthly", price: 1299 },
    annual:  { key: "agency_annual",  price: 14000 },
  },
];

export function findPlan(name: PlanName): Plan {
  return PLAN_DATA.find((p) => p.name === name)!;
}

/** Resolve a plan key (e.g. "pro_annual") back to its plan + billing period. */
export function findPlanByKey(key: string): { plan: Plan; period: BillingPeriod } | null {
  for (const plan of PLAN_DATA) {
    if (plan.monthly.key === key) return { plan, period: "monthly" };
    if (plan.annual.key === key) return { plan, period: "annual" };
  }
  return null;
}

// ponytail: display estimate — backend is the real source of truth for
// the expiry date. Monthly = +30 days, annual = +1 year from purchase.
export function accessValidUntil(period: BillingPeriod, from: Date = new Date()): string {
  const d = new Date(from);
  if (period === "annual") d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}
