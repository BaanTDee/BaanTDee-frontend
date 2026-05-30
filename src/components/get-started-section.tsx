import Link from "next/link";
import { CheckCircle2, Zap, Crown, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  {
    title: "ผู้ซื้อ",
    features: [
      "ค้นหาอสังหาฯ ทุกประเภทได้ง่าย",
      "ดูข้อมูลราคา ทำเล พร้อมแผนที่",
      "แชทกับผู้ขายได้โดยตรง",
      "ระบบยืนยันตัวตนเพื่อความปลอดภัย",
    ],
    cta: "เริ่มค้นหา",
    href: "/search",
    highlight: false,
  },
  {
    title: "ผู้ขาย",
    features: [
      "ลงประกาศง่าย ขั้นตอนไม่ยุ่งยาก",
      "อัพรูปได้สูงสุด 10 รูป คมชัด",
      "เลือกโซนเพื่อเพิ่มการมองเห็น",
      "ระบบหลังบ้านจัดการประกาศสะดวก",
    ],
    cta: "เริ่มลงขาย",
    href: "/listings/create",
    highlight: false,
  },
];

const PLANS = [
  { name: "Standard", price: 199, icon: <Zap className="h-3.5 w-3.5" />, color: "#2563eb", listings: "12 ประกาศ" },
  { name: "Pro",      price: 499, icon: <Crown className="h-3.5 w-3.5" />, color: "#1e3a8a", listings: "30 ประกาศ", badge: "แนะนำ" },
  { name: "Agency",  price: 1299, icon: <Building2 className="h-3.5 w-3.5" />, color: "#7c3aed", listings: "200 ประกาศ" },
];

export default function GetStartedSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-2xl font-bold text-gray-900">เริ่มต้นใช้งานเลย!</h2>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Role cards */}
        {roles.map((role) => (
          <div key={role.title} className="rounded-2xl border bg-white p-8 transition hover:shadow-lg">
            <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>
            <ul className="mt-6 space-y-4">
              {role.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  {feat}
                </li>
              ))}
            </ul>
            <Link href={role.href}>
              <Button variant="outline" className="mt-8 rounded-full px-8 border-gray-900 text-gray-900 hover:bg-gray-50">
                {role.cta}
              </Button>
            </Link>
          </div>
        ))}

        {/* Upgrade pricing card */}
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/60 to-white p-8 transition hover:shadow-lg ring-1 ring-blue-100 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-bold text-gray-900">อัปเกรดแพ็กเกจ</h3>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Pro</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">เพิ่มโควต้าประกาศ รูปคมชัดขึ้น และฟีเจอร์พิเศษ</p>

          <div className="space-y-3 flex-1">
            {PLANS.map((plan) => (
              <div key={plan.name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: plan.color }}>
                  {plan.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: plan.color }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{plan.listings}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">฿{plan.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/เดือน</span></span>
              </div>
            ))}
          </div>

          <Link href="/upgrade" className="mt-6">
            <Button className="w-full rounded-full bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center gap-2">
              ดูแพ็กเกจทั้งหมด <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
