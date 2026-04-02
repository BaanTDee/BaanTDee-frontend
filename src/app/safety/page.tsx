import { Shield, AlertTriangle, Eye, MessageCircle, Phone, Flag } from "lucide-react";
import Link from "next/link";

const buyerTips = [
  {
    title: "ยืนยันตัวตนผู้ขายก่อนเสมอ",
    desc: "ตรวจสอบแบดจ์ยืนยันตัวตน ดูรีวิวและประวัติของผู้ลงประกาศ ขอเอกสารยืนยันตัวตน เช่น บัตรประชาชน ก่อนการนัดหมาย",
  },
  {
    title: "นัดดูทรัพย์สินจริงก่อนตัดสินใจ",
    desc: "อย่าซื้อหรือโอนเงินโดยไม่เคยเห็นทรัพย์สินจริงๆ นัดดูทรัพย์ในเวลากลางวัน และพาบุคคลที่ไว้วางใจไปด้วย",
  },
  {
    title: "ตรวจสอบเอกสารทรัพย์สิน",
    desc: "ขอดูโฉนด สัญญา หรือเอกสารที่เกี่ยวข้องก่อนโอนเงิน และปรึกษาทนายความหรือผู้เชี่ยวชาญหากต้องการ",
  },
  {
    title: "ระวังราคาที่ถูกผิดปกติ",
    desc: "หากราคาต่ำกว่าราคาตลาดมากผิดปกติ ควรระวัง อาจเป็นการหลอกลวง ตรวจสอบราคาตลาดในพื้นที่เดียวกันก่อนเสมอ",
  },
  {
    title: "อย่าโอนเงินมัดจำก่อนตรวจสอบ",
    desc: "ไม่ควรโอนเงินมัดจำหรือค่าจอง โดยไม่มีสัญญาที่ถูกต้อง หรือก่อนที่จะตรวจสอบความถูกต้องของทรัพย์สิน",
  },
];

const sellerTips = [
  {
    title: "ระวังผู้ซื้อที่เร่งรีบผิดปกติ",
    desc: "ผู้ซื้อที่เร่งรีบให้ตัดสินใจเร็ว หรือขอข้อมูลส่วนตัวมากเกินความจำเป็น ควรระวัง",
  },
  {
    title: "ให้ข้อมูลส่วนตัวเฉพาะที่จำเป็น",
    desc: "ไม่ควรให้เลขบัตรประชาชน ข้อมูลธนาคาร หรือข้อมูลส่วนตัวอื่นๆ แก่ผู้ซื้อที่ยังไม่รู้จัก",
  },
  {
    title: "นัดพบในที่ที่ปลอดภัย",
    desc: "หากนัดพบผู้ซื้อครั้งแรก เลือกสถานที่สาธารณะที่มีคนพลุกพล่าน หรือพาบุคคลอื่นไปด้วย",
  },
];

const redFlags = [
  "ร้องขอให้โอนเงินก้อนใหญ่ก่อนดูทรัพย์จริง",
  "ราคาต่ำกว่าราคาตลาดมากผิดปกติโดยไม่มีเหตุผล",
  "ผู้ลงประกาศไม่ยอมให้นัดดูทรัพย์สินจริง",
  "ขอข้อมูลส่วนตัวหรือข้อมูลธนาคารเกินความจำเป็น",
  "เร่งรีบให้ตัดสินใจ บอกว่ามีผู้สนใจอีกหลายราย",
  "เอกสารทรัพย์สินดูผิดปกติหรือไม่ครบถ้วน",
  "ขอให้ทำธุรกรรมนอกระบบ BaanTDee เพื่อหลีกเลี่ยงค่าธรรมเนียม",
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-200" />
          <h1 className="mt-4 text-4xl font-bold">ความปลอดภัย</h1>
          <p className="mt-3 text-blue-100">
            BaanTDee ใส่ใจความปลอดภัยของผู้ใช้ทุกคน อ่านคำแนะนำเหล่านี้ก่อนทำธุรกรรม
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        {/* Buyer tips */}
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">สำหรับผู้ซื้อ / ผู้เช่า</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buyerTips.map((tip, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                  {i + 1}
                </div>
                <h3 className="mt-3 font-bold text-gray-900">{tip.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Seller tips */}
        <div className="mt-14">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">สำหรับผู้ขาย / ผู้ให้เช่า</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {sellerTips.map((tip, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5">
                <h3 className="font-bold text-gray-900">{tip.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Red flags */}
        <div className="mt-14">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">สัญญาณอันตรายที่ต้องระวัง</h2>
          </div>
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-6">
            <ul className="space-y-3">
              {redFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Report & Contact */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6">
            <Flag className="h-7 w-7 text-orange-500" />
            <h3 className="mt-3 font-bold text-gray-900">รายงานประกาศน่าสงสัย</h3>
            <p className="mt-2 text-sm text-gray-600">
              กดปุ่ม "รายงาน" ในหน้าประกาศ หรือส่งข้อความมาที่ทีมงาน BaanTDee
              เราจะตรวจสอบและดำเนินการภายใน 24 ชั่วโมง
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
            >
              แจ้งทีมงาน →
            </Link>
          </div>
          <div className="rounded-2xl border bg-white p-6">
            <Phone className="h-7 w-7 text-blue-600" />
            <h3 className="mt-3 font-bold text-gray-900">ฉุกเฉิน — โทรแจ้งตำรวจ</h3>
            <p className="mt-2 text-sm text-gray-600">
              หากถูกหลอกลวงหรืออยู่ในสถานการณ์อันตราย โทรแจ้งตำรวจทันที
            </p>
            <p className="mt-3 text-2xl font-bold text-blue-900">191</p>
            <p className="text-sm text-gray-500">สายด่วนตำรวจ 24 ชั่วโมง</p>
          </div>
        </div>
      </section>
    </div>
  );
}
