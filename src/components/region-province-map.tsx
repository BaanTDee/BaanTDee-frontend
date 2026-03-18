"use client";

import Image from "next/image";
import { useState } from "react";
import {
  REGION_PROVINCE_MAP,
  type ProvincePolygon,
} from "@/data/province-polygons";

interface RegionProvinceMapProps {
  regionId: string;
  onSelectProvince: (provinceId: string, provinceName: string) => void;
}

export default function RegionProvinceMap({
  regionId,
  onSelectProvince,
}: RegionProvinceMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const regionData = REGION_PROVINCE_MAP[regionId];

  if (!regionData || regionData.provinces.length === 0) {
    return null;
  }

  const { imageFile, provinces } = regionData;

  return (
    <div className="relative w-full select-none">
      <Image
        src={imageFile}
        alt={`แผนที่ภาค ${regionId}`}
        width={1440}
        height={2560}
        className="w-full h-auto pointer-events-none"
        priority
      />
      <svg
        viewBox="0 0 100 177.778"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {provinces.map((province: ProvincePolygon) => {
          const isHovered = hoveredId === province.id;

          return (
            <g key={province.id}>
              {/* Single polygon — transparent stroke extends hit area over red border */}
              <polygon
                points={province.points}
                fill="#ffffff"
                fillOpacity={isHovered ? 0.4 : 0}
                stroke="transparent"
                strokeWidth={2}
                className="cursor-pointer transition-all duration-100"
                onMouseEnter={() => setHoveredId(province.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectProvince(province.id, province.name)}
              />

              {/* Province label on hover */}
              {isHovered && (
                <g pointerEvents="none">
                  <rect
                    x={province.labelX - 16}
                    y={province.labelY - 4}
                    width={32}
                    height={8}
                    rx={1.5}
                    fill="white"
                    fillOpacity={0.93}
                  />
                  <text
                    x={province.labelX}
                    y={province.labelY + 2.2}
                    textAnchor="middle"
                    fontSize={3.6}
                    fontWeight={700}
                    fill="#1e3a5f"
                    className="select-none"
                  >
                    {province.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
