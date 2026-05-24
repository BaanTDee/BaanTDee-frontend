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
  showLabels?: boolean;
}

// Crowded central-region provinces shown as numbers on the map with a legend below
const CENTRAL_LEGEND = [
  { id: "bangkok",        name: "กรุงเทพมหานคร" },
  { id: "nonthaburi",    name: "นนทบุรี" },
  { id: "pathumthani",   name: "ปทุมธานี" },
  { id: "nakhonpathom",  name: "นครปฐม" },
  { id: "samutprakan",   name: "สมุทรปราการ" },
  { id: "samutsakhon",   name: "สมุทรสาคร" },
  { id: "samutsongkhram",name: "สมุทรสงคราม" },
  { id: "ayutthaya",     name: "พระนครศรีอยุธยา" },
  { id: "angthong",      name: "อ่างทอง" },
  { id: "singburi",      name: "สิงห์บุรี" },
];

export default function RegionProvinceMap({
  regionId,
  onSelectProvince,
  showLabels = true,
}: RegionProvinceMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const regionData = REGION_PROVINCE_MAP[regionId];

  if (!regionData || regionData.provinces.length === 0) {
    return null;
  }

  const { imageFile, provinces } = regionData;
  const isCentral = regionId === "central";

  return (
    <div className="relative w-full select-none">
      <div className="relative" style={{ filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.25))" }}>
        <Image
          src={imageFile}
          alt={`แผนที่ภาค ${regionId}`}
          width={1440}
          height={2560}
          className="w-full h-auto pointer-events-none"
          priority
          unoptimized
        />
        <svg
          viewBox="0 0 100 177.778"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
        >
          {/* Pass 1: polygon hit areas */}
          {provinces.map((province: ProvincePolygon) => (
            <polygon
              key={province.id}
              points={province.points}
              fill="#ffffff"
              fillOpacity={hoveredId === province.id ? 0.3 : 0}
              stroke="transparent"
              strokeWidth={2}
              className="cursor-pointer transition-all duration-100"
              onMouseEnter={() => setHoveredId(province.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectProvince(province.id, province.name)}
            />
          ))}

          {/* Pass 2: labels — hovered province sorted last so it renders on top */}
          {showLabels && [...provinces]
            .sort((a, b) => (hoveredId === a.id ? 1 : hoveredId === b.id ? -1 : 0))
            .map((province: ProvincePolygon) => {
              const isHovered = hoveredId === province.id;
              const legendIdx = isCentral
                ? CENTRAL_LEGEND.findIndex((l) => l.id === province.id)
                : -1;
              const label = legendIdx >= 0 ? `${legendIdx + 1}` : province.name;
              const sharedProps = {
                x: province.labelX,
                y: province.labelY,
                textAnchor: "middle" as const,
                dominantBaseline: "central" as const,
                fontSize: isHovered ? 6.5 : 4.5,
                fontWeight: 700,
                strokeLinejoin: "round" as const,
                pointerEvents: "none" as const,
                className: "select-none",
              };
              return (
                <g key={`label-${province.id}`}>
                  {/* Outer stroke layer — hovered only */}
                  {isHovered && (
                    <text
                      {...sharedProps}
                      stroke="#ffffff"
                      strokeWidth={3.8}
                      fill="none"
                      paintOrder="stroke"
                    >
                      {label}
                    </text>
                  )}
                  {/* Inner stroke + fill layer */}
                  <text
                    {...sharedProps}
                    stroke={isHovered ? "#083db1" : "white"}
                    strokeWidth={isHovered ? 2.8 : 1}
                    fill={isHovered ? "white" : "#1e3a5f"}
                    paintOrder="stroke"
                  >
                    {label}
                  </text>
                </g>
              );
            })
          }
        </svg>
      </div>

      {/* Numbered legend: trunk overlays the map, items appear at province-bottom level */}
      {isCentral && showLabels && (
        <div
          className="relative z-10"
          style={{ marginLeft: "47.5%", marginTop: "-87.5%" }}
        >
          <div className="border-l-2 border-gray-300" style={{ paddingTop: "10%" }}>
            {CENTRAL_LEGEND.map((item, i) => (
              <div key={item.id} className="flex items-center">
                <div className="w-4 h-px bg-gray-300 shrink-0" />
                <button
                  className={`py-0.5 pl-1 text-base font-bold text-left bg-white transition-colors cursor-pointer ${
                    hoveredId === item.id
                      ? "text-blue-600"
                      : "text-[#1e3a5f] hover:text-blue-500"
                  }`}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectProvince(item.id, item.name)}
                >
                  <span className={`mr-1 ${hoveredId === item.id ? "text-blue-400" : "text-gray-400"}`}>
                    {i + 1}.
                  </span>
                  {item.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
