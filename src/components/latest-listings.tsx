import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ListingCard from "@/components/listing-card";

// Mock data — จะเปลี่ยนเป็น fetch จาก API ทีหลัง
const mockListings = [
  {
    title: "บ้านเดี่ยว 2 ชั้น สภาพใหม่มาก",
    location: "หนองหญ้าไซ สุพรรณบุรี",
    price: "1,550,000",
    image: "/placeholder-house.svg",
    tag: "HOT" as const,
    ownerType: "เจ้าของขายเอง",
  },
  {
    title: "Blue Lagoon Hua Hin Condo",
    location: "ชะอำ เพชรบุรี",
    price: "8,700,000",
    image: "/placeholder-house.svg",
    tag: "HOT" as const,
    ownerType: "เจ้าของขายเอง",
  },
  {
    title: "ขายบ้านเดี่ยว 6 ห้องนอน 4 ห้องน้ำ",
    location: "หางดง เชียงใหม่",
    price: "7,990,000",
    image: "/placeholder-house.svg",
    tag: "HOT" as const,
    ownerType: "เจ้าของขายเอง",
  },
  {
    title: "ขายบ้านเดี่ยวมือสองใกล้เมือง",
    location: "เมืองสงขลา สงขลา",
    price: "2,100,000",
    image: "/placeholder-house.svg",
    tag: "PREMIUM" as const,
    ownerType: "เจ้าของขายเอง",
  },
  {
    title: "ที่ดินหนองจอก",
    location: "หนองจอก กรุงเทพมหานคร",
    price: "1,100,000",
    image: "/placeholder-house.svg",
    tag: "HOT" as const,
    ownerType: "เจ้าของขายเอง",
  },
  {
    title: "ขายบ้าน 41 ตรว หลังริม",
    location: "วังทองหลาง กรุงเทพฯ",
    price: "7,900,000",
    image: "/placeholder-house.svg",
    tag: "PREMIUM" as const,
    ownerType: "เจ้าของขายเอง",
  },
  {
    title: "คอนโด ริมแม่น้ำ วิวสวย",
    location: "บางพลัด กรุงเทพฯ",
    price: "3,200,000",
    image: "/placeholder-house.svg",
    tag: "NEW" as const,
    ownerType: "นายหน้า",
  },
];

const tabs = ["ทั้งหมด", "บ้านเดี่ยว", "คอนโด", "ทาวน์เฮาส์", "ที่ดิน"];

export default function LatestListings() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">ประกาศล่าสุด</h2>
        <Link
          href="/search"
          className="flex items-center gap-1 text-sm text-blue-900 hover:underline"
        >
          ดูทั้งหมด <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-4 border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={`pb-2 text-sm font-medium transition ${
              i === 0
                ? "border-b-2 border-blue-900 text-blue-900"
                : "text-muted-foreground hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Scrollable listing cards */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {mockListings.map((listing, i) => (
          <ListingCard key={i} {...listing} />
        ))}
      </div>
    </section>
  );
}
