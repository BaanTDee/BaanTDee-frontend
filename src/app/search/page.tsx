"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Loader2, X,
  Home, Building2, Landmark, TreePine, Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "@/components/listing-card";
import { getListings, formatPrice, typeLabel, offerLabel } from "@/lib/api";
import type { ListingSummary, ListingType, ListingOffer, PaginationMeta } from "@/lib/types";

const TYPE_ICONS: { value: ListingType | ""; label: string; icon: React.ElementType }[] = [
  { value: "house",      label: "บ้านเดี่ยว",    icon: Home },
  { value: "townhouse",  label: "ทาวน์เฮาส์",    icon: Landmark },
  { value: "condo",      label: "คอนโดมิเนียม",  icon: Building2 },
  { value: "commercial", label: "อาคารพาณิชย์",  icon: Store },
  { value: "land",       label: "ที่ดิน",         icon: TreePine },
];

const OFFERS: { value: ListingOffer | ""; label: string }[] = [
  { value: "",          label: "ทั้งหมด" },
  { value: "sale",      label: "ขาย" },
  { value: "rent",      label: "เช่า" },
  { value: "sale_rent", label: "ขาย/เช่า" },
];

const PRICE_MAX = 40_000_000;
const PRICE_STEP = 500_000;
const PRICE_GAP = 2_500_000;

function formatPriceLabel(val: number): string {
  if (val <= 0) return "฿0";
  if (val >= PRICE_MAX) return "40 ล้าน+";
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `฿${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} ล.`;
  }
  return `฿${(val / 1000).toFixed(0)}K`;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery]       = useState(searchParams.get("q") || "");
  const [type, setType]         = useState<ListingType | "">((searchParams.get("type") as ListingType) || "");
  const [offer, setOffer]       = useState<ListingOffer | "">((searchParams.get("offer") as ListingOffer) || "");
  const [province, setProvince] = useState(searchParams.get("province") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [page, setPage]         = useState(Number(searchParams.get("page")) || 1);

  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [meta, setMeta]         = useState<PaginationMeta | null>(null);
  const [loading, setLoading]   = useState(true);

  // Price slider draft state
  const [sliderMin, setSliderMin] = useState(minPrice ? Number(minPrice) : 0);
  const [sliderMax, setSliderMax] = useState(maxPrice ? Math.min(Number(maxPrice), PRICE_MAX) : PRICE_MAX);

  useEffect(() => {
    setSliderMin(minPrice ? Number(minPrice) : 0);
    setSliderMax(maxPrice ? Math.min(Number(maxPrice), PRICE_MAX) : PRICE_MAX);
  }, [minPrice, maxPrice]);

  const commitPrice = () => {
    let min = Math.max(0, Math.min(sliderMin, PRICE_MAX));
    let max = Math.max(0, Math.min(sliderMax, PRICE_MAX));
    if (min > max) [min, max] = [max, min];
    setSliderMin(min);
    setSliderMax(max);
    setMinPrice(min > 0 ? String(min) : "");
    setMaxPrice(max < PRICE_MAX ? String(max) : "");
    setPage(1);
  };

  const doSearch = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page: p, per_page: 12 };
        if (query.trim()) params.q = query.trim();
        if (type)     params.type = type;
        if (offer)    params.offer = offer;
        if (province) params.province = province;
        if (minPrice) params.min_price = Number(minPrice);
        if (maxPrice) params.max_price = Number(maxPrice);
        const res = await getListings(params);
        if (res.success) { setListings(res.data); setMeta(res.meta); }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    },
    [query, type, offer, province, minPrice, maxPrice, page]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (query)    params.set("q", query);
    if (type)     params.set("type", type);
    if (offer)    params.set("offer", offer);
    if (province) params.set("province", province);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (page > 1) params.set("page", String(page));
    router.replace(`/search?${params.toString()}`, { scroll: false });
    doSearch(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, offer, province, minPrice, maxPrice, page]);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    doSearch(1);
  };

  const clearFilters = () => {
    setQuery(""); setType(""); setOffer(""); setProvince("");
    setMinPrice(""); setMaxPrice(""); setPage(1);
  };

  const hasFilters = !!(query || type || offer || province || minPrice || maxPrice);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {province ? `อสังหาริมทรัพย์ใน${province}` : "ผลการค้นหา"}
        </h1>
        {meta && (
          <p className="mt-1 text-sm text-gray-500">{meta.total.toLocaleString()} รายการ</p>
        )}
      </div>

      {/* Type icon grid */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {TYPE_ICONS.map((cat) => {
            const Icon = cat.icon;
            const active = type === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => { setType(active ? "" : cat.value as ListingType); setPage(1); }}
                className={`flex flex-col items-center gap-2 rounded-xl p-3 transition ${
                  active
                    ? "bg-blue-900 text-white"
                    : "hover:bg-blue-50 text-gray-600 hover:text-blue-900"
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                  active ? "bg-white/20" : "bg-gray-100"
                }`}>
                  <Icon className={`h-6 w-6 ${active ? "text-white" : ""}`} />
                </div>
                <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main layout: sidebar + results */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Filter sidebar */}
        <aside className="w-full lg:w-60 lg:flex-shrink-0">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-5">

            {/* Search bar */}
            <form onSubmit={handleSubmitSearch}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="ทำเล, โครงการ..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </form>

            {/* Province */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">จังหวัด</label>
              <Input
                placeholder="เช่น เชียงใหม่"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                onBlur={() => { setPage(1); doSearch(1); }}
                className="text-sm"
              />
            </div>

            {/* Offer */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">ซื้อ / เช่า</label>
              <div className="space-y-1">
                {OFFERS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => { setOffer(o.value as ListingOffer | ""); setPage(1); }}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition ${
                      offer === o.value
                        ? "bg-blue-900 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range slider */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">ราคา</label>
              <p className="text-center text-sm font-medium text-blue-900 mb-3">
                {formatPriceLabel(sliderMin)} – {formatPriceLabel(sliderMax)}
              </p>
              {/* Dual-range slider */}
              <div className="relative h-2 mx-1">
                <div className="absolute inset-0 rounded-full bg-gray-200" />
                <div
                  className="absolute h-full rounded-full bg-blue-900"
                  style={{
                    left: `${(sliderMin / PRICE_MAX) * 100}%`,
                    right: `${100 - (sliderMax / PRICE_MAX) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={sliderMin}
                  onChange={(e) => setSliderMin(Math.min(Number(e.target.value), sliderMax - PRICE_GAP))}
                  onPointerUp={commitPrice}
                  onTouchEnd={commitPrice}
                  className={`price-range-slider absolute inset-0 w-full ${sliderMin >= sliderMax ? "z-[5]" : "z-[3]"}`}
                />
                <input
                  type="range"
                  min={0}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={sliderMax}
                  onChange={(e) => setSliderMax(Math.max(Number(e.target.value), sliderMin + PRICE_GAP))}
                  onPointerUp={commitPrice}
                  onTouchEnd={commitPrice}
                  className="price-range-slider absolute inset-0 w-full z-[4]"
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 mx-1">
                <span>฿0</span>
                <span>40 ล้าน+</span>
              </div>
              {/* Custom price inputs */}
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="ต่ำสุด"
                  value={sliderMin > 0 ? sliderMin : ""}
                  onChange={(e) => setSliderMin(e.target.value ? Math.max(0, Number(e.target.value)) : 0)}
                  onBlur={commitPrice}
                  onKeyDown={(e) => { if (e.key === "Enter") commitPrice(); }}
                  className="text-xs h-8"
                />
                <span className="text-gray-400 text-xs shrink-0">–</span>
                <Input
                  type="number"
                  placeholder="สูงสุด"
                  value={sliderMax < PRICE_MAX ? sliderMax : ""}
                  onChange={(e) => setSliderMax(e.target.value ? Math.max(0, Number(e.target.value)) : PRICE_MAX)}
                  onBlur={commitPrice}
                  onKeyDown={(e) => { if (e.key === "Enter") commitPrice(); }}
                  className="text-xs h-8"
                />
              </div>
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => { setMinPrice(""); setMaxPrice(""); setSliderMin(0); setSliderMax(PRICE_MAX); setPage(1); }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <X className="h-3.5 w-3.5" /> ล้างราคา
                </button>
              )}
            </div>

            {!!(query || type || offer || province) && (
              <button
                onClick={clearFilters}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <X className="h-3.5 w-3.5" /> ล้างตัวกรอง
              </button>
            )}
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Active chips */}
          {hasFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {type && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">
                  {typeLabel(type)}
                  <button onClick={() => { setType(""); setPage(1); }}><X className="h-3 w-3" /></button>
                </span>
              )}
              {offer && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">
                  {offerLabel(offer)}
                  <button onClick={() => { setOffer(""); setPage(1); }}><X className="h-3 w-3" /></button>
                </span>
              )}
              {province && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-900">
                  {province}
                  <button onClick={() => { setProvince(""); setPage(1); }}><X className="h-3 w-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                  {formatPriceLabel(minPrice ? Number(minPrice) : 0)} – {formatPriceLabel(maxPrice ? Number(maxPrice) : PRICE_MAX)}
                  <button onClick={() => { setMinPrice(""); setMaxPrice(""); setPage(1); }}><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    slug={listing.slug}
                    title={listing.title}
                    location={`${listing.district} ${listing.province}`}
                    price={formatPrice(listing.price)}
                    image={listing.cover_url || "/placeholder-house.svg"}
                    tag={listing.is_featured ? "PREMIUM" : undefined}
                    offer={listing.offer}
                    type={listing.type}
                  />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    ก่อนหน้า
                  </Button>
                  <span className="text-sm text-gray-500">หน้า {page} / {meta.pages}</span>
                  <Button variant="outline" size="sm" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
                    ถัดไป
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center">
              <p className="text-lg font-medium text-gray-900">ไม่พบประกาศ</p>
              <p className="mt-1 text-sm text-gray-500">ลองปรับตัวกรองหรือคำค้นหาใหม่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
