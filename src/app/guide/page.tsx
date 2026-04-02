import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: "01",
    title: "สมัครสมาชิกฟรี",
    desc: "สร้างบัญชีด้วยอีเมล หรือล็อกอินง่ายๆ ผ่าน Google / Facebook ใช้เวลาไม่ถึง 1 นาที",
    tips: [
      "ใช้อีเมลที่เช็คได้ประจำ เพื่อรับการแจ้งเตือนจากผู้สนใจ",
      "กรอกข้อมูลโปรไฟล์ให้ครบเพื่อเพิ่มความน่าเชื่อถือ",
    ],
  },
  {
    step: "02",
    title: "กดปุ่ม \"ลงประกาศ\"",
    desc: "กดปุ่มสีน้ำเงิน \"ลงประกาศ\" ที่มุมขวาบนของหน้าเว็บ แล้วเลือกประเภทอสังหาริมทรัพย์ที่ต้องการลง",
    tips: [
      "เลือกประเภทให้ถูกต้อง: บ้านเดี่ยว คอนโด ทาวน์เฮาส์ ที่ดิน หรืออาคารพาณิชย์",
      "เลือกประเภทข้อเสนอ: ขาย เช่า หรือทั้งขายและเช่า",
    ],
  },
  {
    step: "03",
    title: "กรอกข้อมูลทรัพย์สิน",
    desc: "ใส่รายละเอียดทรัพย์สินให้ครบถ้วน ยิ่งข้อมูลมากและถูกต้อง ยิ่งมีโอกาสถูกค้นพบสูง",
    tips: [
      "ตั้งราคาให้สมเหตุสมผลตามราคาตลาด",
      "ระบุพื้นที่ใช้สอย จำนวนห้องนอน ห้องน้ำ และที่จอดรถ",
      "เขียนคำอธิบายที่ดึงดูด บอกจุดเด่นของทรัพย์",
      "ระบุที่อยู่ให้ชัดเจน หรือปักหมุดแผนที่",
    ],
  },
  {
    step: "04",
    title: "อัปโหลดรูปภาพ",
    desc: "อัปโหลดรูปภาพคุณภาพดีได้สูงสุด 10 รูป รูปภาพที่ดีช่วยเพิ่มโอกาสในการขาย/เช่าได้มากกว่า 3 เท่า",
    tips: [
      "ถ่ายรูปในเวลากลางวันที่แสงธรรมชาติดี",
      "ถ่ายทุกมุมสำคัญ: ด้านหน้า ห้องนั่งเล่น ห้องนอน ห้องน้ำ และครัว",
      "กำหนดรูปปกที่น่าสนใจที่สุด",
      "รองรับไฟล์ JPG, PNG ขนาดสูงสุด 10MB ต่อรูป",
    ],
  },
  {
    step: "05",
    title: "ตรวจสอบและเผยแพร่",
    desc: "ทบทวนข้อมูลทั้งหมดให้ครบถ้วนก่อนกดเผยแพร่ ทีมงาน BaanTDee จะตรวจสอบก่อนประกาศแสดงผล",
    tips: [
      "ตรวจสอบความถูกต้องของราคาและข้อมูลติดต่อ",
      "ประกาศมักได้รับการอนุมัติภายใน 24 ชั่วโมง",
      "แก้ไขประกาศได้ตลอดเวลาในหน้า \"ประกาศของฉัน\"",
    ],
  },
  {
    step: "06",
    title: "ดูแลและตอบกลับผู้สนใจ",
    desc: "เมื่อมีผู้สนใจส่งข้อความหรือนัดชม คุณจะได้รับการแจ้งเตือนทางอีเมลและในแอป",
    tips: [
      "ตอบกลับผู้สนใจให้เร็ว เพิ่มโอกาสปิดดีลสำเร็จ",
      "เปิดดูสถิติประกาศของคุณในหน้า Dashboard",
      "อัปเดตสถานะประกาศเมื่อขาย/เช่าได้แล้ว",
    ],
  },
];

const packages = [
  {
    name: "ฟรี",
    price: "ไม่มีค่าใช้จ่าย",
    features: ["ลงประกาศได้ 3 รายการ", "อัปโหลดรูป 10 รูป/ประกาศ", "แสดงผล 30 วัน", "รับข้อความจากผู้สนใจ"],
    highlight: false,
    cta: "เริ่มลงประกาศ",
    href: "/listings/create",
  },
  {
    name: "พรีเมียม",
    price: "ติดต่อสอบถาม",
    features: [
      "ลงประกาศไม่จำกัด",
      "แสดงผลสูงกว่าประกาศทั่วไป",
      "แสดงผลนานขึ้น",
      "มีทีมช่วยประสานงาน",
      "สถิติและ Analytics",
    ],
    highlight: true,
    cta: "สมัครพรีเมียม",
    href: "/contact",
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold">วิธีลงประกาศ</h1>
          <p className="mt-3 text-blue-100">ลงประกาศขายหรือเช่าอสังหาฯ ได้ง่ายๆ ใน 6 ขั้นตอน</p>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-10">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-900 text-lg font-bold text-white">
                  {s.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="mx-auto mt-2 h-full w-0.5 bg-blue-100" style={{ minHeight: 32 }} />
                )}
              </div>
              <div className="pb-2">
                <h2 className="text-lg font-bold text-gray-900">{s.title}</h2>
                <p className="mt-1 text-gray-600">{s.desc}</p>
                <ul className="mt-3 space-y-1.5">
                  {s.tips.map((tip, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild className="rounded-full bg-blue-900 px-10 hover:bg-blue-800">
            <Link href="/listings/create">เริ่มลงประกาศตอนนี้</Link>
          </Button>
        </div>
      </section>

      {/* Packages */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900">เลือกแพ็กเกจที่เหมาะกับคุณ</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-2xl border p-8 ${
                  pkg.highlight ? "border-blue-200 bg-blue-50/30 ring-1 ring-blue-100" : "bg-white"
                }`}
              >
                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                <p className="mt-1 text-sm text-blue-700 font-medium">{pkg.price}</p>
                <ul className="mt-5 space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={pkg.highlight ? "default" : "outline"}
                  className={`mt-6 w-full rounded-full ${pkg.highlight ? "bg-blue-900 hover:bg-blue-800" : ""}`}
                >
                  <Link href={pkg.href}>{pkg.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
