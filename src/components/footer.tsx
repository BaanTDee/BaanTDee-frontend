import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-blue-900">BaanTDee</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              แพลตฟอร์มซื้อ-ขาย-เช่า อสังหาริมทรัพย์
              <br />
              ที่น่าเชื่อถือที่สุด
            </p>
          </div>

          {/* หมวดหมู่ */}
          <div>
            <h4 className="font-semibold text-gray-900">หมวดหมู่</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/search?type=house" className="hover:text-blue-900">บ้านเดี่ยว</Link></li>
              <li><Link href="/search?type=condo" className="hover:text-blue-900">คอนโด</Link></li>
              <li><Link href="/search?type=townhouse" className="hover:text-blue-900">ทาวน์เฮาส์</Link></li>
              <li><Link href="/search?type=land" className="hover:text-blue-900">ที่ดิน</Link></li>
              <li><Link href="/search?type=commercial" className="hover:text-blue-900">อาคารพาณิชย์</Link></li>
            </ul>
          </div>

          {/* เกี่ยวกับเรา */}
          <div>
            <h4 className="font-semibold text-gray-900">เกี่ยวกับเรา</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-blue-900">เกี่ยวกับ BaanTDee</Link></li>
              <li><Link href="/contact" className="hover:text-blue-900">ติดต่อเรา</Link></li>
              <li><Link href="/terms" className="hover:text-blue-900">ข้อกำหนดการใช้งาน</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-900">นโยบายความเป็นส่วนตัว</Link></li>
            </ul>
          </div>

          {/* ช่วยเหลือ */}
          <div>
            <h4 className="font-semibold text-gray-900">ช่วยเหลือ</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-blue-900">คำถามที่พบบ่อย</Link></li>
              <li><Link href="/guide" className="hover:text-blue-900">วิธีลงประกาศ</Link></li>
              <li><Link href="/safety" className="hover:text-blue-900">ความปลอดภัย</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © 2026 BaanTDee. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
