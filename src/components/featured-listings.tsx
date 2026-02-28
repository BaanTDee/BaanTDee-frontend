import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ListingCard from "@/components/listing-card";

// Mock featured listings
const featuredListings = [
  {
    title: "บ้านเดี่ยว โครงการหรู พร้อมสระ",
    location: "บางนา กรุงเทพฯ",
    price: "12,500,000",
    image: "/placeholder-house.svg",
    tag: "PREMIUM" as const,
    ownerType: "เจ้าของขายเอง",
  },
  {
    title: "คอนโดวิวทะเล ชั้น 25",
    location: "ศรีราชา ชลบุรี",
    price: "4,800,000",
    image: "/placeholder-house.svg",
    tag: "HOT" as const,
    ownerType: "นายหน้า",
  },
  {
    title: "ทาวน์เฮาส์ 3 ชั้น ใกล้ BTS",
    location: "ลาดพร้าว กรุงเทพฯ",
    price: "5,500,000",
    image: "/placeholder-house.svg",
    tag: "NEW" as const,
    ownerType: "เจ้าของขายเอง",
  },
  {
    title: "ที่ดินเปล่า 100 ตรว ใกล้ถนนใหญ่",
    location: "เมือง นครราชสีมา",
    price: "2,000,000",
    image: "/placeholder-house.svg",
    tag: "HOT" as const,
  },
  {
    title: "อาคารพาณิชย์ 4 ชั้น ติดถนน",
    location: "หาดใหญ่ สงขลา",
    price: "9,800,000",
    image: "/placeholder-house.svg",
    tag: "PREMIUM" as const,
    ownerType: "นายหน้า",
  },
  {
    title: "บ้านสวน พร้อมที่ดิน 1 ไร่",
    location: "สันทราย เชียงใหม่",
    price: "6,300,000",
    image: "/placeholder-house.svg",
    tag: "NEW" as const,
    ownerType: "เจ้าของขายเอง",
  },
];

export default function FeaturedListings() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">แนะนำสำหรับคุณ</h2>
        <Link
          href="/search"
          className="flex items-center gap-1 text-sm text-blue-900 hover:underline"
        >
          ดูทั้งหมด <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Scrollable listing cards */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {featuredListings.map((listing, i) => (
          <ListingCard key={i} {...listing} />
        ))}
      </div>
    </section>
  );
}
