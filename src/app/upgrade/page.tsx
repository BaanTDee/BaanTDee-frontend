"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Script from "next/script";
import Link from "next/link";
import {
  Loader2, CreditCard, QrCode, CheckCircle2, Crown,
  Zap, Building2, Phone, Smartphone, Globe, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCharge, getChargeStatus, type PaymentMethod } from "@/lib/api";

declare global {
  interface Window {
    Omise: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: string,
        data: Record<string, unknown>,
        callback: (statusCode: number, response: { id?: string; code?: string; message?: string }) => void
      ) => void;
    };
  }
}

type PlanKey = "standard_monthly" | "pro_monthly" | "agency_monthly";
type Step = "select" | "method" | "card" | "qr" | "phone" | "redirecting" | "success" | "failed";

const PLANS = [
  {
    key: "standard_monthly" as PlanKey,
    name: "Standard",
    price: 199,
    selBorder: "border-blue-500 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    icon: <Zap className="h-5 w-5 text-blue-500" />,
    features: ["ลงประกาศได้ 12 รายการ", "รูปได้สูงสุด 10 รูป/ประกาศ", "ความละเอียด 1080p", "1 บัญชีผู้ใช้"],
  },
  {
    key: "pro_monthly" as PlanKey,
    name: "Pro",
    price: 499,
    selBorder: "border-blue-900 bg-blue-50",
    badge: "bg-blue-900 text-white",
    icon: <Crown className="h-5 w-5 text-yellow-500" />,
    features: ["ลงประกาศได้ 30 รายการ", "รูปได้สูงสุด 15 รูป/ประกาศ", "ความละเอียด 2K", "1 บัญชีผู้ใช้"],
    recommended: true,
  },
  {
    key: "agency_monthly" as PlanKey,
    name: "Agency",
    price: 1299,
    selBorder: "border-purple-500 bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    icon: <Building2 className="h-5 w-5 text-purple-500" />,
    features: ["ลงประกาศได้ 200 รายการ", "รูปได้สูงสุด 20 รูป/ประกาศ", "ความละเอียด 4K", "สูงสุด 5 บัญชีในทีม"],
  },
];

interface MethodOption {
  id: PaymentMethod;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  flow: "card" | "qr" | "phone" | "redirect";
}

const METHODS: MethodOption[] = [
  { id: "card",                  label: "บัตรเครดิต / เดบิต",       sublabel: "Visa · Mastercard · JCB",     icon: <CreditCard className="h-5 w-5 text-blue-600" />,   flow: "card" },
  { id: "promptpay",             label: "พร้อมเพย์",                sublabel: "สแกน QR ผ่านแอปธนาคาร",      icon: <QrCode className="h-5 w-5 text-green-600" />,       flow: "qr" },
  { id: "truemoney",             label: "TrueMoney Wallet",          sublabel: "กรอกเบอร์แล้วสแกน QR",       icon: <span className="font-bold text-red-500">T</span>,   flow: "phone" },
  { id: "mobile_banking_kbank",  label: "K PLUS (กสิกรไทย)",        sublabel: "Mobile Banking",               icon: <Smartphone className="h-5 w-5 text-green-700" />,  flow: "redirect" },
  { id: "mobile_banking_scb",    label: "SCB Easy",                  sublabel: "Mobile Banking",               icon: <Smartphone className="h-5 w-5 text-purple-700" />, flow: "redirect" },
  { id: "mobile_banking_ktb",    label: "Krungthai NEXT",            sublabel: "Mobile Banking",               icon: <Smartphone className="h-5 w-5 text-sky-600" />,    flow: "redirect" },
  { id: "mobile_banking_bay",    label: "KMA (กรุงศรี)",             sublabel: "Mobile Banking",               icon: <Smartphone className="h-5 w-5 text-yellow-600" />, flow: "redirect" },
  { id: "internet_banking_bbl",  label: "Bualuang mBanking (BBL)",   sublabel: "Internet Banking",             icon: <Globe className="h-5 w-5 text-blue-800" />,        flow: "redirect" },
  { id: "internet_banking_scb",  label: "SCB Internet Banking",      sublabel: "Internet Banking",             icon: <Globe className="h-5 w-5 text-purple-700" />,      flow: "redirect" },
  { id: "internet_banking_ktb",  label: "Krungthai Internet Banking", sublabel: "Internet Banking",            icon: <Globe className="h-5 w-5 text-sky-600" />,         flow: "redirect" },
  { id: "internet_banking_bay",  label: "Krungsri Internet Banking",  sublabel: "Internet Banking",            icon: <Globe className="h-5 w-5 text-yellow-600" />,      flow: "redirect" },
];

export default function UpgradePage() {
  const router = useRouter();
  const { status } = useSession();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("pro_monthly");
  const [selectedMethod, setSelectedMethod] = useState<MethodOption | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // QR polling
  const [qrUrl, setQrUrl] = useState("");
  const [chargeId, setChargeId] = useState("");
  const [polling, setPolling] = useState(false);

  // TrueMoney
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/upgrade");
  }, [status, router]);

  useEffect(() => {
    if (!polling || !chargeId) return;
    const id = setInterval(async () => {
      const res = await getChargeStatus(chargeId);
      if (res.success && res.data.status === "successful") { setPolling(false); setStep("success"); }
      else if (res.success && (res.data.status === "failed" || res.data.status === "expired")) {
        setPolling(false);
        setError("การชำระเงินไม่สำเร็จ กรุณาลองใหม่");
        setStep("failed");
      }
    }, 3000);
    return () => clearInterval(id);
  }, [polling, chargeId]);

  const plan = PLANS.find((p) => p.key === selectedPlan)!;

  const reset = () => {
    setStep("select"); setError(""); setSelectedMethod(null);
    setQrUrl(""); setChargeId(""); setPolling(false);
    setCardNumber(""); setCardName(""); setExpiry(""); setCvv(""); setPhone("");
  };

  const doCharge = async (method: PaymentMethod, token?: string, phoneNumber?: string) => {
    setError("");
    setLoading(true);
    try {
      const returnUri = `${window.location.origin}/payment/return`;
      const result = await createCharge({ plan: selectedPlan, method, token, phone_number: phoneNumber, return_uri: returnUri });
      if (!result.success) {
        setError((result as any).error?.message || "การชำระเงินไม่สำเร็จ");
        setStep("failed");
        return;
      }
      const { status: cs, chargeId: cid, promptpayQr, authorizeUri } = result.data;
      if (cs === "successful") { setStep("success"); return; }
      if (authorizeUri) { setStep("redirecting"); setTimeout(() => { window.location.href = authorizeUri; }, 800); return; }
      if (promptpayQr) { setChargeId(cid); setQrUrl(promptpayQr); setStep("qr"); setPolling(true); return; }
      setError("ไม่สามารถดำเนินการชำระเงินได้"); setStep("failed");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่"); setStep("failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMethodProceed = async () => {
    if (!selectedMethod) return;
    if (selectedMethod.flow === "card") { setStep("card"); return; }
    if (selectedMethod.flow === "phone") { setStep("phone"); return; }
    await doCharge(selectedMethod.id);
  };

  const handleCardPay = () => {
    if (!cardNumber || !cardName || !expiry || !cvv) { setError("กรุณากรอกข้อมูลบัตรให้ครบ"); return; }
    const [m, y] = expiry.split("/").map((s) => s.trim());
    setLoading(true);
    window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY || "");
    window.Omise.createToken(
      "card",
      { name: cardName, number: cardNumber.replace(/\s/g, ""), expiration_month: parseInt(m), expiration_year: parseInt("20" + y), security_code: cvv },
      async (statusCode, response) => {
        if (statusCode !== 200 || !response.id) { setError(response.message || "ข้อมูลบัตรไม่ถูกต้อง"); setLoading(false); return; }
        await doCharge("card", response.id);
      }
    );
  };

  const handleTrueMoneyPay = async () => {
    const d = phone.replace(/\D/g, "");
    if (d.length < 9) { setError("กรุณากรอกเบอร์โทรให้ถูกต้อง"); return; }
    await doCharge("truemoney", undefined, d.startsWith("0") ? "+66" + d.slice(1) : d);
  };

  if (status === "loading") {
    return <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-900" /></div>;
  }

  return (
    <>
      <Script src="https://cdn.omise.co/omise.js" strategy="lazyOnload" />
      <div className="min-h-[calc(100vh-10rem)] px-4 py-10">
        <div className="mx-auto max-w-4xl">

          {/* SUCCESS */}
          {step === "success" && (
            <div className="text-center space-y-4 max-w-md mx-auto">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">อัปเกรดสำเร็จ!</h1>
              <p className="text-muted-foreground">แพ็กเกจ {plan.name} เริ่มต้นแล้ว 30 วัน</p>
              <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={() => router.push("/profile")}>ดูโปรไฟล์</Button>
            </div>
          )}

          {/* FAILED */}
          {step === "failed" && (
            <div className="text-center space-y-4 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto text-3xl text-red-500">✕</div>
              <h1 className="text-2xl font-bold text-gray-900">การชำระเงินไม่สำเร็จ</h1>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={reset}>ลองใหม่</Button>
            </div>
          )}

          {/* REDIRECTING */}
          {step === "redirecting" && (
            <div className="text-center space-y-4 max-w-md mx-auto">
              <Loader2 className="h-12 w-12 animate-spin text-blue-900 mx-auto" />
              <h1 className="text-xl font-bold text-gray-900">กำลังนำไปยังหน้าธนาคาร...</h1>
              <p className="text-sm text-muted-foreground">หากไม่ถูก redirect อัตโนมัติ กรุณารอสักครู่</p>
            </div>
          )}

          {/* PLAN SELECTION */}
          {step === "select" && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">เลือกแพ็กเกจ</h1>
                <p className="mt-2 text-muted-foreground">ยกระดับการลงประกาศอสังหาริมทรัพย์ของคุณ</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPlan(p.key)}
                    className={`relative rounded-xl border-2 p-5 text-left transition-all ${selectedPlan === p.key ? p.selBorder + " shadow-md" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                  >
                    {p.recommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-900 px-3 py-0.5 text-xs font-semibold text-white">แนะนำ</span>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {p.icon}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.badge}`}>{p.name}</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">฿{p.price.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">ต่อเดือน</p>
                    <ul className="space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Enterprise — สำหรับธุรกิจขนาดใหญ่</p>
                  <p className="text-sm text-muted-foreground mt-0.5">ลงประกาศไม่จำกัด · 10 บัญชีทีม · ความละเอียด 4K · ราคาพิเศษตามสัญญา</p>
                </div>
                <Link href="/contact"><Button variant="outline" className="shrink-0 gap-2"><Phone className="h-4 w-4" />ติดต่อเรา</Button></Link>
              </div>
              <div className="max-w-sm mx-auto">
                <Button className="w-full bg-blue-900 hover:bg-blue-800 text-base py-6" onClick={() => setStep("method")}>
                  ถัดไป — เลือกวิธีชำระเงิน
                </Button>
              </div>
            </div>
          )}

          {/* METHOD SELECTION */}
          {step === "method" && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("select")} className="text-muted-foreground hover:text-gray-900"><ChevronLeft className="h-5 w-5" /></button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">เลือกวิธีชำระเงิน</h2>
                  <p className="text-sm text-muted-foreground">{plan.name} — ฿{plan.price.toLocaleString()}/เดือน</p>
                </div>
              </div>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <div className="space-y-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m)}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${selectedMethod?.id === m.id ? "border-blue-900 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.sublabel}</p>
                    </div>
                    {selectedMethod?.id === m.id && <CheckCircle2 className="h-5 w-5 text-blue-900 shrink-0" />}
                  </button>
                ))}
              </div>
              <Button
                className="w-full bg-blue-900 hover:bg-blue-800"
                disabled={!selectedMethod || loading}
                onClick={handleMethodProceed}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedMethod ? `ชำระ ฿${plan.price.toLocaleString()} ด้วย ${selectedMethod.label}` : "เลือกวิธีชำระเงิน"}
              </Button>
            </div>
          )}

          {/* CARD FORM */}
          {step === "card" && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => { setStep("method"); setError(""); }} className="text-muted-foreground hover:text-gray-900"><ChevronLeft className="h-5 w-5" /></button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">กรอกข้อมูลบัตร</h2>
                  <p className="text-sm text-muted-foreground">{plan.name} — ฿{plan.price.toLocaleString()}/เดือน</p>
                </div>
              </div>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">หมายเลขบัตร</label>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 16); setCardNumber(v.replace(/(.{4})/g, "$1 ").trim()); }}
                    maxLength={19}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อบนบัตร</label>
                  <Input placeholder="FIRSTNAME LASTNAME" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">วันหมดอายุ</label>
                    <Input
                      placeholder="MM/YY" value={expiry} maxLength={5}
                      onChange={(e) => { let v = e.target.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); setExpiry(v); }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">CVV</label>
                    <Input placeholder="123" type="password" maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                  </div>
                </div>
              </div>
              <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={handleCardPay} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ชำระเงิน ฿{plan.price.toLocaleString()}
              </Button>
              <p className="text-center text-xs text-muted-foreground">ข้อมูลบัตรถูกเข้ารหัสด้วย Omise (PCI-DSS) — ไม่มีการเก็บข้อมูลบัตรในระบบของเรา</p>
            </div>
          )}

          {/* TRUEMONEY PHONE */}
          {step === "phone" && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => { setStep("method"); setError(""); }} className="text-muted-foreground hover:text-gray-900"><ChevronLeft className="h-5 w-5" /></button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">TrueMoney Wallet</h2>
                  <p className="text-sm text-muted-foreground">{plan.name} — ฿{plan.price.toLocaleString()}/เดือน</p>
                </div>
              </div>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">เบอร์โทรที่ผูกกับ TrueMoney</label>
                <Input placeholder="0812345678" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} />
                <p className="mt-1 text-xs text-muted-foreground">ระบบจะส่ง QR code ให้สแกนผ่านแอป TrueMoney</p>
              </div>
              <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={handleTrueMoneyPay} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ชำระเงิน ฿{plan.price.toLocaleString()}
              </Button>
            </div>
          )}

          {/* QR CODE */}
          {step === "qr" && (
            <div className="max-w-md mx-auto text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">สแกน QR เพื่อชำระเงิน</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.name} — ฿{plan.price.toLocaleString()}</p>
              </div>
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="QR Code" className="mx-auto w-56 h-56 rounded-lg border" />
              ) : (
                <div className="w-56 h-56 mx-auto rounded-lg border bg-gray-50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />รอการยืนยันการชำระเงิน...
              </div>
              <Button variant="ghost" className="w-full" onClick={() => { setPolling(false); reset(); }}>ยกเลิก</Button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
