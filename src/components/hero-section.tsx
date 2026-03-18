"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocationFilterModal from "@/components/location-filter-modal";

const quickFilters = [
  { label: "บ้านเดี่ยว", type: "house" },
  { label: "คอนโด", type: "condo" },
  { label: "ทาวน์เฮาส์", type: "townhouse" },
  { label: "ที่ดิน", type: "land" },
  { label: "อาคารพาณิชย์", type: "commercial" },
];

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/search?${params.toString()}`);
  };

  const handleTypeFilter = (type: string) => {
    router.push(`/search?type=${type}`);
  };

  const handleLocationSelect = (sel: { region?: string; province?: string }) => {
    const params = new URLSearchParams();
    if (sel.province) params.set("province", sel.province);
    else if (sel.region) params.set("region", sel.region);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 py-20">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-center">
        <h1 className="text-3xl font-bold text-white md:text-5xl leading-tight">
          ซื้อ-ขาย อสังหาฯ ออนไลน์
          <br />
          <span className="text-blue-300">จบง่ายที่ บ้านที่ดี</span>
        </h1>

        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            ตรวจสอบผู้ขาย
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            แชทในระบบ
          </span>
        </div>

        {/* Search box */}
        <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl">
          <div className="flex gap-2 rounded-full bg-white p-2 shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาทำเล, ชื่อโครงการ, จังหวัด..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-0 pl-12 text-base focus-visible:ring-0 shadow-none"
              />
            </div>
            <Button type="submit" className="rounded-full bg-blue-900 px-8 hover:bg-blue-800">
              ค้นหา
            </Button>
          </div>
        </form>

        {/* Quick filter chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {quickFilters.map(({ label, type }) => (
            <button
              key={type}
              onClick={() => handleTypeFilter(type)}
              className="rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90 transition hover:bg-white/10"
            >
              {label}
            </button>
          ))}

          {/* Location filter modal — แผนที่ประเทศไทย */}
          <LocationFilterModal onSelect={handleLocationSelect} />
        </div>
      </div>
    </section>
  );
}
