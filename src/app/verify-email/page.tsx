"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendOtp, verifyOtp } from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace("/register");
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (!digit && index > 0 && !value) inputRefs.current[index - 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("กรุณากรอกรหัส 6 หลัก");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await verifyOtp(email, fullCode);
      if (result.success) {
        // Auto-login via NextAuth credentials using stored password
        const pw = sessionStorage.getItem("_reg_pw");
        sessionStorage.removeItem("_reg_pw");
        if (pw) {
          await signIn("credentials", { email, password: pw, callbackUrl: "/" });
        } else {
          router.push("/login?verified=1");
        }
      } else {
        setError((!result.success && result.error?.message) || "รหัสไม่ถูกต้อง กรุณาลองใหม่");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    try {
      await sendOtp(email);
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("ไม่สามารถส่งรหัสใหม่ได้ กรุณาลองใหม่");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-50 p-4">
            <Mail className="h-8 w-8 text-blue-900" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">ยืนยันอีเมลของคุณ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            เราได้ส่งรหัส 6 หลักไปที่
          </p>
          <p className="mt-1 font-medium text-gray-900">{email}</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-12 text-center text-xl font-bold"
              autoFocus={i === 0}
            />
          ))}
        </div>

        <Button
          className="w-full bg-blue-900 hover:bg-blue-800"
          onClick={handleVerify}
          disabled={loading || code.join("").length < 6}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          ยืนยัน
        </Button>

        <div className="text-sm text-muted-foreground">
          ไม่ได้รับรหัส?{" "}
          {resendCooldown > 0 ? (
            <span className="text-gray-400">ส่งใหม่ได้ใน {resendCooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="font-medium text-blue-900 hover:underline inline-flex items-center gap-1"
            >
              {resendLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
              ส่งรหัสใหม่
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          รหัสจะหมดอายุใน 10 นาที
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
