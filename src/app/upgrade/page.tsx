"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Script from "next/script";
import Link from "next/link";
import {
  Loader2, CheckCircle2,
  Phone, ChevronRight, Lock, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCharge, getChargeStatus, type PaymentMethod } from "@/lib/api";
import { PAYMENT_ICONS, detectCardBrand, CARD_BRAND_ICONS, type CardBrand } from "@/components/payment-icons";

declare global {
  interface Window {
    Omise: {
      setPublicKey: (key: string) => void;
      createToken: (
        type: string,
        data: Record<string, unknown>,
        cb: (code: number, res: { id?: string; message?: string }) => void
      ) => void;
    };
  }
}

type PlanKey = "standard_monthly" | "pro_monthly" | "agency_monthly";
type Step = "main" | "qr" | "redirecting" | "success" | "failed";

const PLANS = [
  {
    key: "standard_monthly" as PlanKey,
    name: "Standard",
    price: 199,
    color: "#2563eb",
    tagline: "12 ประกาศ · 10 รูป",
    features: ["12 ประกาศ", "10 รูป/ประกาศ", "รูปความละเอียดสูงสุด 1080p"],
  },
  {
    key: "pro_monthly" as PlanKey,
    name: "Pro",
    price: 499,
    color: "#1e3a8a",
    badge: "แนะนำ",
    tagline: "30 ประกาศ · 15 รูป",
    features: ["30 ประกาศ", "15 รูป/ประกาศ", "รูปความละเอียดสูงสุด 2K"],
  },
  {
    key: "agency_monthly" as PlanKey,
    name: "Agency",
    price: 1299,
    color: "#7c3aed",
    tagline: "200 ประกาศ · ทีม 5 คน",
    features: ["200 ประกาศ", "20 รูป/ประกาศ", "รูปความละเอียดสูงสุด 4K", "ทีม 5 คน"],
  },
];

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
];

const CARD_METHOD   = METHOD_GROUPS[0].methods[0];
const PROMPTPAY_METHOD = METHOD_GROUPS[1].methods[0];
const TRUEMONEY_METHOD = METHOD_GROUPS[1].methods[1];
const ALL_BANKS: MethodDef[] = METHOD_GROUPS[2].methods;
const BANKING_IDS = new Set<string>(ALL_BANKS.map((m) => m.id));

function RadioDot({ active }: { active: boolean }) {
  return (
    <span
      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
        active ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
      }`}
    >
      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </span>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const { status } = useSession();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("pro_monthly");
  const [selectedMethod, setSelectedMethod] = useState<MethodDef | null>(null);
  const [step, setStep] = useState<Step>("main");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardBrand, setCardBrand] = useState<CardBrand>(null);

  // Accordion + T&C
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [agreedTnC, setAgreedTnC] = useState(false);

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
      if (res.success && res.data.status === "successful") {
        setPolling(false); setStep("success");
      } else if (res.success && (res.data.status === "failed" || res.data.status === "expired")) {
        setPolling(false); setError("การชำระเงินไม่สำเร็จ"); setStep("failed");
      }
    }, 3000);
    return () => clearInterval(id);
  }, [polling, chargeId]);

  const plan = PLANS.find((p) => p.key === selectedPlan)!;

  const reset = () => {
    setStep("main"); setError(""); setSelectedMethod(null);
    setQrUrl(""); setChargeId(""); setPolling(false);
    setActiveAccordion(null); setAgreedTnC(false);
    setCardNumber(""); setCardName(""); setExpiry(""); setCvv(""); setPhone(""); setCardBrand(null);
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

  const canPay = (() => {
    if (!agreedTnC || !selectedMethod) return false;
    if (selectedMethod.flow === "card") {
      return cardNumber.replace(/\s/g, "").length >= 13 && !!cardName.trim() && expiry.length === 5 && cvv.length >= 3;
    }
    if (selectedMethod.flow === "phone") return phone.replace(/\D/g, "").length >= 9;
    return true;
  })();

  const handlePayClick = () => {
    if (!selectedMethod || !canPay) return;
    if (selectedMethod.flow === "card") handleCardPay();
    else if (selectedMethod.flow === "phone") handleTrueMoneyPay();
    else doCharge(selectedMethod.id);
  };

  const openAccordion = (key: string) => {
    setError("");
    if (activeAccordion === key) { setActiveAccordion(null); return; }
    setActiveAccordion(key);
    if (key === "card") setSelectedMethod(CARD_METHOD);
    else if (key === "truemoney") setSelectedMethod(TRUEMONEY_METHOD);
    else if (key === "promptpay") setSelectedMethod(PROMPTPAY_METHOD);
    else if (key === "banking") {
      if (selectedMethod && !BANKING_IDS.has(selectedMethod.id)) setSelectedMethod(null);
    }
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
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={qrUrl} alt="QR" className="mx-auto w-52 h-52 rounded-xl border border-gray-200" />
          : <div className="mx-auto w-52 h-52 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        }
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />รอยืนยันจากธนาคาร...
        </p>
        <button onClick={() => { setPolling(false); reset(); }} className="text-sm text-gray-400 hover:text-gray-600 underline">ยกเลิก</button>
      </div>
    </div>
  );

  // ── Main page ─────────────────────────────────────────────────────────────

  return (
    <>
      <Script src="https://cdn.omise.co/omise.js" strategy="lazyOnload" />
      <div className="min-h-[calc(100vh-10rem)] bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-[620px]">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">เลือกแพ็กเกจของคุณ</h1>
          <p className="text-sm text-gray-500 mb-7">ยกระดับการลงประกาศ เริ่มต้นได้เลยวันนี้</p>

          {/* ── Plan selector ── */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {PLANS.map((p) => {
              const active = selectedPlan === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setSelectedPlan(p.key)}
                  className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    active ? "border-blue-600 bg-white shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {p.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      {p.badge}
                    </span>
                  )}
                  <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${active ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                    {active && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500 leading-snug mt-0.5">{p.tagline}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">฿{p.price.toLocaleString()}/เดือน</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Enterprise link */}
          <div className="flex items-center justify-between mb-5 px-1">
            <p className="text-xs text-gray-400">ต้องการมากกว่านี้?</p>
            <Link href="/contact" className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
              <Phone className="h-3 w-3" />ติดต่อ Enterprise<ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* ── Order details ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">รายละเอียดคำสั่งซื้อ</p>
            <div className="flex items-start justify-between text-sm">
              <div>
                <p className="font-medium text-gray-900">{plan.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{plan.features.join(" · ")}</p>
              </div>
              <p className="font-medium text-gray-900 shrink-0 ml-4">฿{plan.price.toLocaleString()}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">ยอดชำระวันนี้</p>
              <p className="text-base font-bold text-gray-900">฿{plan.price.toLocaleString()}</p>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">รวม VAT แล้ว · ชำระซ้ำได้ทุก 30 วัน · ยกเลิกได้ตลอดเวลา</p>
          </div>

          {/* ── Payment method ── */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">วิธีชำระเงิน</p>
            </div>

            {error && (
              <div className="mx-4 mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</div>
            )}

            {/* Credit / Debit */}
            <div className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => openAccordion("card")}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
              >
                <RadioDot active={selectedMethod?.id === "card"} />
                <span className="flex-1 text-sm text-gray-800 text-left font-medium">บัตรเครดิต / บัตรเดบิต</span>
                <div className="flex items-center gap-1 mr-2">
                  {([CARD_BRAND_ICONS.visa, CARD_BRAND_ICONS.mastercard, CARD_BRAND_ICONS.amex, CARD_BRAND_ICONS.jcb] as const).map((Icon, i) => (
                    <span key={i} className="h-5 w-8 overflow-hidden rounded-sm shrink-0"><Icon /></span>
                  ))}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${activeAccordion === "card" ? "rotate-180" : ""}`} />
              </button>
              {activeAccordion === "card" && (
                <div className="px-5 pb-5 pt-1 space-y-3 bg-gray-50/40">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">หมายเลขบัตร</label>
                    <div className="relative">
                      <Input
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                          setCardBrand(detectCardBrand(v));
                        }}
                        maxLength={19} className="h-10 font-mono pr-40 bg-white"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        {(["visa", "mastercard", "amex", "jcb"] as const).map((brand) => {
                          const Icon = CARD_BRAND_ICONS[brand];
                          return (
                            <span key={brand} className={`h-5 w-8 overflow-hidden rounded-sm transition-opacity duration-150 ${cardBrand === null || cardBrand === brand ? "opacity-100" : "opacity-25"}`}>
                              <Icon />
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อบนบัตร</label>
                    <Input placeholder="FIRSTNAME LASTNAME" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} className="h-10 bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">วันหมดอายุ</label>
                      <Input placeholder="MM/YY" value={expiry} maxLength={5} className="h-10 bg-white"
                        onChange={(e) => { let v = e.target.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); setExpiry(v); }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                      <Input placeholder="•••" type="password" maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} className="h-10 bg-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Banking */}
            <div className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => openAccordion("banking")}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
              >
                <RadioDot active={selectedMethod !== null && BANKING_IDS.has(selectedMethod.id)} />
                <span className="flex-1 text-sm text-gray-800 text-left font-medium">ธนาคารออนไลน์</span>
                <div className="flex items-center gap-1 mr-2">
                  {(["mobile_banking_kbank", "mobile_banking_scb", "mobile_banking_ktb", "mobile_banking_bay"] as const).map((id) => {
                    const Icon = PAYMENT_ICONS[id];
                    return Icon ? <span key={id} className="h-6 w-6 overflow-hidden rounded-lg shrink-0"><Icon /></span> : null;
                  })}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${activeAccordion === "banking" ? "rotate-180" : ""}`} />
              </button>
              {activeAccordion === "banking" && (
                <div className="px-5 pb-4 pt-1 bg-gray-50/40">
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_BANKS.map((bank) => {
                      const Icon = PAYMENT_ICONS[bank.id];
                      const isSelected = selectedMethod?.id === bank.id;
                      return (
                        <button
                          key={bank.id}
                          onClick={() => setSelectedMethod(bank)}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                            isSelected ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <span className="h-9 w-9 overflow-hidden rounded-lg flex items-center justify-center">
                            {Icon ? <Icon /> : (
                              <span className="h-full w-full flex items-center justify-center text-white text-xs font-bold" style={{ background: bank.color }}>
                                {bank.abbr[0]}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">{bank.note}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedMethod && BANKING_IDS.has(selectedMethod.id) && (
                    <p className="mt-2.5 text-xs text-center text-gray-500">
                      เลือก: <span className="font-semibold text-gray-700">{selectedMethod.name}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* TrueMoney */}
            <div className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => openAccordion("truemoney")}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
              >
                <RadioDot active={selectedMethod?.id === "truemoney"} />
                <span className="flex-1 text-sm text-gray-800 text-left font-medium">ทรูมันนี่ วอลเล็ท</span>
                <span className="mr-2 h-6 w-6 shrink-0 overflow-hidden rounded">
                  {(() => { const Icon = PAYMENT_ICONS["truemoney"]; return Icon ? <Icon /> : <span className="h-full w-full flex items-center justify-center text-white text-[10px] font-bold rounded" style={{ background: "#e4202a" }}>TM</span>; })()}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${activeAccordion === "truemoney" ? "rotate-180" : ""}`} />
              </button>
              {activeAccordion === "truemoney" && (
                <div className="px-5 pb-4 pt-1 space-y-2 bg-gray-50/40">
                  <label className="block text-xs font-medium text-gray-600">เบอร์โทรที่ผูกกับ TrueMoney Wallet</label>
                  <Input placeholder="0812345678" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-10 bg-white" />
                </div>
              )}
            </div>

            {/* PromptPay */}
            <div>
              <button
                onClick={() => openAccordion("promptpay")}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
              >
                <RadioDot active={selectedMethod?.id === "promptpay"} />
                <span className="flex-1 text-sm text-gray-800 text-left font-medium">พร้อมเพย์</span>
                <span className="mr-2 h-6 w-6 shrink-0 overflow-hidden rounded-lg">
                  {(() => { const Icon = PAYMENT_ICONS["promptpay"]; return Icon ? <Icon /> : <span className="h-full w-full flex items-center justify-center text-white text-[10px] font-bold rounded" style={{ background: "#003f87" }}>PP</span>; })()}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${activeAccordion === "promptpay" ? "rotate-180" : ""}`} />
              </button>
              {activeAccordion === "promptpay" && (
                <div className="px-5 pb-4 pt-1 bg-gray-50/40">
                  <p className="text-xs text-gray-500">QR จะแสดงหลังกดชำระเงิน · สแกนด้วยแอปธนาคารใดก็ได้</p>
                </div>
              )}
            </div>
          </div>

          {/* ── T&C ── */}
          <label className="flex items-start gap-2.5 mb-4 cursor-pointer select-none px-1">
            <input
              type="checkbox"
              checked={agreedTnC}
              onChange={(e) => setAgreedTnC(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-700 cursor-pointer"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              คุณยอมรับว่า BaanTDee จะเรียกเก็บเงิน ฿{plan.price.toLocaleString()} ทุก 30 วัน จนกว่าจะยกเลิก ตาม{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">เงื่อนไขการให้บริการ</Link>
              {" "}และ{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</Link>
            </span>
          </label>

          {/* ── Pay button ── */}
          <Button
            className={`w-full h-12 text-sm font-semibold rounded-xl transition-colors ${
              loading ? "bg-blue-900/70 text-white" :
              canPay ? "bg-blue-900 hover:bg-blue-800 text-white" :
              "bg-gray-200 text-gray-400 hover:bg-gray-200"
            }`}
            disabled={!canPay || loading}
            onClick={handlePayClick}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            ชำระเงิน ฿{plan.price.toLocaleString()}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-3">
            <Lock className="h-3 w-3" />ปลอดภัยด้วย Omise · PCI-DSS Level 1
          </p>
        </div>
      </div>
    </>
  );
}
