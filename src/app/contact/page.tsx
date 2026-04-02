"use client";

import { useState } from "react";
import { Mail, Phone, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const contactInfo = [
  { icon: Mail, label: "อีเมล", value: "support@baantdee.com" },
  { icon: Phone, label: "โทรศัพท์", value: "02-xxx-xxxx" },
  { icon: Clock, label: "เวลาทำการ", value: "จันทร์–ศุกร์ 9:00–18:00 น." },
  { icon: MapPin, label: "ที่อยู่", value: "กรุงเทพมหานคร, ประเทศไทย" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submit delay — wire to API later
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold">ติดต่อเรา</h1>
          <p className="mt-3 text-blue-100">มีคำถามหรือต้องการความช่วยเหลือ? ทีมงานพร้อมตอบคุณทุกวัน</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ช่องทางติดต่อ</h2>
            <p className="mt-3 text-gray-600">
              ติดต่อเราได้หลายช่องทาง หรือกรอกแบบฟอร์มแล้วเราจะติดต่อกลับโดยเร็วที่สุด
            </p>
            <div className="mt-8 space-y-5">
              {contactInfo.map((info) => (
                <div key={info.label} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <info.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{info.label}</div>
                    <div className="text-sm text-gray-600">{info.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-blue-50 p-6">
              <h3 className="font-bold text-blue-900">คำถามที่พบบ่อย</h3>
              <p className="mt-2 text-sm text-gray-600">
                ก่อนติดต่อเรา ลองดูที่หน้า{" "}
                <a href="/faq" className="font-medium text-blue-700 hover:underline">
                  คำถามที่พบบ่อย
                </a>{" "}
                อาจมีคำตอบที่คุณต้องการอยู่แล้ว
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border bg-white p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="mt-4 text-xl font-bold text-gray-900">ส่งข้อความแล้ว!</h3>
                <p className="mt-2 text-gray-600">
                  ขอบคุณที่ติดต่อเรา ทีมงานจะตอบกลับภายใน 1–2 วันทำการ
                </p>
                <Button
                  variant="outline"
                  className="mt-6 rounded-full"
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                >
                  ส่งข้อความใหม่
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">ส่งข้อความหาเรา</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อ *</label>
                    <Input
                      required
                      placeholder="ชื่อของคุณ"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">อีเมล *</label>
                    <Input
                      required
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <Input
                      placeholder="08x-xxx-xxxx"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">หัวข้อ *</label>
                    <Input
                      required
                      placeholder="ต้องการสอบถามเรื่อง..."
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">ข้อความ *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="รายละเอียดคำถามหรือปัญหาที่พบ..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-blue-900 hover:bg-blue-800"
                >
                  {loading ? "กำลังส่ง..." : "ส่งข้อความ"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
