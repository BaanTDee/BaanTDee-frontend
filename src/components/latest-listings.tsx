"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import ListingCard from "@/components/listing-card";
import { getListings, formatPrice } from "@/lib/api";
import type { ListingSummary, ListingType } from "@/lib/types";

const tabs: { label: string; type?: ListingType }[] = [
  { label: "ทั้งหมด" },
  { label: "บ้านเดี่ยว", type: "house" },
  { label: "คอนโด", type: "condo" },
  { label: "ทาวน์เฮาส์", type: "townhouse" },
  { label: "ที่ดิน", type: "land" },
];

export default function LatestListings() {
  const [activeTab, setActiveTab] = useState(0);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { limit: 8 };
        const type = tabs[activeTab].type;
        if (type) params.type = type;
        const res = await getListings(params);
        if (!cancelled) {
          if (res.success && Array.isArray(res.data)) {
            setListings(res.data);
          } else {
            setListings([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch listings:', err);
        if (!cancelled) {
          setListings([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [activeTab]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">ประกาศล่าสุด</h2>
        <Link
          href="/search"
          className="flex items-center gap-1 text-sm text-blue-900 hover:underline"
        >
          ดูทั้งหมด <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-4 border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`pb-2 text-sm font-medium transition ${
              i === activeTab
                ? "border-b-2 border-blue-900 text-blue-900"
                : "text-muted-foreground hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable listing cards */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {loading ? (
          <div className="flex w-full items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-900" />
          </div>
        ) : Array.isArray(listings) && listings.length > 0 ? (
          listings.map((listing) => (
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
              createdAt={listing.created_at}
            />
          ))
        ) : (
          <p className="w-full py-12 text-center text-muted-foreground">
            ยังไม่มีประกาศในหมวดนี้
          </p>
        )}
      </div>
    </section>
  );
}
