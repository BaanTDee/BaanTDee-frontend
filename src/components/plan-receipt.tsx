"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { accessValidUntil, type BillingPeriod, type Plan } from "@/lib/plans";

/** Animated success checkmark (transitions.dev success-check, .t-success-check).
 *  Renders with data-state="in" so it plays once on mount. */
function SuccessCheck() {
  return (
    <span className="t-success-check" data-state="in" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
        <path
          d="M14 25 l7 7 l13 -15"
          stroke="#16a34a"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

interface SuccessReceiptProps {
  plan: Plan;
  period: BillingPeriod;
}

/** Post-payment receipt: product name, details, price, and valid-until. */
export function SuccessReceipt({ plan, period }: SuccessReceiptProps) {
  const router = useRouter();
  const price = plan[period].price;

  const rows: { label: string; value: string }[] = [
    { label: "แพ็กเกจ", value: plan.displayName },
    { label: "รายละเอียด", value: plan.features.join(" · ") },
    { label: "ราคา", value: `฿${price.toLocaleString()}` },
    { label: "รอบการใช้งาน", value: period === "annual" ? "รายปี (12 เดือน)" : "รายเดือน (30 วัน)" },
    { label: "ใช้งานได้ถึง", value: accessValidUntil(period) },
  ];

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_24px_60px_-20px_rgba(22,163,74,0.25)]">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-50 ring-8 ring-green-50">
            <SuccessCheck />
          </div>

          <h1 className="text-center text-2xl font-bold text-gray-900">ชำระเงินสำเร็จ</h1>
          <p className="mt-1 text-center text-sm text-gray-500">แพ็กเกจของคุณพร้อมใช้งานแล้ว 🎉</p>

          <dl className="mt-6 divide-y divide-dashed divide-gray-100 rounded-2xl bg-gray-50/70 px-4">
            {rows.map((r) => (
              <div key={r.label} className="flex items-start justify-between gap-4 py-3">
                <dt className="shrink-0 text-sm text-gray-500">{r.label}</dt>
                <dd className="text-right text-sm font-semibold text-gray-900">{r.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="h-11 flex-1" asChild>
              <Link href="/">หน้าหลัก</Link>
            </Button>
            <Button className="btn-vibrant h-11 flex-1 text-white" onClick={() => router.push("/profile")}>
              ดูโปรไฟล์
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
