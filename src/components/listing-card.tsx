import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ListingCardProps {
  title: string;
  location: string;
  price: string;
  image: string;
  tag?: "HOT" | "PREMIUM" | "NEW";
  ownerType?: string;
}

export default function ListingCard({
  title,
  location,
  price,
  image,
  tag,
  ownerType,
}: ListingCardProps) {
  const tagColors = {
    HOT: "bg-red-500 text-white",
    PREMIUM: "bg-blue-900 text-white",
    NEW: "bg-green-500 text-white",
  };

  return (
    <div className="group min-w-[220px] max-w-[280px] flex-shrink-0 cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition group-hover:scale-105"
        />

        {/* Tag badge */}
        {tag && (
          <Badge className={`absolute left-2 top-2 text-xs ${tagColors[tag]}`}>
            🔥 {tag}
          </Badge>
        )}

        {/* Favorite button */}
        <button className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 opacity-0 transition group-hover:opacity-100 hover:bg-white">
          <Heart className="h-4 w-4 text-gray-600" />
        </button>

        {/* Owner type */}
        {ownerType && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">
              {ownerType}
            </span>
          </div>
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
    </div>
  );
}
