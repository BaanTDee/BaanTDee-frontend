"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import {
  Loader2, User, Mail, Phone, LogOut, Plus, Home,
  Heart, ChevronRight, Pencil, X, Check, FileText, Crown, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "@/components/listing-card";
import { getListings, updateMe, sendPhoneOtp, verifyPhoneOtp, formatPrice } from "@/lib/api";
import type { ListingSummary } from "@/lib/types";

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [myListings, setMyListings] = useState<ListingSummary[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [otpStep, setOtpStep] = useState<"idle" | "sending" | "sent" | "verifying">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [changingPhone, setChangingPhone] = useState(false);

  const backendUser = (session as any)?.backendUser;

  const [form, setForm] = useState({ name: "", phone: "", bio: "" });

  useEffect(() => {
    if (backendUser) {
      setForm({
        name: backendUser.name || "",
        phone: backendUser.phone || "",
        bio: backendUser.bio || "",
      });
    }
  }, [backendUser]);

  useEffect(() => {
    if (!session?.user) return;
    const userId = backendUser?.id;
    if (!userId) return;
    setLoadingListings(true);
    getListings({ limit: 6, user_id: userId })
      .then((res) => { if (res.success) setMyListings(res.data); })
      .finally(() => setLoadingListings(false));
  }, [session, backendUser?.id]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (!session?.user) {
    router.replace("/login");
    return null;
  }

  const handleLogout = async () => {
    setLogoutLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  const handleSave = async () => {
    setSaveError("");
    if (!form.name.trim()) { setSaveError("กรุณากรอกชื่อ"); return; }
    setSaving(true);
    try {
      const res = await updateMe({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        bio: form.bio.trim() || undefined,
      });
      if (res.success) {
        await updateSession({
          ...session,
          backendUser: { ...backendUser, ...res.data },
        });
        setEditing(false);
        setChangingPhone(false);
      } else {
        setSaveError((res as any).error?.message || "บันทึกไม่สำเร็จ");
      }
    } catch {
      setSaveError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveError("");
    setChangingPhone(false);
    setForm({
      name: backendUser?.name || "",
      phone: backendUser?.phone || "",
      bio: backendUser?.bio || "",
    });
  };

  const handleSendOtp = async () => {
    if (!displayPhone) return;
    setOtpError("");
    setOtpCode("");
    setOtpStep("sending");
    try {
      const res = await sendPhoneOtp(displayPhone);
      if (res.success) { setOtpStep("sent"); }
      else { setOtpError((res as any).error?.message || "ส่ง OTP ไม่สำเร็จ"); setOtpStep("idle"); }
    } catch { setOtpError("เกิดข้อผิดพลาด"); setOtpStep("idle"); }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpStep("verifying");
    try {
      const res = await verifyPhoneOtp(otpCode);
      if (res.success) {
        await updateSession({ ...session, backendUser: { ...backendUser, ...res.data } });
        setOtpStep("idle");
        setOtpCode("");
      } else {
        setOtpError((res as any).error?.message || "รหัส OTP ไม่ถูกต้อง");
        setOtpStep("sent");
      }
    } catch { setOtpError("เกิดข้อผิดพลาด"); setOtpStep("sent"); }
  };

  const displayName = backendUser?.name || session.user.name || session.user.email || "ผู้ใช้งาน";
  const displayEmail = backendUser?.email || session.user.email || "";
  const displayPhone = backendUser?.phone || "";
  const displayBio = backendUser?.bio || "";
  const avatar = backendUser?.avatar_url || backendUser?.avatar || session.user.image || null;

  const tierLabel: Record<string, { label: string; className: string }> = {
    free:       { label: "Free",       className: "bg-gray-100 text-gray-600" },
    standard:   { label: "Standard",   className: "bg-blue-100 text-blue-700" },
    premium:    { label: "Standard",   className: "bg-blue-100 text-blue-700" },
    pro:        { label: "Pro",        className: "bg-blue-900 text-white" },
    agency:     { label: "Agency",     className: "bg-purple-100 text-purple-700" },
    enterprise: { label: "Enterprise", className: "bg-yellow-100 text-yellow-800" },
  };
  const tier = backendUser?.tier ?? "free";
  const tierInfo = tierLabel[tier] ?? tierLabel.free;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Profile Card */}
      <div className="mb-8 rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-900">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={displayName} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>

          {/* Info / Edit form */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">ชื่อ</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="ชื่อที่แสดง"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">เบอร์โทร</label>
                  {backendUser?.phone_verified && !changingPhone ? (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 items-center gap-2 h-9 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                        <Pencil className="h-3.5 w-3.5 opacity-30 shrink-0" />
                        <span>{form.phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setChangingPhone(true); setForm((f) => ({ ...f, phone: "" })); }}
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        เปลี่ยน
                      </button>
                    </div>
                  ) : (
                    <>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="0812345678"
                        maxLength={20}
                        autoFocus={changingPhone}
                      />
                      {changingPhone && (
                        <p className="mt-1 text-xs text-yellow-600">หลังบันทึก จะต้องยืนยันเบอร์ใหม่อีกครั้ง</p>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">แนะนำตัว</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    placeholder="เขียนแนะนำตัวสั้นๆ..."
                    maxLength={1000}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
                {saveError && (
                  <p className="text-sm text-red-600">{saveError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-900 hover:bg-blue-800 gap-1.5"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    บันทึก
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    ยกเลิก
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tierInfo.className}`}>
                      {tier !== "free" && <Crown className="h-3 w-3" />}
                      {tierInfo.label}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5 text-gray-600"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไขโปรไฟล์
                  </Button>
                </div>
                {displayEmail && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{displayEmail}</span>
                  </div>
                )}
                {displayPhone && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{displayPhone}</span>
                    {backendUser?.phone_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" /> ยืนยันแล้ว
                      </span>
                    ) : (
                      <button
                        onClick={handleSendOtp}
                        disabled={otpStep === "sending"}
                        className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100 disabled:opacity-50"
                      >
                        {otpStep === "sending" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        ยืนยันเบอร์โทร
                      </button>
                    )}
                  </div>
                )}
                {!displayPhone && !editing && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-yellow-600">
                    <Phone className="h-4 w-4 shrink-0" />
                    <button onClick={() => setEditing(true)} className="underline underline-offset-2">เพิ่มเบอร์โทร</button>
                  </div>
                )}
                {otpStep === "sent" && (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="รหัส 6 หลัก"
                      className="h-9 w-32 text-center text-sm tracking-widest font-mono"
                      maxLength={6}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className={`h-9 px-4 font-semibold transition-all ${
                        otpCode.length === 6
                          ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-200"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={handleVerifyOtp}
                      disabled={otpCode.length !== 6}
                    >
                      ยืนยัน
                    </Button>
                    <button onClick={handleSendOtp} className="text-xs text-muted-foreground hover:underline">ส่งใหม่</button>
                  </div>
                )}
                {otpStep === "verifying" && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> กำลังยืนยัน...
                  </div>
                )}
                {otpError && <p className="mt-1 text-xs text-red-600">{otpError}</p>}
                {displayBio && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line">{displayBio}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Linked accounts */}
        {!editing && (
          <div className="mt-5 border-t pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Link2 className="h-3.5 w-3.5" />
              บัญชีที่เชื่อมต่อ
            </p>
            <div className="flex flex-wrap gap-2">
              {backendUser?.has_google && (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-gray-700">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </span>
              )}
              {backendUser?.has_facebook ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-gray-700">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                  Facebook
                </span>
              ) : (
                <button
                  onClick={() => signIn("facebook", { callbackUrl: "/profile" })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.532-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                  เชื่อมต่อ Facebook
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick links */}
        {!editing && (
          <div className="mt-6 space-y-3">
            {!backendUser?.phone_verified && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5 text-sm text-yellow-800">
                ยืนยันเบอร์โทรก่อนเพื่อลงประกาศได้
              </div>
            )}
          <div className="flex flex-wrap gap-3">
            {backendUser?.phone_verified ? (
              <Link href="/listings/create">
                <Button className="bg-blue-900 hover:bg-blue-800 gap-2">
                  <Plus className="h-4 w-4" />
                  ลงประกาศใหม่
                </Button>
              </Link>
            ) : (
              <Button className="bg-blue-900 hover:bg-blue-800 gap-2 opacity-50 cursor-not-allowed" disabled>
                <Plus className="h-4 w-4" />
                ลงประกาศใหม่
              </Button>
            )}
            <Link href="/favorites">
              <Button variant="outline" className="gap-2">
                <Heart className="h-4 w-4" />
                รายการโปรด
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 ml-auto"
              onClick={handleLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              ออกจากระบบ
            </Button>
          </div>
          </div>
        )}
      </div>

      {/* My Listings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Home className="h-5 w-5" />
            ประกาศของฉัน
          </h2>
          <Link href="/my-listings" className="flex items-center gap-1 text-sm text-blue-900 hover:underline">
            ดูทั้งหมด <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loadingListings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-900" />
          </div>
        ) : myListings.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <Home className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-muted-foreground">ยังไม่มีประกาศ</p>
            <Link href="/listings/create">
              <Button className="mt-4 bg-blue-900 hover:bg-blue-800">ลงประกาศแรก</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myListings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                slug={listing.slug}
                title={listing.title}
                location={`${listing.district}, ${listing.province}`}
                price={formatPrice(listing.price)}
                image={listing.cover_url || "/placeholder-house.svg"}
                offer={listing.offer}
                type={listing.type}
                tag={listing.is_featured ? "PREMIUM" : undefined}
                editHref={`/my-listings/${listing.slug}/edit`}
                createdAt={listing.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
