"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import ListingCard from "@/components/listing-card";
import { getFavorites, formatPrice } from "@/lib/api";
import type { FavoriteItem, PaginationMeta } from "@/lib/types";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!session?.user) return;
    async function fetchFavs() {
      setLoading(true);
      try {
        const res = await getFavorites(page);
        if (res.success) {
          setFavorites(res.data);
          setMeta(res.meta);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchFavs();
  }, [session, page]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Heart className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-gray-900">กรุณาเข้าสู่ระบบ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          เข้าสู่ระบบเพื่อดูรายการโปรดของคุณ
        </p>
        <Link href="/login">
          <Button className="mt-4 bg-blue-900 hover:bg-blue-800">เข้าสู่ระบบ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">รายการโปรด</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {meta ? `${meta.total} รายการที่บันทึกไว้` : "กำลังโหลด..."}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((fav) => (
            <ListingCard
              key={fav.listing_id}
              id={fav.listing_id}
              slug={fav.slug}
              title={fav.title}
              location={`${fav.district} ${fav.province}`}
              price={formatPrice(fav.price)}
              image={fav.cover_url || "/placeholder-house.svg"}
              tag="PREMIUM"
              isFavorited
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีรายการโปรด</p>
          <p className="mt-1 text-sm text-muted-foreground">
            กดไอคอนหัวใจบนรายการประกาศเพื่อบันทึก
          </p>
          <Link href="/search">
            <Button className="mt-4" variant="outline">ไปค้นหาประกาศ</Button>
          </Link>
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
