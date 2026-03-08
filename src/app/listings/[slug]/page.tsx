"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Car,
  Building,
  Calendar,
  Eye,
  Heart,
  Share2,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getListingBySlug,
  sendInquiry,
  addFavorite,
  removeFavorite,
  formatPrice,
  typeLabel,
  offerLabel,
} from "@/lib/api";
import type { ListingDetailResponse, InquiryBody } from "@/lib/types";
import { useAuth } from "@/context/auth-context";

export default function ListingDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [data, setData] = useState<ListingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [favorited, setFavorited] = useState(false);

  // Inquiry form
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      setLoading(true);
      try {
        const res = await getListingBySlug(slug);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error.message);
        }
      } catch {
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchListing();
  }, [slug]);

  // Pre-fill inquiry form with user data
  useEffect(() => {
    if (user) {
      setInquiryName(user.name);
      setInquiryEmail(user.email);
      setInquiryPhone(user.phone || "");
    }
  }, [user]);

  const handleFavorite = async () => {
    if (!user || !data) return;
    try {
      if (favorited) {
        await removeFavorite(data.listing.id);
        setFavorited(false);
      } else {
        await addFavorite(data.listing.id);
        setFavorited(true);
      }
    } catch {
      // ignore
    }
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setInquirySending(true);
    try {
      const body: InquiryBody = {
        name: inquiryName,
        email: inquiryEmail,
        phone: inquiryPhone || undefined,
        message: inquiryMessage,
      };
      const res = await sendInquiry(data.listing.id, body);
      if (res.success) {
        setInquirySent(true);
        setInquiryMessage("");
      }
    } catch {
      // ignore
    } finally {
      setInquirySending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">ไม่พบประกาศ</h2>
        <p className="mt-2 text-muted-foreground">{error || "ประกาศนี้อาจถูกลบหรือไม่มีอยู่ในระบบ"}</p>
        <Link href="/search">
          <Button className="mt-4">กลับไปค้นหา</Button>
        </Link>
      </div>
    );
  }

  const { listing, images, facilities } = data;
  const coverImage = images.find((img) => img.is_cover) || images[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Back button */}
      <Link href="/search" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-900 hover:underline">
        <ArrowLeft className="h-4 w-4" /> กลับไปค้นหา
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — Images + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="space-y-2">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-200">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]?.url || coverImage?.url || "/placeholder-house.svg"}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  ไม่มีรูปภาพ
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                      i === selectedImage ? "border-blue-900" : "border-transparent"
                    }`}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" sizes="96px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-900 text-white">{typeLabel(listing.type)}</Badge>
              <Badge variant="outline">{offerLabel(listing.offer)}</Badge>
              {listing.is_featured && <Badge className="bg-amber-500 text-white">PREMIUM</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">{listing.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[listing.address, listing.subdistrict, listing.district, listing.province]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>

          {/* Price */}
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-3xl font-bold text-blue-900">
              ฿ {formatPrice(listing.price)}
              {listing.offer === "rent" && <span className="text-lg font-normal"> /เดือน</span>}
            </p>
            {listing.price_rent && listing.offer === "sale_rent" && (
              <p className="mt-1 text-lg text-muted-foreground">
                เช่า ฿ {formatPrice(listing.price_rent)} /เดือน
              </p>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {listing.bedrooms != null && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Bed className="h-5 w-5 text-blue-900" />
                <div>
                  <p className="text-lg font-bold">{listing.bedrooms}</p>
                  <p className="text-xs text-muted-foreground">ห้องนอน</p>
                </div>
              </div>
            )}
            {listing.bathrooms != null && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Bath className="h-5 w-5 text-blue-900" />
                <div>
                  <p className="text-lg font-bold">{listing.bathrooms}</p>
                  <p className="text-xs text-muted-foreground">ห้องน้ำ</p>
                </div>
              </div>
            )}
            {listing.area != null && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Maximize className="h-5 w-5 text-blue-900" />
                <div>
                  <p className="text-lg font-bold">{listing.area}</p>
                  <p className="text-xs text-muted-foreground">ตร.ม.</p>
                </div>
              </div>
            )}
            {listing.parking != null && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Car className="h-5 w-5 text-blue-900" />
                <div>
                  <p className="text-lg font-bold">{listing.parking}</p>
                  <p className="text-xs text-muted-foreground">ที่จอดรถ</p>
                </div>
              </div>
            )}
          </div>

          {/* Extra details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {listing.floors != null && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{listing.floors} ชั้น</span>
              </div>
            )}
            {listing.land_area != null && (
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4 text-muted-foreground" />
                <span>ที่ดิน {listing.land_area} ตร.ว.</span>
              </div>
            )}
            {listing.year_built != null && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>ปีที่สร้าง {listing.year_built}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span>เข้าชม {listing.view_count} ครั้ง</span>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">รายละเอียด</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {listing.description}
              </p>
            </div>
          )}

          {/* Facilities */}
          {facilities.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900">สิ่งอำนวยความสะดวก</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {facilities.map((f) => (
                  <Badge key={f.id} variant="secondary" className="text-sm">
                    {f.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — Contact + Actions */}
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleFavorite}
            >
              <Heart className={`mr-1 h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
              {favorited ? "บันทึกแล้ว" : "บันทึก"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (typeof navigator !== "undefined") {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            >
              <Share2 className="mr-1 h-4 w-4" /> แชร์
            </Button>
          </div>

          {/* Owner info */}
          <div className="rounded-lg border p-4">
            <h3 className="font-bold text-gray-900">ข้อมูลผู้ลงประกาศ</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium">{listing.user_name}</p>
              {listing.user_phone && (
                <a
                  href={`tel:${listing.user_phone}`}
                  className="flex items-center gap-2 text-blue-900 hover:underline"
                >
                  <Phone className="h-4 w-4" /> {listing.user_phone}
                </a>
              )}
            </div>
          </div>

          {/* Inquiry form */}
          <div className="rounded-lg border p-4">
            <h3 className="font-bold text-gray-900">สอบถามเพิ่มเติม</h3>
            {inquirySent ? (
              <div className="mt-3 rounded-lg bg-green-50 p-3 text-center text-sm text-green-800">
                ส่งข้อความเรียบร้อยแล้ว! ผู้ลงประกาศจะติดต่อกลับ
              </div>
            ) : (
              <form onSubmit={handleInquiry} className="mt-3 space-y-3">
                <Input
                  placeholder="ชื่อ *"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  required
                />
                <Input
                  placeholder="อีเมล *"
                  type="email"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  required
                />
                <Input
                  placeholder="เบอร์โทร"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                />
                <textarea
                  placeholder="ข้อความ *"
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-900 hover:bg-blue-800"
                  disabled={inquirySending}
                >
                  {inquirySending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  ส่งข้อความ
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
