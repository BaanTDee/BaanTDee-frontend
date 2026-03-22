"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import ListingCard from "@/components/listing-card";
import { getListings, formatPrice } from "@/lib/api";
import { hasPrefs, getTopProvinces, getTopTypes, getViewedSlugs } from "@/lib/recommendations";
import type { ListingSummary } from "@/lib/types";

export default function FeaturedListings() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPersonalised, setIsPersonalised] = useState(false);

  useEffect(() => {
    async function fetchRecommended() {
      try {
        if (hasPrefs()) {
          // --- Personalised path ---
          setIsPersonalised(true);
          const topProvinces = getTopProvinces(2);
          const topTypes = getTopTypes(2);
          const viewedSlugs = new Set(getViewedSlugs());

          // Fetch up to 3 batches in parallel: top province, 2nd province, top type
          const queries = [
            getListings({ province: topProvinces[0], limit: 12, sort: "view_count" }),
            topProvinces[1]
              ? getListings({ province: topProvinces[1], limit: 8, sort: "view_count" })
              : Promise.resolve({ success: false } as const),
            topTypes[0]
              ? getListings({ type: topTypes[0] as never, limit: 8, sort: "view_count" })
              : Promise.resolve({ success: false } as const),
          ];

          const [r1, r2, r3] = await Promise.all(queries);

          const seen = new Set<number>();
          const merged: ListingSummary[] = [];

          for (const res of [r1, r2, r3]) {
            if (res.success && Array.isArray(res.data)) {
              for (const l of res.data) {
                if (!seen.has(l.id) && !viewedSlugs.has(l.slug)) {
                  seen.add(l.id);
                  merged.push(l);
                }
              }
            }
          }

          // Sort: featured first, then by view_count desc
          merged.sort((a, b) => {
            if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
            return (b.view_count ?? 0) - (a.view_count ?? 0);
          });

          setListings(merged.slice(0, 8));
        } else {
          // --- Default path (no history): featured or latest ---
          setIsPersonalised(false);
          const res = await getListings({ limit: 20 });
          if (res.success && Array.isArray(res.data)) {
            const featured = res.data.filter((l) => l.is_featured);
            setListings(
              (featured.length > 0 ? featured : res.data).slice(0, 8)
            );
          } else {
            setListings([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommended();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">แนะนำสำหรับคุณ</h2>
          {isPersonalised && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              จากประวัติการดูของคุณ
            </p>
          )}
        </div>
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
        ) : listings.length > 0 ? (
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
            ยังไม่มีประกาศแนะนำ
          </p>
        )}
      </div>
    </section>
  );
}

