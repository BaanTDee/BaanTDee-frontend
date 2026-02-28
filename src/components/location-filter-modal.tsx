"use client";

import { useState } from "react";
import { MapPin, ChevronRight, ChevronLeft, Map } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REGION_COLORS } from "@/components/thailand-map-svg";
import { regions, type Province } from "@/data/thailand-locations";

// Flat province lookup by name
const allProvinces: { province: Province; regionId: string; regionName: string }[] =
  regions.flatMap((r) =>
    r.provinces.map((p) => ({
      province: p,
      regionId: r.id,
      regionName: r.name,
    }))
  );

type Step = "province" | "district";

interface LocationSelection {
  regionId?: string;
  regionName?: string;
  provinceName?: string;
  district?: string;
}

interface LocationFilterModalProps {
  onSelect?: (selection: LocationSelection) => void;
}

export default function LocationFilterModal({ onSelect }: LocationFilterModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("province");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [selection, setSelection] = useState<LocationSelection>({});

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setStep("province");
      setFilterRegion("all");
      setSelection({});
    }
  };

  const handleSelectProvince = (province: Province, regionId: string, regionName: string) => {
    setSelection({ regionId, regionName, provinceName: province.name });
    setStep("district");
  };

  const handleSelectDistrict = (districtName: string) => {
    onSelect?.({ ...selection, district: districtName });
    setOpen(false);
  };

  const handleSelectWholeProvince = () => {
    onSelect?.(selection);
    setOpen(false);
  };

  const handleBack = () => {
    setStep("province");
    setSelection({});
  };

  const breadcrumb = [selection.regionName, selection.provinceName, selection.district].filter(Boolean);

  const filteredProvinces =
    filterRegion === "all"
      ? allProvinces
      : allProvinces.filter((p) => p.regionId === filterRegion);

  const selectedProvince = selection.provinceName
    ? allProvinces.find((p) => p.province.name === selection.provinceName)?.province ?? null
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90 transition hover:bg-white/10">
          <Map className="h-4 w-4" />
          เลือกจากแผนที่
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <div className="flex items-center gap-3">
            {step !== "province" && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-lg font-bold">
                {step === "province" && "เลือกจังหวัด"}
                {step === "district" && `เลือกอำเภอ — ${selection.provinceName}`}
              </DialogTitle>
              {breadcrumb.length > 0 && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {breadcrumb.map((item, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="h-3 w-3" />}
                      <span className={i === breadcrumb.length - 1 ? "text-blue-600 font-medium" : ""}>
                        {item}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 overflow-hidden" style={{ maxHeight: "calc(90vh - 96px)" }}>
          {/* Step 1: Region sidebar + Province grid */}
          {step === "province" && (
            <>
              {/* Region filter sidebar */}
              <div className="w-44 flex-shrink-0 border-r bg-gray-50/50 py-3 px-2 overflow-y-auto">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  กรองตามภาค
                </p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setFilterRegion("all")}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                      filterRegion === "all"
                        ? "bg-blue-50 text-blue-900 font-semibold"
                        : "text-gray-700 hover:bg-white"
                    }`}
                  >
                    ทั้งหมด
                    <span className="ml-auto text-xs text-muted-foreground">{allProvinces.length}</span>
                  </button>
                  {regions.map((region) => {
                    const colors = REGION_COLORS[region.id];
                    return (
                      <button
                        key={region.id}
                        onClick={() => setFilterRegion(filterRegion === region.id ? "all" : region.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                          filterRegion === region.id
                            ? "bg-blue-50 text-blue-900 font-semibold"
                            : "text-gray-700 hover:bg-white"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ background: colors?.fill }}
                        />
                        <span className="truncate text-xs">{region.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{region.provinces.length}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Province grid */}
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-3 gap-2 p-4">
                  {filteredProvinces.map(({ province, regionId, regionName }) => {
                    const colors = REGION_COLORS[regionId];
                    return (
                      <button
                        key={province.name}
                        onClick={() => handleSelectProvince(province, regionId, regionName)}
                        className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition hover:bg-blue-50 hover:border-blue-200 group"
                      >
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ background: colors?.fill }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900 truncate">
                            {province.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {province.districts.length} อำเภอ
                          </div>
                        </div>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-400 group-hover:text-blue-700 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Step 2: District grid */}
          {step === "district" && selectedProvince && (
            <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
              <button
                onClick={handleSelectWholeProvince}
                className="mb-4 flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-3 text-left transition hover:bg-blue-100"
              >
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  ทั้งจังหวัด{selection.provinceName}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs">ทุกอำเภอ</Badge>
              </button>
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pr-4">
                  {selectedProvince.districts.map((district) => (
                    <button
                      key={district.name}
                      onClick={() => handleSelectDistrict(district.name)}
                      className="flex items-center rounded-xl border px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:border-blue-200 hover:text-blue-900"
                    >
                      <MapPin className="mr-2 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      {district.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
