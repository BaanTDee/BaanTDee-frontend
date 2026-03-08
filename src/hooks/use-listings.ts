"use client";

import { useState, useEffect, useCallback } from "react";
import { getListings, formatPrice } from "@/lib/api";
import type { ListingSummary, ListingsQuery, PaginationMeta } from "@/lib/types";

export interface UseListingsResult {
  listings: ListingSummary[];
  meta: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  refetch: (params?: ListingsQuery) => Promise<void>;
}

export function useListings(initialParams: ListingsQuery = {}): UseListingsResult {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (params: ListingsQuery = initialParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getListings(params);
      if (res.success) {
        setListings(res.data);
        setMeta(res.meta);
      } else {
        setError(res.error.message);
      }
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch(initialParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { listings, meta, loading, error, refetch: fetch };
}

/** Convert a ListingSummary to props suitable for ListingCard */
export function toCardProps(listing: ListingSummary) {
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    location: `${listing.district} ${listing.province}`,
    price: formatPrice(listing.price),
    image: listing.cover_url || "/placeholder-house.svg",
    tag: listing.is_featured ? ("PREMIUM" as const) : undefined,
    type: listing.type,
    offer: listing.offer,
  };
}
