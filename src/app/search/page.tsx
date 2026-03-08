"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "@/components/listing-card";
import { getListings, formatPrice, typeLabel, offerLabel } from "@/lib/api";
import type { ListingSummary, ListingType, ListingOffer, PaginationMeta } from "@/lib/types";

const TYPES: { value: ListingType; label: string }[] = [
  { value: "house", label: "บ้านเดี่ยว" },
  { value: "condo", label: "คอนโด" },
  { value: "townhouse", label: "ทาวน์เฮาส์" },
  { value: "land", label: "ที่ดิน" },
  { value: "commercial", label: "อาคารพาณิชย์" },
];

const OFFERS: { value: ListingOffer; label: string }[] = [
  { value: "sale", label: "ขาย" },
  { value: "rent", label: "เช่า" },
  { value: "sale_rent", label: "ขาย/เช่า" },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial filters from URL
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [type, setType] = useState<ListingType | "">(
    (searchParams.get("type") as ListingType) || ""
  );
  const [offer, setOffer] = useState<ListingOffer | "">(
    (searchParams.get("offer") as ListingOffer) || ""
  );
  const [province, setProvince] = useState(searchParams.get("province") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [showFilters, setShowFilters] = useState(false);

  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const doSearch = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page: p, per_page: 12 };
        if (query.trim()) params.q = query.trim();
        if (type) params.type = type;
        if (offer) params.offer = offer;
        if (province) params.province = province;
        if (minPrice) params.min_price = Number(minPrice);
        if (maxPrice) params.max_price = Number(maxPrice);

        const res = await getListings(params);
        if (res.success) {
          setListings(res.data);
          setMeta(res.meta);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [query, type, offer, province, minPrice, maxPrice, page]
  );

  // Sync URL and fetch on param changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (offer) params.set("offer", offer);
    if (province) params.set("province", province);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (page > 1) params.set("page", String(page));
    router.replace(`/search?${params.toString()}`, { scroll: false });
    doSearch(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, offer, province, page]);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    doSearch(1);
  };

  const clearFilters = () => {
    setQuery("");
    setType("");
    setOffer("");
    setProvince("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  const hasFilters = !!(query || type || offer || province || minPrice || maxPrice);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search bar */}
      <form onSubmit={handleSubmitSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาทำเล, ชื่อโครงการ, จังหวัด..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
          ค้นหา
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1"
        >
          <SlidersHorizontal className="h-4 w-4" />
          ตัวกรอง
        </Button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="mt-4 rounded-lg border bg-gray-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Type */}
            <div>
              <label className="mb-1 block text-sm font-medium">ประเภท</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as ListingType | ""); setPage(1); }}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">ทั้งหมด</option>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Offer */}
            <div>
              <label className="mb-1 block text-sm font-medium">ซื้อ/เช่า</label>
              <select
                value={offer}
                onChange={(e) => { setOffer(e.target.value as ListingOffer | ""); setPage(1); }}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">ทั้งหมด</option>
                {OFFERS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Province */}
            <div>
              <label className="mb-1 block text-sm font-medium">จังหวัด</label>
              <Input
                placeholder="เช่น Bangkok"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                onBlur={() => { setPage(1); doSearch(1); }}
              />
            </div>

            {/* Price range */}
            <div>
              <label className="mb-1 block text-sm font-medium">ราคา (บาท)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="ต่ำสุด"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={() => { setPage(1); doSearch(1); }}
                />
                <span className="self-center text-muted-foreground">-</span>
                <Input
                  placeholder="สูงสุด"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onBlur={() => { setPage(1); doSearch(1); }}
                />
              </div>
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 flex items-center gap-1 text-sm text-red-600 hover:underline"
            >
              <X className="h-3 w-3" /> ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-900">
              {typeLabel(type)}
              <button onClick={() => { setType(""); setPage(1); }}><X className="h-3 w-3" /></button>
            </span>
          )}
          {offer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-900">
              {offerLabel(offer)}
              <button onClick={() => { setOffer(""); setPage(1); }}><X className="h-3 w-3" /></button>
            </span>
          )}
          {province && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-900">
              {province}
              <button onClick={() => { setProvince(""); setPage(1); }}><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Results header */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta ? `${meta.total} ประกาศ` : "กำลังค้นหา..."}
        </p>
      </div>

      {/* Results grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        </div>
      ) : listings.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-gray-900">ไม่พบประกาศ</p>
          <p className="mt-1 text-sm text-muted-foreground">ลองปรับตัวกรองหรือคำค้นหาใหม่</p>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ก่อนหน้า
          </Button>
          <span className="text-sm text-muted-foreground">
            หน้า {page} / {meta.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            ถัดไป
          </Button>
        </div>
      )}
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
