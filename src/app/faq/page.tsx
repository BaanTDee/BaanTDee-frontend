"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

const categories = [
  { id: "all", label: "ทั้งหมด" },
  { id: "general", label: "ทั่วไป" },
  { id: "listing", label: "การลงประกาศ" },
  { id: "account", label: "บัญชีผู้ใช้" },
  { id: "safety", label: "ความปลอดภัย" },
];

const faqs = [
  {
    category: "general",
    question: "BaanTDee คืออะไร?",
    answer:
      "BaanTDee คือแพลตฟอร์มออนไลน์สำหรับซื้อ ขาย และเช่าอสังหาริมทรัพย์ในประเทศไทย ครอบคลุมทุกประเภท ทั้งบ้านเดี่ยว คอนโด ทาวน์เฮาส์ ที่ดิน และอาคารพาณิชย์ ในทุกจังหวัดทั่วประเทศ",
  },
  {
    category: "general",
    question: "การใช้งาน BaanTDee มีค่าใช้จ่ายหรือไม่?",
    answer:
      "การสมัครสมาชิกและค้นหาทรัพย์สินฟรีทั้งหมด สำหรับการลงประกาศขาย/เช่ามีแพ็กเกจฟรีที่เริ่มต้นได้เลย และแพ็กเกจพรีเมียมสำหรับผู้ที่ต้องการฟีเจอร์เพิ่มเติม",
  },
  {
    category: "general",
    question: "BaanTDee รองรับพื้นที่ใดบ้าง?",
    answer:
      "BaanTDee ครอบคลุมทั้ง 77 จังหวัดทั่วประเทศไทย คุณสามารถค้นหาและลงประกาศได้ทุกพื้นที่",
  },
  {
    category: "listing",
    question: "ลงประกาศขายหรือเช่าบ้านได้อย่างไร?",
    answer:
      "สมัครสมาชิกหรือล็อกอินก่อน จากนั้นกดปุ่ม \"ลงประกาศ\" ที่แถบด้านบน กรอกข้อมูลทรัพย์สิน อัปโหลดรูปภาพ และกดเผยแพร่ ระบบจะตรวจสอบก่อนแสดงผลภายใน 24 ชั่วโมง ดูวิธีละเอียดได้ที่หน้า วิธีลงประกาศ",
  },
  {
    category: "listing",
    question: "อัปโหลดรูปภาพได้กี่รูปต่อประกาศ?",
    answer:
      "อัปโหลดได้สูงสุด 10 รูปต่อประกาศ รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 10MB ต่อรูป แนะนำให้ใช้รูปที่มีความละเอียดสูงและแสงดีเพื่อดึงดูดผู้สนใจมากขึ้น",
  },
  {
    category: "listing",
    question: "ประกาศจะแสดงผลนานแค่ไหน?",
    answer:
      "แพ็กเกจฟรีจะแสดงผล 30 วัน แพ็กเกจพรีเมียมจะแสดงผลนานขึ้นตามแพ็กเกจที่เลือก คุณสามารถต่ออายุหรืออัปเกรดได้ตลอดเวลา",
  },
  {
    category: "listing",
    question: "แก้ไขหรือลบประกาศได้ไหม?",
    answer:
      "ได้เลย เข้าไปที่ \"ประกาศของฉัน\" ในเมนูผู้ใช้ แล้วเลือกประกาศที่ต้องการแก้ไขหรือลบ การแก้ไขข้อมูลสำคัญอาจต้องผ่านการตรวจสอบอีกครั้ง",
  },
  {
    category: "account",
    question: "ลืมรหัสผ่านทำอย่างไร?",
    answer:
      "กดปุ่ม \"ลืมรหัสผ่าน\" ในหน้าเข้าสู่ระบบ แล้วกรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณ ลิงก์นี้มีอายุ 24 ชั่วโมง",
  },
  {
    category: "account",
    question: "สามารถล็อกอินด้วย Google หรือ Facebook ได้หรือไม่?",
    answer:
      "ได้เลยครับ BaanTDee รองรับการล็อกอินผ่าน Google และ Facebook โดยไม่ต้องสร้างรหัสผ่านใหม่",
  },
  {
    category: "account",
    question: "เปลี่ยนอีเมลบัญชีได้ไหม?",
    answer:
      "สามารถเปลี่ยนได้ในหน้าตั้งค่าบัญชี โดยต้องยืนยันอีเมลใหม่ก่อนการเปลี่ยนแปลงจะมีผล",
  },
  {
    category: "safety",
    question: "จะรู้ได้อย่างไรว่าประกาศน่าเชื่อถือ?",
    answer:
      "ดูที่แบดจ์ยืนยันตัวตนของผู้ลงประกาศ ตรวจสอบรีวิวและประวัติ ขอดูเอกสารทรัพย์สินก่อนโอนเงินใดๆ และนัดดูทรัพย์จริงก่อนตัดสินใจ",
  },
  {
    category: "safety",
    question: "พบประกาศน่าสงสัย ทำอย่างไร?",
    answer:
      "กดปุ่ม \"รายงาน\" ที่อยู่ในหน้าประกาศนั้นๆ ทีมงาน BaanTDee จะตรวจสอบและดำเนินการภายใน 24 ชั่วโมง",
  },
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = faqs.filter(
    (f) => activeCategory === "all" || f.category === activeCategory,
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold">คำถามที่พบบ่อย</h1>
          <p className="mt-3 text-blue-100">รวมคำถามและคำตอบที่ผู้ใช้งานสงสัยบ่อยที่สุด</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setOpenIndex(null); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === cat.id
                  ? "bg-blue-900 text-white"
                  : "border border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="mt-8 space-y-3">
          {filtered.map((faq, i) => (
            <div key={i} className="rounded-xl border bg-white">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {openIndex === i ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0 text-blue-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                )}
              </button>
              {openIndex === i && (
                <div className="border-t px-5 py-4 text-sm leading-relaxed text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 rounded-2xl bg-blue-50 p-8 text-center">
          <h3 className="font-bold text-gray-900">ยังไม่พบคำตอบที่ต้องการ?</h3>
          <p className="mt-2 text-sm text-gray-600">ทีมงาน BaanTDee พร้อมช่วยเหลือคุณ</p>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-full bg-blue-900 px-6 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            ติดต่อเรา
          </Link>
        </div>
      </section>
    </div>
  );
}
