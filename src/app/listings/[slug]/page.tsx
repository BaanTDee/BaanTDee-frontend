"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getListingBySlug,
  getListings,
  sendInquiry,
  formatPrice,
  typeLabel,
  offerLabel,
} from "@/lib/api";
import { useFavorites } from "@/context/favorites-context";
import { recordView } from "@/lib/recommendations";
import type { ListingDetailResponse, ListingSummary, InquiryBody } from "@/lib/types";

export default function ListingDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();

  const [data, setData] = useState<ListingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const { has, toggle } = useFavorites();
  const [relatedListings, setRelatedListings] = useState<ListingSummary[]>([]);

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
          // Record this view for personalised recommendations
          recordView(slug, res.data.listing.province, res.data.listing.type);
          // Fetch related listings: same province+type first, fallback to same province
          const { province, type, price } = res.data.listing;
          const priceMin = Math.round(price * 0.5);
          const priceMax = Math.round(price * 1.5);
          const [r1, r2] = await Promise.all([
            getListings({ province, type, limit: 8 }),
            getListings({ province, limit: 8 }),
          ]);
          const seen = new Set<string>();
          const merged: ListingSummary[] = [];
          for (const res2 of [r1, r2]) {
            if (res2.success) {
              for (const l of res2.data) {
                if (l.slug !== slug && !seen.has(l.slug)) {
                  seen.add(l.slug);
                  merged.push(l);
                }
              }
            }
          }
          // Sort: same type first, then by price proximity
          merged.sort((a, b) => {
            const aType = a.type === type ? 0 : 1;
            const bType = b.type === type ? 0 : 1;
            if (aType !== bType) return aType - bType;
            return Math.abs(a.price - price) - Math.abs(b.price - price);
          });
          setRelatedListings(merged.filter(l => l.price >= priceMin && l.price <= priceMax).slice(0, 4).concat(
            merged.filter(l => l.price < priceMin || l.price > priceMax)
          ).slice(0, 4));
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

  useEffect(() => {
    if (session?.user) {
      setInquiryName(session.user.name || "");
      setInquiryEmail(session.user.email || "");
      const backendUser = (session as unknown as Record<string, unknown>).backendUser as
        | { phone?: string }
        | undefined;
      if (backendUser?.phone) {
        setInquiryPhone(backendUser.phone);
      }
    }
  }, [session]);

  const favorited = data ? has(data.listing.id) : false;

  const handleFavorite = async () => {
    if (!session?.user || !data) return;
    await toggle(data.listing.id);
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

  const prevImage = useCallback(() => {
    if (!data) return;
    setSelectedImage((prev) =>
      prev === 0 ? data.images.length - 1 : prev - 1
    );
  }, [data]);

  const nextImage = useCallback(() => {
    if (!data) return;
    setSelectedImage((prev) =>
      prev === data.images.length - 1 ? 0 : prev + 1
    );
  }, [data]);

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
        <p className="mt-2 text-muted-foreground">
          {error || "ประกาศนี้อาจถูกลบหรือไม่มีอยู่ในระบบ"}
        </p>
        <Link href="/search">
          <Button className="mt-4">กลับไปค้นหา</Button>
        </Link>
      </div>
    );
  }

  const { listing, images: rawImages, facilities } = data;
  // Sort so cover image appears first
  const images = [...rawImages].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0));
  const hasCoords = listing.latitude != null && listing.longitude != null;
  const mapCenter = hasCoords
    ? { lat: listing.latitude!, lng: listing.longitude! }
    : { lat: 13.7563, lng: 100.5018 };
  const fullAddress = [
    listing.address,
    listing.subdistrict,
    listing.district,
    listing.province,
  ]
    .filter(Boolean)
    .join(", ");
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
    : listing.map_url || `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Back button */}
      <Link
        href="/search"
        className="mb-4 inline-flex items-center gap-1 text-sm text-blue-900 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> กลับไปค้นหา
      </Link>

      {/* ===== MAIN: Image Gallery + Property Info ===== */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left — Image Gallery (3/5) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200">
            {images.length > 0 ? (
              <>
                <Image
                  src={images[selectedImage]?.url || "/placeholder-house.svg"}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white transition"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white transition"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-800" />
                    </button>
                  </>
                )}
                {/* Bottom overlay buttons */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => {
                      const el = document.getElementById("map-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-blue-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-800 transition"
                  >
                    <MapPin className="h-4 w-4" /> ดูแผนที่
                  </button>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                ไม่มีรูปภาพ
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === selectedImage
                      ? "border-blue-900 ring-2 ring-blue-300"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Property Info (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Type badge + Favorite */}
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-900 text-white">
                {typeLabel(listing.type)}
              </Badge>
              <Badge variant="outline">{offerLabel(listing.offer)}</Badge>
              {listing.is_featured && (
                <Badge className="bg-amber-500 text-white">PREMIUM</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleFavorite}
                title={favorited ? "เอาออกจากรายการโปรด" : "บันทึกทรัพย์สิน"}
              >
                <Heart
                  className={`h-4 w-4 ${
                    favorited ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                title="แชร์"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {listing.title}
            </h1>
            {listing.address && (
              <p className="mt-1.5 text-sm text-gray-700">
                {listing.address}
              </p>
            )}
            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {[listing.subdistrict, listing.district, listing.province]
                .filter(Boolean)
                .join(", ")}
            </p>
            {hasCoords && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                พิกัด : {listing.latitude}, {listing.longitude}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-3xl font-bold text-blue-900">
              {formatPrice(listing.price)}{" "}
              <span className="text-base font-normal text-blue-800">บาท</span>
              {listing.offer === "rent" && (
                <span className="text-lg font-normal"> /เดือน</span>
              )}
            </p>
            {listing.price_rent && listing.offer === "sale_rent" && (
              <p className="mt-1 text-lg text-muted-foreground">
                เช่า {formatPrice(listing.price_rent)} บาท/เดือน
              </p>
            )}
          </div>

          {/* Area stats — icon rows like Alpha Capital */}
          {(listing.area != null || listing.land_area != null) && (
            <div className="space-y-2">
              {listing.area != null && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Building className="h-4 w-4 text-blue-900" />
                  </div>
                  <span className="text-sm text-gray-700">
                    พื้นที่ใช้สอย : <span className="font-semibold">{listing.area} ตร.ม.</span>
                  </span>
                </div>
              )}
              {listing.land_area != null && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Maximize className="h-4 w-4 text-blue-900" />
                  </div>
                  <span className="text-sm text-gray-700">
                    เนื้อที่ : <span className="font-semibold">{listing.land_area} ตร.ว.</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div>
              <h3 className="font-semibold text-gray-900">รายละเอียดทรัพย์</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {listing.description}
              </p>
            </div>
          )}

          {/* Detail grid */}
          <div className="divide-y text-sm">
            {listing.status && (
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gray-500">สถานะ :</span>
                <span className="font-medium text-gray-900">
                  {listing.status === "active"
                    ? "ทรัพย์พร้อมขาย"
                    : listing.status}
                </span>
              </div>
            )}
            {listing.floors != null && (
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gray-500">จำนวนชั้น :</span>
                <span>{listing.floors} ชั้น</span>
              </div>
            )}
            {listing.parking != null && (
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gray-500">ที่จอดรถ :</span>
                <span>{listing.parking} คัน</span>
              </div>
            )}
            {listing.year_built != null && (
              <div className="flex justify-between py-2.5">
                <span className="font-medium text-gray-500">ปีที่สร้าง :</span>
                <span>{listing.year_built}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5">
              <span className="font-medium text-gray-500">เข้าชม :</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {listing.view_count} ครั้ง
              </span>
            </div>
          </div>

          {/* Quick stats — bedrooms / bathrooms */}
          {(listing.bedrooms != null || listing.bathrooms != null) && (
            <div className="grid grid-cols-2 gap-3">
              {listing.bedrooms != null && (
                <div className="flex items-center gap-2.5 rounded-lg border p-3">
                  <Bed className="h-5 w-5 text-blue-900" />
                  <div>
                    <p className="text-sm text-muted-foreground">ห้องนอน</p>
                    <p className="font-bold">{listing.bedrooms}</p>
                  </div>
                </div>
              )}
              {listing.bathrooms != null && (
                <div className="flex items-center gap-2.5 rounded-lg border p-3">
                  <Bath className="h-5 w-5 text-blue-900" />
                  <div>
                    <p className="text-sm text-muted-foreground">ห้องน้ำ</p>
                    <p className="font-bold">{listing.bathrooms}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact button */}
          <Button
            className="w-full bg-blue-900 py-6 text-base font-bold hover:bg-blue-800"
            onClick={() => {
              const el = document.getElementById("inquiry-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            สนใจทรัพย์ติดต่อเจ้าหน้าที่
          </Button>
        </div>
      </div>

      {/* ===== GOOGLE MAP SECTION ===== */}
      <div id="map-section" className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">แผนที่</h2>
        <div className="overflow-hidden rounded-xl border">
          {hasCoords ? (
            <>
              <iframe
                src={`https://maps.google.com/maps?q=${listing.latitude},${listing.longitude}&z=16&output=embed`}
                width="100%"
                height="360"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="แผนที่"
              />
              <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                <p className="truncate text-sm text-gray-500">{fullAddress}</p>
                <a
                  href={listing.map_url || googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-blue-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
                >
                  <MapPin className="h-4 w-4" /> เปิดผ่าน Google map
                </a>
              </div>
            </>
          ) : (
            <>
              {fullAddress ? (
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`}
                  width="100%"
                  height="360"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="แผนที่"
                />
              ) : (
                <div className="flex h-[360px] flex-col items-center justify-center gap-2 bg-gray-100">
                  <MapPin className="h-10 w-10 text-gray-400" />
                  <p className="text-muted-foreground">ไม่มีข้อมูลพิกัดสำหรับทรัพย์นี้</p>
                </div>
              )}
              <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                <p className="truncate text-sm text-gray-500">{fullAddress || listing.province || ""}</p>
                <a
                  href={listing.map_url || googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-blue-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
                >
                  <MapPin className="h-4 w-4" /> เปิดผ่าน Google map
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== DESCRIPTION & FACILITIES ===== */}
      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          {listing.description && null}

          {facilities.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                สิ่งอำนวยความสะดวก
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {facilities.map((f) => (
                  <Badge key={f.id} variant="secondary" className="text-sm">
                    {f.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inquiry form */}
        <div id="inquiry-section" className="lg:col-span-2">
          <div className="rounded-xl border p-5 sticky top-4">
            <h3 className="text-lg font-bold text-gray-900">สอบถามเพิ่มเติม</h3>
            {inquirySent ? (
              <div className="mt-4 rounded-lg bg-green-50 p-4 text-center text-sm text-green-800">
                ส่งข้อความเรียบร้อยแล้ว! ผู้ลงประกาศจะติดต่อกลับ
              </div>
            ) : (
              <form onSubmit={handleInquiry} className="mt-4 space-y-3">
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
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-900 py-5 text-base font-bold hover:bg-blue-800"
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

      {/* ===== RELATED LISTINGS ===== */}
      {relatedListings.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              ทรัพย์อื่นๆที่น่าสนใจ
            </h2>
            <Link href={`/search?province=${listing.province}`}>
              <Button variant="outline" className="rounded-full">
                ดูทั้งหมด
              </Button>
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedListings.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.slug}`}
                className="group overflow-hidden rounded-xl border transition hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-gray-200">
                  {item.cover_url ? (
                    <Image
                      src={item.cover_url}
                      alt={item.title}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      ไม่มีรูป
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground">
                    {typeLabel(item.type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.district}, {item.province}
                  </p>
                  <p className="mt-1 font-bold text-sm text-gray-900 line-clamp-1">
                    {item.title}
                  </p>
                  {item.area != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      พื้นที่ใช้สอย: {item.area} ตร.ม.
                    </p>
                  )}
                  <p className="mt-2 text-lg font-bold text-blue-900">
                    {formatPrice(item.price)}{" "}
                    <span className="text-xs font-normal text-gray-500">
                      บาท
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
