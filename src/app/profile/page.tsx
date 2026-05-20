"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Loader2, User, Mail, Phone, LogOut, Plus, Home,
  Heart, ChevronRight, Pencil, X, Check, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "@/components/listing-card";
import { getListings, updateMe, formatPrice } from "@/lib/api";
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
    setForm({
      name: backendUser?.name || "",
      phone: backendUser?.phone || "",
      bio: backendUser?.bio || "",
    });
  };

  const displayName = backendUser?.name || session.user.name || session.user.email || "ผู้ใช้งาน";
  const displayEmail = backendUser?.email || session.user.email || "";
  const displayPhone = backendUser?.phone || "";
  const displayBio = backendUser?.bio || "";
  const avatar = backendUser?.avatar_url || backendUser?.avatar || session.user.image || null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Profile Card */}
      <div className="mb-8 rounded-2xl border bg-white p-8 shadow-sm">
        {/* Edit button — top right */}
        {!editing && (
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-gray-600"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              แก้ไขโปรไฟล์
            </Button>
          </div>
        )}

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
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="0812345678"
                    maxLength={20}
                  />
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
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
                  </div>
                )}
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

        {/* Quick links */}
        {!editing && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/listings/create">
              <Button className="bg-blue-900 hover:bg-blue-800 gap-2">
                <Plus className="h-4 w-4" />
                ลงประกาศใหม่
              </Button>
            </Link>
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
