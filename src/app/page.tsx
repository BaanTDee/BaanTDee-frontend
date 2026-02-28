import HeroSection from "@/components/hero-section";
import CategoryIcons from "@/components/category-icons";
import LatestListings from "@/components/latest-listings";
import FeaturedListings from "@/components/featured-listings";
import GetStartedSection from "@/components/get-started-section";

export default function Home() {
  return (
    <>
      {/* Hero — ซื้อ-ขาย อสังหาฯ ออนไลน์ */}
      <HeroSection />

      {/* Category icons — บ้าน คอนโด ที่ดิน ... */}
      <CategoryIcons />

      {/* ประกาศล่าสุด — horizontal scroll cards */}
      <LatestListings />

      {/* แนะนำสำหรับคุณ */}
      <FeaturedListings />

      {/* เริ่มต้นใช้งานเลย! — ผู้ซื้อ / ผู้ขาย / พรีเมียม */}
      <GetStartedSection />
    </>
  );
}
