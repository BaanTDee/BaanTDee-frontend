import { CheckCircle2, Home, Users, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "ประกาศทรัพย์สิน", value: "10,000+", desc: "รายการทั่วประเทศ" },
  { label: "ผู้ใช้งาน", value: "50,000+", desc: "ที่ไว้วางใจเรา" },
  { label: "จังหวัด", value: "77", desc: "ครอบคลุมทุกจังหวัด" },
  { label: "ปีที่ให้บริการ", value: "3+", desc: "ประสบการณ์ด้านอสังหาฯ" },
];

const values = [
  {
    icon: Shield,
    title: "ความน่าเชื่อถือ",
    desc: "ตรวจสอบประกาศทุกรายการก่อนเผยแพร่ เพื่อให้ผู้ใช้มั่นใจได้ว่าข้อมูลถูกต้องและปลอดภัย",
  },
  {
    icon: Users,
    title: "เป็นมิตรกับผู้ใช้",
    desc: "ออกแบบระบบให้ใช้งานง่าย ไม่ซับซ้อน ทั้งผู้ซื้อ ผู้ขาย และผู้เช่าสามารถเริ่มได้ทันที",
  },
  {
    icon: Home,
    title: "ครอบคลุมทุกประเภท",
    desc: "บ้านเดี่ยว คอนโด ทาวน์เฮาส์ ที่ดิน และอาคารพาณิชย์ ครบในที่เดียว",
  },
  {
    icon: TrendingUp,
    title: "ข้อมูลตลาดจริง",
    desc: "ราคาตลาดอัปเดตสม่ำเสมอ ช่วยให้ตัดสินใจได้อย่างมีข้อมูลรองรับ",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">เกี่ยวกับ BaanTDee</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            แพลตฟอร์มซื้อ-ขาย-เช่าอสังหาริมทรัพย์ที่เป็นมิตรที่สุด
            ช่วยให้คนไทยทุกคนเข้าถึงตลาดอสังหาฯ ได้อย่างง่ายดายและปลอดภัย
          </p>
        </div>
      </section>

      {/* Stats — TODO: เปิดเมื่อมีข้อมูลจริง */}
      {/* <section className="border-b bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-blue-900">{s.value}</div>
                <div className="mt-1 font-semibold text-gray-900">{s.label}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">พันธกิจของเรา</h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              BaanTDee ก่อตั้งขึ้นด้วยความเชื่อว่าทุกคนควรมีโอกาสค้นหาที่อยู่อาศัยที่เหมาะสม
              ในราคาที่เป็นธรรม เราจึงสร้างแพลตฟอร์มที่เชื่อมต่อผู้ซื้อและผู้ขายโดยตรง
              ลดตัวกลาง และเพิ่มความโปร่งใสในตลาดอสังหาริมทรัพย์ไทย
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              ไม่ว่าคุณจะกำลังมองหาบ้านหลังแรก ลงทุนในคอนโด หรือปล่อยเช่าทรัพย์สิน
              BaanTDee พร้อมเป็นผู้ช่วยที่ไว้วางใจได้ตลอดทุกขั้นตอน
            </p>
            <ul className="mt-6 space-y-2">
              {[
                "ค้นหาทรัพย์สินได้ง่ายด้วยฟิลเตอร์ขั้นสูง",
                "แผนที่แบบ Interactive แสดงทำเลแบบเรียลไทม์",
                "ระบบยืนยันตัวตนเพื่อความปลอดภัย",
                "ทีมงานพร้อมช่วยเหลือตลอด 24 ชั่วโมง",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-blue-50 p-10 text-center">
            <div className="text-6xl font-black text-blue-900">BaanTDee</div>
            <div className="mt-2 text-lg text-blue-700">อสังหาฯ</div>
            <p className="mt-6 text-sm text-gray-600">
              "บ้านที่ดีคือจุดเริ่มต้นของชีวิตที่ดี"
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900">ค่านิยมองค์กร</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border bg-white p-6">
                <v.icon className="h-8 w-8 text-blue-600" />
                <h3 className="mt-4 font-bold text-gray-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold text-gray-900">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="mt-3 text-gray-600">
            เข้าร่วมกับผู้ใช้กว่า 50,000 คนที่ไว้วางใจ BaanTDee วันนี้
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button asChild className="rounded-full bg-blue-900 px-8 hover:bg-blue-800">
              <Link href="/search">ค้นหาทรัพย์สิน</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-8">
              <Link href="/contact">ติดต่อเรา</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
