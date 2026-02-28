import {
  Home,
  Building2,
  Landmark,
  TreePine,
  Store,
  Warehouse,
  Castle,
  MoreHorizontal,
} from "lucide-react";

const categories = [
  { icon: Home, label: "บ้านเดี่ยว", href: "/search?type=house" },
  { icon: Building2, label: "คอนโด", href: "/search?type=condo" },
  { icon: Landmark, label: "ทาวน์เฮาส์", href: "/search?type=townhouse" },
  { icon: TreePine, label: "ที่ดิน", href: "/search?type=land" },
  { icon: Store, label: "อาคารพาณิชย์", href: "/search?type=commercial" },
  { icon: Warehouse, label: "โกดัง/โรงงาน", href: "/search?type=warehouse" },
  { icon: Castle, label: "รีสอร์ท/โรงแรม", href: "/search?type=resort" },
  { icon: MoreHorizontal, label: "เพิ่มเติม", href: "/search" },
];

export default function CategoryIcons() {
  return (
    <section className="mx-auto max-w-7xl px-4 -mt-8 relative z-10">
      <div className="rounded-2xl bg-white p-6 shadow-lg border">
        <div className="grid grid-cols-4 gap-4 md:grid-cols-8">
          {categories.map((cat) => (
            <a
              key={cat.label}
              href={cat.href}
              className="flex flex-col items-center gap-2 rounded-xl p-3 transition hover:bg-blue-50 group"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 group-hover:bg-blue-100 transition">
                <cat.icon className="h-7 w-7 text-gray-600 group-hover:text-blue-900 transition" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center group-hover:text-blue-900">
                {cat.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
