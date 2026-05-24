"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <section className="relative py-20 overflow-hidden">
      {/* Blurred background — scale-110 hides blur edge artifacts */}
      <div
        className="absolute inset-0 scale-110"
        style={{ backgroundImage: "url('/hero-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center", filter: "blur(4px)" }}
      />
      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative mx-auto max-w-7xl px-4 text-center">
        <h1 className="text-3xl font-bold text-white md:text-5xl leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
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

          {/* Location filter — scroll to map */}
          <button
            onClick={() => document.getElementById("map-section")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90 transition hover:bg-white/10"
          >
            <Map className="h-4 w-4" />
            เลือกจากแผนที่
          </button>
        </div>
      </div>
    </section>
  );
}
