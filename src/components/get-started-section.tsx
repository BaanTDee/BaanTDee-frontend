import { CheckCircle2 } from "lucide-react";
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
    ctaVariant: "outline" as const,
    href: "/search",
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
    ctaVariant: "outline" as const,
    href: "/post",
  },
  {
    title: "ผู้ขายระดับพรีเมียม",
    features: [
      "มีทีมคอยช่วยประสานงานในการขาย",
      "ระบบช่วยจัดการการนัดชมหลายราย",
      "รับรู้ผลตั้นการขายอย่างรวดเร็ว",
      "เพิ่มเทคนิคเปิดการมองเห็นประกาศ",
    ],
    cta: "เริ่มสมัครเลย!",
    ctaVariant: "default" as const,
    href: "/premium",
    highlight: true,
  },
];

export default function GetStartedSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-2xl font-bold text-gray-900">เริ่มต้นใช้งานเลย!</h2>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {roles.map((role) => (
          <div
            key={role.title}
            className={`rounded-2xl border p-8 transition hover:shadow-lg ${
              role.highlight
                ? "border-blue-200 bg-blue-50/30 ring-1 ring-blue-100"
                : "bg-white"
            }`}
          >
            <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>

            <ul className="mt-6 space-y-4">
              {role.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  {feat}
                </li>
              ))}
            </ul>

            <Button
              variant={role.ctaVariant}
              className={`mt-8 rounded-full px-8 ${
                role.highlight
                  ? "bg-blue-900 text-white hover:bg-blue-800"
                  : "border-gray-900 text-gray-900 hover:bg-gray-50"
              }`}
            >
              {role.cta}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
