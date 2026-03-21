"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, LayoutGrid, Map, Search } from "lucide-react";
import ThailandRegionMap from "@/components/thailand-region-map";
import RegionProvinceMap from "@/components/region-province-map";
import { regions, type Province } from "@/data/thailand-locations";
import { REGION_PROVINCE_MAP, type ProvincePolygon } from "@/data/province-polygons";

type Step = "region" | "province";
type ProvinceView = "map" | "grid";

const REGION_COLORS: Record<string, string> = {
  northern: "#3DB849",
  northeastern: "#DC3A5C",
  central: "#D27B36",
  eastern: "#2AB1A3",
  southern: "#0D1E83",
};

export default function HomeMapSection() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("region");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(null);
  const [provinceView, setProvinceView] = useState<ProvinceView>("map");
  const [provinceSearch, setProvinceSearch] = useState("");

  const handleSelectRegion = (regionId: string, regionName: string) => {
    setSelectedRegionId(regionId);
    setSelectedRegionName(regionName);
    const hasMap = (REGION_PROVINCE_MAP[regionId]?.provinces?.length ?? 0) > 0;
    setProvinceView(hasMap ? "map" : "grid");
    setStep("province");
  };

  const handleBack = () => {
    setStep("region");
    setSelectedRegionId(null);
    setSelectedRegionName(null);
    setProvinceSearch("");
  };

  const handleSelectProvinceFromMap = (provinceId: string, provinceName: string) => {
    router.push(`/search?province=${encodeURIComponent(provinceName)}`);
  };

  const handleSelectProvince = (province: Province | ProvincePolygon) => {
    router.push(`/search?province=${encodeURIComponent(province.name)}`);
  };

  const selectedRegionData = regions.find((r) => r.id === selectedRegionId);
  const mapProvinces = selectedRegionId ? (REGION_PROVINCE_MAP[selectedRegionId]?.provinces ?? []) : [];
  const hasProvinceMapData =
    selectedRegionId !== null &&
    (REGION_PROVINCE_MAP[selectedRegionId]?.provinces?.length ?? 0) > 0;
  const provinceList = mapProvinces.length > 0 ? mapProvinces : (selectedRegionData?.provinces ?? []);
  const filteredProvinceList = provinceSearch.trim()
    ? provinceList.filter((p) => p.name.includes(provinceSearch.trim()))
    : provinceList;

  return (
    <section id="map-section" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">ค้นหาจากแผนที่</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            คลิกเลือกภาคหรือจังหวัดที่คุณสนใจ
          </p>
        </div>

        {/* Breadcrumb */}
        {step === "province" && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
            >
              <ChevronLeft className="h-4 w-4" />
              ทุกภาค
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span
              className="font-medium"
              style={{ color: REGION_COLORS[selectedRegionId ?? ""] ?? "#374151" }}
            >
              {selectedRegionName}
            </span>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-4 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Sidebar — top on mobile/tablet, left on desktop */}
        <div className="w-full lg:w-52 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r bg-gray-50/60 py-3 px-3 lg:py-5">
          {step === "region" ? (
            <>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                ภูมิภาค
              </p>
              {/* mobile: horizontal scroll, desktop: vertical list */}
              <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:space-y-1 lg:flex-nowrap">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleSelectRegion(region.id, region.name)}
                    className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-sm transition hover:border-gray-200 hover:bg-white hover:shadow-sm lg:w-full lg:py-2.5"
                  >
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${region.color}, ${region.colorEnd})`,
                      }}
                    />
                    <span className="truncate text-gray-700">{region.name}</span>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-gray-300 hidden lg:block" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Back + toggle — horizontal row on mobile, stacked on desktop */}
              <div className="flex flex-row items-center gap-2 lg:flex-col lg:items-stretch">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 flex-shrink-0 lg:w-full lg:mb-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  กลับ
                </button>

                {/* View toggle (map / grid) */}
                {hasProvinceMapData && (
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white flex-1 lg:flex-none lg:mb-4">
                    <button
                      onClick={() => setProvinceView("map")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
                        provinceView === "map"
                          ? "bg-blue-600 text-white"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <Map className="h-4 w-4" />
                      แผนที่
                    </button>
                    <button
                      onClick={() => setProvinceView("grid")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
                        provinceView === "grid"
                          ? "bg-blue-600 text-white"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      รายการ
                    </button>
                  </div>
                )}
              </div>

              {/* Province list (grid view) — hidden on mobile unless grid view */}
              {(provinceView === "grid" || !hasProvinceMapData) && (
                <>
                  {/* Search box */}
                  <div className="relative mb-2 mt-2 lg:mt-0">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      placeholder="ค้นหาจังหวัด"
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                  {/* mobile: wrap pills, desktop: vertical list */}
                  <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:space-y-0.5 lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">
                    {filteredProvinceList.map((province) => (
                      <button
                        key={province.name}
                        onClick={() => handleSelectProvince(province)}
                        className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-white hover:shadow-sm hover:text-blue-700 lg:flex-shrink lg:w-full lg:rounded-md lg:border-none lg:px-3 lg:py-3"
                      >
                        {province.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Map area */}
        <div className="flex-1 min-w-0 p-3">
          {step === "region" ? (
            <div className="mx-auto w-full max-w-[460px]">
              <ThailandRegionMap onSelectRegion={handleSelectRegion} />
            </div>
          ) : hasProvinceMapData && selectedRegionId ? (
            <div className="mx-auto w-full max-w-[460px]">
              <RegionProvinceMap
                regionId={selectedRegionId}
                onSelectProvince={handleSelectProvinceFromMap}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center lg:min-h-[300px]">
              <p className="text-sm text-gray-400">เลือกจังหวัดจากรายการ</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
