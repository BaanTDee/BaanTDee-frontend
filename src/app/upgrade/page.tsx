"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Script from "next/script";
import Link from "next/link";
import { Loader2, CheckCircle2, Crown, Zap, Building2, Phone, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCharge, getChargeStatus, type PaymentMethod } from "@/lib/api";

declare global {
  interface Window {
    Omise: {
      setPublicKey: (key: string) => void;
      createToken: (type: string, data: Record<string, unknown>, cb: (code: number, res: { id?: string; message?: string }) => void) => void;
    };
  }
}

type PlanKey = "standard_monthly" | "pro_monthly" | "agency_monthly";
type Step = "select" | "checkout" | "qr" | "redirecting" | "success" | "failed";

const PLANS = [
  {
    key: "standard_monthly" as PlanKey,
    name: "Standard",
    price: 199,
    icon: <Zap className="h-4 w-4" />,
    color: "#2563eb",
    features: ["12 ประกาศ", "10 รูป/ประกาศ", "1080p"],
  },
  {
    key: "pro_monthly" as PlanKey,
    name: "Pro",
    price: 499,
    icon: <Crown className="h-4 w-4" />,
    color: "#1e3a8a",
    badge: "แนะนำ",
    features: ["30 ประกาศ", "15 รูป/ประกาศ", "2K"],
  },
  {
    key: "agency_monthly" as PlanKey,
    name: "Agency",
    price: 1299,
    icon: <Building2 className="h-4 w-4" />,
    color: "#7c3aed",
    features: ["200 ประกาศ", "20 รูป/ประกาศ", "4K + ทีม 5 คน"],
  },
];

// ── Bank brand data ───────────────────────────────────────────────────────────

interface MethodDef {
  id: PaymentMethod;
  name: string;
  note?: string;
  color: string;
  abbr: string;
  flow: "card" | "qr" | "phone" | "redirect";
}

const METHOD_GROUPS: { label: string; methods: MethodDef[] }[] = [
  {
    label: "บัตรเครดิต / เดบิต",
    methods: [
      { id: "card", name: "Visa / Mastercard / JCB", note: "ทุกธนาคาร", color: "#1a56db", abbr: "CARD", flow: "card" },
    ],
  },
  {
    label: "สแกน QR",
    methods: [
      { id: "promptpay", name: "พร้อมเพย์", note: "สแกนด้วยแอปธนาคารใดก็ได้", color: "#003f87", abbr: "PP", flow: "qr" },
      { id: "truemoney", name: "TrueMoney Wallet", note: "กรอกเบอร์แล้วสแกน QR", color: "#e4202a", abbr: "TM", flow: "phone" },
    ],
  },
  {
    label: "Mobile Banking",
    methods: [
      { id: "mobile_banking_kbank", name: "K PLUS",          note: "กสิกรไทย",  color: "#138f2d", abbr: "K",   flow: "redirect" },
      { id: "mobile_banking_scb",   name: "SCB Easy",        note: "ไทยพาณิชย์", color: "#4e2d84", abbr: "SCB", flow: "redirect" },
      { id: "mobile_banking_ktb",   name: "Krungthai NEXT",  note: "กรุงไทย",    color: "#00adef", abbr: "KTB", flow: "redirect" },
      { id: "mobile_banking_bay",   name: "KMA",             note: "กรุงศรี",    color: "#e8a020", abbr: "KMA", flow: "redirect" },
    ],
  },
  {
    label: "Internet Banking",
    methods: [
      { id: "internet_banking_bbl", name: "Bualuang iBanking", note: "กรุงเทพ",   color: "#1b3f8b", abbr: "BBL", flow: "redirect" },
      { id: "internet_banking_scb", name: "SCB",               note: "ไทยพาณิชย์", color: "#4e2d84", abbr: "SCB", flow: "redirect" },
      { id: "internet_banking_ktb", name: "Krungthai",         note: "กรุงไทย",    color: "#00adef", abbr: "KTB", flow: "redirect" },
      { id: "internet_banking_bay", name: "Krungsri",          note: "กรุงศรี",    color: "#e8a020", abbr: "KSI", flow: "redirect" },
    ],
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const { status } = useSession();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("pro_monthly");
  const [selectedMethod, setSelectedMethod] = useState<MethodDef | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Card
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [showCardForm, setShowCardForm] = useState(false);

  // QR / TrueMoney
  const [qrUrl, setQrUrl] = useState("");
  const [chargeId, setChargeId] = useState("");
  const [polling, setPolling] = useState(false);
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
        setPolling(false); setError("การชำระเงินไม่สำเร็จ"); setStep("failed");
      }
    }, 3000);
    return () => clearInterval(id);
  }, [polling, chargeId]);

  const plan = PLANS.find((p) => p.key === selectedPlan)!;

  const reset = () => {
    setStep("select"); setError(""); setSelectedMethod(null);
    setQrUrl(""); setChargeId(""); setPolling(false); setShowCardForm(false);
    setCardNumber(""); setCardName(""); setExpiry(""); setCvv(""); setPhone("");
  };

  const doCharge = async (method: PaymentMethod, token?: string, phoneNum?: string) => {
    setError(""); setLoading(true);
    try {
      const res = await createCharge({
        plan: selectedPlan, method, token, phone_number: phoneNum,
        return_uri: `${window.location.origin}/payment/return`,
      });
      if (!res.success) { setError((res as any).error?.message || "ชำระเงินไม่สำเร็จ"); setStep("failed"); return; }
      const { status: cs, chargeId: cid, promptpayQr, authorizeUri } = res.data;
      if (cs === "successful") { setStep("success"); return; }
      if (authorizeUri) { setStep("redirecting"); setTimeout(() => { window.location.href = authorizeUri; }, 800); return; }
      if (promptpayQr) { setChargeId(cid); setQrUrl(promptpayQr); setStep("qr"); setPolling(true); return; }
      setError("ไม่สามารถดำเนินการได้"); setStep("failed");
    } catch { setError("เกิดข้อผิดพลาด"); setStep("failed"); }
    finally { setLoading(false); }
  };

  const handleProceed = async () => {
    if (!selectedMethod) return;
    if (selectedMethod.flow === "card") { setShowCardForm(true); return; }
    if (selectedMethod.flow === "phone") return; // handled inline
    await doCharge(selectedMethod.id);
  };

  const handleCardPay = () => {
    if (!cardNumber || !cardName || !expiry || !cvv) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    const [m, y] = expiry.split("/");
    setLoading(true);
    window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY || "");
    window.Omise.createToken("card", {
      name: cardName, number: cardNumber.replace(/\s/g, ""),
      expiration_month: parseInt(m), expiration_year: parseInt("20" + y?.trim()),
      security_code: cvv,
    }, async (code, res) => {
      if (code !== 200 || !res.id) { setError(res.message || "ข้อมูลบัตรไม่ถูกต้อง"); setLoading(false); return; }
      await doCharge("card", res.id);
    });
  };

  const handleTrueMoneyPay = async () => {
    const d = phone.replace(/\D/g, "");
    if (d.length < 9) { setError("กรุณากรอกเบอร์โทรให้ถูกต้อง"); return; }
    await doCharge("truemoney", undefined, d.startsWith("0") ? "+66" + d.slice(1) : d);
  };

  if (status === "loading") return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
    </div>
  );

  // ── Terminal screens ──────────────────────────────────────────────────────

  if (step === "success") return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm w-full">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ชำระเงินสำเร็จ</h1>
          <p className="mt-1 text-sm text-gray-500">แพ็กเกจ {plan.name} เริ่มต้นแล้ว 30 วัน</p>
        </div>
        <Button className="w-full bg-blue-900 hover:bg-blue-800 h-11" onClick={() => router.push("/profile")}>
          ดูโปรไฟล์
        </Button>
      </div>
    </div>
  );

  if (step === "failed") return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm w-full">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-2xl text-red-400">✕</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ชำระเงินไม่สำเร็จ</h1>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={() => router.push("/")}>หน้าหลัก</Button>
          <Button className="flex-1 h-11 bg-blue-900 hover:bg-blue-800" onClick={reset}>ลองใหม่</Button>
        </div>
      </div>
    </div>
  );

  if (step === "redirecting") return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-900 mx-auto" />
        <p className="text-gray-600">กำลังนำไปยังหน้าธนาคาร...</p>
      </div>
    </div>
  );

  if (step === "qr") return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-xs w-full">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">สแกนเพื่อชำระเงิน</h2>
          <p className="mt-1 text-sm text-gray-500">{plan.name} ฿{plan.price.toLocaleString()}</p>
        </div>
        {qrUrl
          ? <img src={qrUrl} alt="QR" className="mx-auto w-52 h-52 rounded-xl border border-gray-200" /> // eslint-disable-line @next/next/no-img-element
          : <div className="mx-auto w-52 h-52 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        }
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />รอยืนยันจากธนาคาร...
        </p>
        <button onClick={() => { setPolling(false); reset(); }} className="text-sm text-gray-400 hover:text-gray-600 underline">ยกเลิก</button>
      </div>
    </div>
  );

  // ── Plan selection ────────────────────────────────────────────────────────

  if (step === "select") return (
    <>
      <Script src="https://cdn.omise.co/omise.js" strategy="lazyOnload" />
      <div className="min-h-[calc(100vh-10rem)] bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">เลือกแพ็กเกจ</h1>
            <p className="mt-1.5 text-sm text-gray-500">ยกระดับการลงประกาศของคุณ เริ่มต้นได้เลยวันนี้</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {PLANS.map((p) => {
              const active = selectedPlan === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setSelectedPlan(p.key)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-150 ${active ? "border-blue-900 bg-white shadow-md" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  {p.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full text-[11px] font-semibold px-3 py-0.5 text-white" style={{ background: p.color }}>
                      {p.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: p.color }}>
                      {p.icon}
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-gray-900">฿{p.price.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 ml-1">/เดือน</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">{p.name}</p>
                  <ul className="space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {active && <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-blue-900 flex items-center justify-center"><CheckCircle2 className="h-3.5 w-3.5 text-white" /></div>}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-medium text-gray-700">Enterprise</p>
              <p className="text-xs text-gray-400 mt-0.5">ไม่จำกัดประกาศ · ทีม 10 คน · 4K · ราคาตามสัญญา</p>
            </div>
            <Link href="/contact">
              <button className="shrink-0 flex items-center gap-1.5 text-sm text-blue-900 hover:underline font-medium">
                <Phone className="h-3.5 w-3.5" />ติดต่อเรา<ChevronRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>

          <Button className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-sm font-medium rounded-xl" onClick={() => setStep("checkout")}>
            ถัดไป — ชำระ ฿{plan.price.toLocaleString()} ({plan.name})
          </Button>
        </div>
      </div>
    </>
  );

  // ── Checkout ──────────────────────────────────────────────────────────────

  return (
    <>
      <Script src="https://cdn.omise.co/omise.js" strategy="lazyOnload" />
      <div className="min-h-[calc(100vh-10rem)] bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* ── Left: payment methods ───────────────────── */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => { setStep("select"); setShowCardForm(false); setError(""); }} className="text-gray-400 hover:text-gray-700 transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-base font-semibold text-gray-900">วิธีชำระเงิน</h2>
              </div>

              {error && !showCardForm && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm text-red-600">{error}</div>
              )}

              {/* Method groups */}
              {!showCardForm && (
                <div className="space-y-4">
                  {METHOD_GROUPS.map((group) => (
                    <div key={group.label} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/60">
                        {group.label}
                      </p>
                      {group.methods.map((m, idx) => {
                        const active = selectedMethod?.id === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedMethod(m); setError(""); }}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors ${active ? "bg-blue-50" : "hover:bg-gray-50"} ${idx > 0 ? "border-t border-gray-100" : ""}`}
                          >
                            {/* Brand color dot / abbr */}
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-[11px] font-bold"
                              style={{ background: m.color }}
                            >
                              {m.abbr}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 leading-tight">{m.name}</p>
                              {m.note && <p className="text-xs text-gray-400 mt-0.5">{m.note}</p>}
                            </div>
                            <span className={`h-4.5 w-4.5 flex items-center justify-center rounded-full border-2 transition-colors shrink-0 ${active ? "border-blue-900 bg-blue-900" : "border-gray-300"}`}>
                              {active && <span className="block h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* TrueMoney phone inline */}
              {!showCardForm && selectedMethod?.flow === "phone" && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">เบอร์โทรที่ผูกกับ TrueMoney Wallet</p>
                  <Input
                    placeholder="0812345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="h-11"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <Button className="w-full h-11 bg-blue-900 hover:bg-blue-800 rounded-lg text-sm" disabled={loading} onClick={handleTrueMoneyPay}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    ชำระ ฿{plan.price.toLocaleString()}
                  </Button>
                </div>
              )}

              {/* Card form inline */}
              {showCardForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">ข้อมูลบัตร</p>
                    <button onClick={() => { setShowCardForm(false); setError(""); }} className="text-xs text-gray-400 hover:text-gray-600">เปลี่ยนวิธี</button>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">หมายเลขบัตร</label>
                      <Input
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 16); setCardNumber(v.replace(/(.{4})/g, "$1 ").trim()); }}
                        maxLength={19} className="h-11 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อบนบัตร</label>
                      <Input placeholder="FIRSTNAME LASTNAME" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} className="h-11" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">วันหมดอายุ</label>
                        <Input placeholder="MM/YY" value={expiry} maxLength={5} className="h-11"
                          onChange={(e) => { let v = e.target.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); setExpiry(v); }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                        <Input placeholder="•••" type="password" maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} className="h-11" />
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-11 bg-blue-900 hover:bg-blue-800 rounded-lg text-sm" onClick={handleCardPay} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    ชำระเงิน ฿{plan.price.toLocaleString()}
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                    <Lock className="h-3 w-3" />ข้อมูลบัตรเข้ารหัสโดย Omise · PCI-DSS Level 1
                  </p>
                </div>
              )}

              {/* Proceed button */}
              {!showCardForm && selectedMethod && selectedMethod.flow !== "phone" && (
                <Button
                  className="w-full h-11 bg-blue-900 hover:bg-blue-800 rounded-xl text-sm font-medium"
                  disabled={loading}
                  onClick={handleProceed}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  ชำระด้วย {selectedMethod.name}
                </Button>
              )}

              {!showCardForm && !selectedMethod && (
                <Button className="w-full h-11 bg-blue-900 hover:bg-blue-800 rounded-xl text-sm font-medium opacity-60" disabled>
                  เลือกวิธีชำระเงิน
                </Button>
              )}
            </div>

            {/* ── Right: order summary ────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">สรุปคำสั่งซื้อ</p>

                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0" style={{ background: plan.color }}>
                    {plan.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">BaanTDee {plan.name}</p>
                    <p className="text-xs text-gray-400">30 วัน</p>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />{f}
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">ยอดชำระ</span>
                  <span className="text-lg font-bold text-gray-900">฿{plan.price.toLocaleString()}</span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  ชำระซ้ำได้ทุก 30 วัน · ยกเลิกได้ตลอดเวลา · ราคานี้รวม VAT แล้ว
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
