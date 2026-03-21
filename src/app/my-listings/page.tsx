"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Plus,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "@/components/listing-card";
import { getListings, formatPrice } from "@/lib/api";
import type { ListingSummary } from "@/lib/types";

const PER_PAGE = 12;

export default function MyListingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const backendUser = (session as any)?.backendUser;

  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchListings = useCallback(
    async (p = page, q = query) => {
      if (!backendUser?.id) return;
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          user_id: backendUser.id,
          page: p,
          limit: PER_PAGE,
        };
        if (q.trim()) params.q = q.trim();
        const res = await getListings(params);
        if (res.success) {
          setListings(res.data);
          if (res.meta) {
            setTotalPages(res.meta.pages || 1);
            setTotal(res.meta.total || 0);
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [backendUser?.id, page, query]
  );

  useEffect(() => {
    if (backendUser?.id) fetchListings();
  }, [backendUser?.id, fetchListings]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchListings(1, query);
  };

  const goPage = (p: number) => {
    setPage(p);
    fetchListings(p, query);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Home className="h-6 w-6" />
          ประกาศของฉัน
          {!loading && (
            <span className="text-base font-normal text-muted-foreground">
              ({total} รายการ)
            </span>
          )}
        </h1>
        <Link href="/listings/create">
          <Button className="bg-blue-900 hover:bg-blue-800">
            <Plus className="mr-1.5 h-4 w-4" />
            ลงประกาศใหม่
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาประกาศของฉัน..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-24"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-900 hover:bg-blue-800"
          >
            ค้นหา
          </Button>
        </div>
      </form>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border bg-white p-16 text-center">
          <Home className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-muted-foreground">
            {query.trim() ? "ไม่พบประกาศที่ค้นหา" : "ยังไม่มีประกาศ"}
          </p>
          {!query.trim() && (
            <Link href="/listings/create">
              <Button className="mt-4 bg-blue-900 hover:bg-blue-800">
                ลงประกาศแรก
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
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
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 2
                )
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "..." ? (
                    <span key={`dot-${i}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === page ? "default" : "outline"}
                      size="sm"
                      className={
                        item === page ? "bg-blue-900 hover:bg-blue-800" : ""
                      }
                      onClick={() => goPage(item as number)}
                    >
                      {item}
                    </Button>
                  )
                )}

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
