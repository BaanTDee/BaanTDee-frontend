"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Script from "next/script";
import { Loader2, CreditCard, QrCode, CheckCircle2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCharge, getChargeStatus } from "@/lib/api";

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

type Step = "select" | "card" | "promptpay" | "success";

export default function UpgradePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState<Step>("select");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [chargeId, setChargeId] = useState("");
  const [polling, setPolling] = useState(false);

  // Card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/upgrade");
  }, [status, router]);

  // Poll PromptPay charge status every 3s
  useEffect(() => {
    if (!polling || !chargeId) return;
    const interval = setInterval(async () => {
      const res = await getChargeStatus(chargeId);
      if (res.success && res.data.status === "successful") {
        setPolling(false);
        setStep("success");
      } else if (res.success && (res.data.status === "failed" || res.data.status === "expired")) {
        setPolling(false);
        setError("การชำระเงินไม่สำเร็จ กรุณาลองใหม่");
        setStep("select");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, chargeId]);

  const handleCardPay = async () => {
    setError("");
    if (!cardNumber || !cardName || !expiry || !cvv) {
      setError("กรุณากรอกข้อมูลบัตรให้ครบ");
      return;
    }
    const [expMonth, expYear] = expiry.split("/").map((s) => s.trim());
    setLoading(true);

    window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY || "");
    window.Omise.createToken(
      "card",
      {
        name: cardName,
        number: cardNumber.replace(/\s/g, ""),
        expiration_month: parseInt(expMonth),
        expiration_year: parseInt("20" + expYear),
        security_code: cvv,
      },
      async (statusCode, response) => {
        if (statusCode !== 200 || !response.id) {
          setError(response.message || "ข้อมูลบัตรไม่ถูกต้อง");
          setLoading(false);
          return;
        }
        try {
          const result = await createCharge({ plan: "premium_monthly", method: "card", token: response.id });
          if (result.success && result.data?.status === "successful") {
            setStep("success");
          } else {
            setError("การชำระเงินไม่สำเร็จ กรุณาลองใหม่");
          }
        } catch {
          setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handlePromptPay = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await createCharge({ plan: "premium_monthly", method: "promptpay", token: "" });
      if (result.success && result.data) {
        setChargeId(result.data.chargeId);
        setQrUrl(result.data.promptpayQr || "");
        setStep("promptpay");
        setPolling(true);
      } else {
        setError("ไม่สามารถสร้าง QR code ได้ กรุณาลองใหม่");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
  }

  return (
    <>
      <Script src="https://cdn.omise.co/omise.js" strategy="lazyOnload" />

      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Success */}
          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">อัปเกรดสำเร็จ!</h1>
              <p className="text-muted-foreground">คุณได้รับสิทธิ์ Premium 30 วัน สามารถลงประกาศได้ไม่จำกัด</p>
              <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={() => router.push("/")}>
                กลับหน้าหลัก
              </Button>
            </div>
          )}

          {/* Plan select */}
          {step === "select" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">อัปเกรดเป็น Premium</h1>
                <p className="mt-1 text-sm text-muted-foreground">ลงประกาศได้ไม่จำกัด เพียง ฿199/เดือน</p>
              </div>

              {/* Plan card */}
              <div className="rounded-xl border-2 border-blue-900 p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">Premium Monthly</p>
                    <p className="text-sm text-muted-foreground">ลงประกาศไม่จำกัด + แสดงผลเด่น</p>
                  </div>
                  <p className="text-xl font-bold text-blue-900">฿199</p>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {["ลงประกาศได้ไม่จำกัด", "แสดงเบอร์ติดต่อเต็มรูปแบบ", "อัปโหลดรูปได้สูงสุด 20 รูป/ประกาศ"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full bg-blue-900 hover:bg-blue-800"
                  onClick={() => setStep("card")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  ชำระด้วยบัตรเครดิต/เดบิต
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePromptPay}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                  ชำระด้วย PromptPay
                </Button>
              </div>
            </div>
          )}

          {/* Card form */}
          {step === "card" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">กรอกข้อมูลบัตร</h1>
                <p className="mt-1 text-sm text-muted-foreground">Premium Monthly — ฿199</p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">หมายเลขบัตร</label>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                    }}
                    maxLength={19}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อบนบัตร</label>
                  <Input
                    placeholder="FIRSTNAME LASTNAME"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">วันหมดอายุ</label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      maxLength={5}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                        setExpiry(v);
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">CVV</label>
                    <Input
                      placeholder="123"
                      type="password"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full bg-blue-900 hover:bg-blue-800"
                  onClick={handleCardPay}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  ชำระเงิน ฿199
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { setStep("select"); setError(""); }}>
                  ยกเลิก
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                ข้อมูลบัตรถูกเข้ารหัสด้วย Omise — ไม่มีการเก็บข้อมูลบัตรในระบบของเรา
              </p>
            </div>
          )}

          {/* PromptPay QR */}
          {step === "promptpay" && (
            <div className="space-y-6 text-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">สแกน QR เพื่อชำระเงิน</h1>
                <p className="mt-1 text-sm text-muted-foreground">Premium Monthly — ฿199</p>
              </div>

              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="PromptPay QR" className="mx-auto w-56 h-56 rounded-lg border" />
              ) : (
                <div className="flex justify-center">
                  <div className="w-56 h-56 rounded-lg border bg-gray-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                รอการยืนยันการชำระเงิน...
              </div>

              <Button variant="ghost" className="w-full" onClick={() => { setPolling(false); setStep("select"); setError(""); }}>
                ยกเลิก
              </Button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
