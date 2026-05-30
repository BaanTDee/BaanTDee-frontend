"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getChargeStatus } from "@/lib/api";

type Status = "loading" | "success" | "failed" | "pending";

function PaymentReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const chargeId = params.get("id");
    if (!chargeId) { setStatus("failed"); setMessage("ไม่พบข้อมูลการชำระเงิน"); return; }

    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await getChargeStatus(chargeId);
        if (!res.success) { setStatus("failed"); setMessage("ไม่สามารถตรวจสอบสถานะได้"); return; }
        if (res.data.status === "successful") { setStatus("success"); return; }
        if (res.data.status === "failed" || res.data.status === "expired") { setStatus("failed"); setMessage("การชำระเงินไม่สำเร็จหรือหมดอายุ"); return; }
        // pending — retry up to 10 times (30 seconds)
        if (attempts < 10) { setTimeout(poll, 3000); }
        else { setStatus("pending"); setMessage("การชำระเงินยังอยู่ระหว่างดำเนินการ ระบบจะอัปเดตสถานะอัตโนมัติ"); }
      } catch {
        setStatus("failed"); setMessage("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    };
    poll();
  }, [params]);

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm w-full">

        {status === "loading" && (
          <>
            <Loader2 className="h-14 w-14 animate-spin text-blue-900 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">กำลังตรวจสอบการชำระเงิน...</h1>
            <p className="text-sm text-muted-foreground">กรุณารอสักครู่</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">ชำระเงินสำเร็จ!</h1>
            <p className="text-muted-foreground">แพ็กเกจของคุณเริ่มต้นแล้ว 30 วัน</p>
            <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={() => router.push("/profile")}>
              ดูโปรไฟล์
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">การชำระเงินไม่สำเร็จ</h1>
            {message && <p className="text-sm text-red-600">{message}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>หน้าหลัก</Button>
              <Button className="flex-1 bg-blue-900 hover:bg-blue-800" onClick={() => router.push("/upgrade")}>ลองใหม่</Button>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <Loader2 className="h-14 w-14 animate-spin text-yellow-500 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">กำลังรอยืนยัน</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={() => router.push("/profile")}>
              ไปยังโปรไฟล์
            </Button>
          </>
        )}

      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}
