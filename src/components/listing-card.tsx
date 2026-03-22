"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { useFavorites } from "@/context/favorites-context";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

export interface ListingCardProps {
  id?: number;
  slug?: string;
  title: string;
  location: string;
  price: string;
  image: string;
  tag?: "HOT" | "PREMIUM" | "NEW";
  ownerType?: string;
  offer?: string;
  type?: string;
  isFavorited?: boolean;
  editHref?: string;
  createdAt?: string;
}

export default function ListingCard({
  id,
  slug,
  title,
  location,
  price,
  image,
  tag,
  ownerType,
  offer,
  editHref,
  createdAt,
}: ListingCardProps) {
  const isNew = createdAt
    ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7
    : false;
  const { data: session } = useSession();
  const { has, toggle } = useFavorites();
  const router = useRouter();
  const favorited = id ? has(id) : false;
  const [imgSrc, setImgSrc] = useState(image || "/placeholder-house.svg");
  const handleImgError = useCallback(() => setImgSrc("/placeholder-house.svg"), []);

  const tagColors = {
    HOT: "bg-red-500 text-white",
    PREMIUM: "bg-blue-900 text-white",
    NEW: "bg-green-500 text-white",
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user || !id) return;
    await toggle(id);
  };

  const href = slug ? `/listings/${slug}` : "#";

  // Offer badge text
  const offerText = offer === "rent" ? "เช่า" : offer === "sale_rent" ? "ขาย/เช่า" : null;

  return (
    <Link href={href} className="group min-w-[220px] max-w-[280px] flex-shrink-0 cursor-pointer block">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200">
        <Image
          src={imgSrc}
          alt={title}
          fill
          sizes="280px"
          className="object-cover transition group-hover:scale-105"
          onError={handleImgError}
        />

        {/* Tag + New badges (top-left row) */}
        <div className="absolute left-2 top-2 flex gap-1">
          {tag && (
            <Badge className={`text-xs ${tagColors[tag]}`}>
              🔥 {tag}
            </Badge>
          )}
          {isNew && (
            <Badge className="text-xs bg-red-500 text-white">
              ใหม่
            </Badge>
          )}
        </div>

        {/* Offer badge */}
        {offerText && (
          <Badge className="absolute left-2 bottom-8 text-xs bg-emerald-600 text-white">
            {offerText}
          </Badge>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          className={`absolute right-2 top-2 rounded-full p-1.5 transition ${
            favorited
              ? "bg-red-50 opacity-100"
              : "bg-white/80 opacity-0 group-hover:opacity-100 hover:bg-white"
          }`}
        >
          <Heart
            className={`h-4 w-4 ${
              favorited ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>

        {/* Owner type */}
        {ownerType && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">
              {ownerType}
            </span>
          </div>
        )}

        {/* Edit button */}
        {editHref && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(editHref);
            }}
            className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-full bg-white/90 border border-gray-200 px-3 py-1.5 text-xs font-medium text-blue-900 shadow hover:bg-blue-900 hover:text-white transition"
          >
            <Pencil className="h-3 w-3" />
            แก้ไข
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-2 px-1">
        <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-900">
          {title}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location}
        </p>
        <p className="mt-1 text-base font-bold text-gray-900">
          ฿ {price}
        </p>
      </div>
    </Link>
  );
}
