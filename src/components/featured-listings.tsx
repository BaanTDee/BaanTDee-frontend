"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import ListingCard from "@/components/listing-card";
import { getListings, formatPrice } from "@/lib/api";
import type { ListingSummary } from "@/lib/types";

export default function FeaturedListings() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        // Backend doesn't have a dedicated "featured" flag query,
        // so we fetch the first page and take featured ones.
        // If backend adds ?featured=true param later, just switch here.
        const res = await getListings({ per_page: 20 });
        if (res.success && Array.isArray(res.data)) {
          const featured = res.data.filter((l) => l.is_featured);
          setListings(featured.length > 0 ? featured.slice(0, 8) : res.data.slice(0, 6));
        } else {
          setListings([]);
        }
      } catch (err) {
        console.error('Failed to fetch featured listings:', err);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">แนะนำสำหรับคุณ</h2>
        <Link
          href="/search"
          className="flex items-center gap-1 text-sm text-blue-900 hover:underline"
        >
          ดูทั้งหมด <ChevronRight className="h-4 w-4" />
        </Link>
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
              tag="PREMIUM"
              offer={listing.offer}
              type={listing.type}
            />
          ))
        ) : (
          <p className="w-full py-12 text-center text-muted-foreground">
            ยังไม่มีประกาศแนะนำ
          </p>
        )}
      </div>
    </section>
  );
}
