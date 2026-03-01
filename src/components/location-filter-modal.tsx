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
import ThailandRegionMap from "@/components/thailand-region-map";
import { regions, type Province } from "@/data/thailand-locations";

type Step = "region" | "province";

interface LocationSelection {
  regionId?: string;
  regionName?: string;
  provinceName?: string;
}

interface LocationFilterModalProps {
  onSelect?: (selection: LocationSelection) => void;
}

export default function LocationFilterModal({ onSelect }: LocationFilterModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("region");
  const [selection, setSelection] = useState<LocationSelection>({});

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setStep("region");
      setSelection({});
    }
  };

  // Step 1: clicked a region on the map
  const handleSelectRegion = (regionId: string, regionName: string) => {
    setSelection({ regionId, regionName });
    setStep("province");
  };

  // Step 2: clicked a province
  const handleSelectProvince = (province: Province) => {
    const finalSelection = { ...selection, provinceName: province.name };
    onSelect?.(finalSelection);
    setOpen(false);
  };

  const handleBack = () => {
    setStep("region");
    setSelection({});
  };

  // Provinces for selected region
  const selectedRegionData = regions.find((r) => r.id === selection.regionId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 text-sm text-white/90 transition hover:bg-white/10">
          <Map className="h-4 w-4" />
          เลือกจากแผนที่
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <div className="flex items-center gap-3">
            {step !== "region" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-lg font-bold">
                {step === "region" && "เลือกภาค"}
                {step === "province" && `เลือกจังหวัด — ${selection.regionName}`}
              </DialogTitle>
              {selection.regionName && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{selection.regionName}</span>
                  {selection.provinceName && (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-blue-600 font-medium">{selection.provinceName}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Step 1: Region map */}
        {step === "region" && (
          <div className="flex min-h-0" style={{ maxHeight: "calc(90vh - 96px)" }}>
            {/* Map */}
            <div className="flex-1 overflow-y-auto p-4">
              <ThailandRegionMap onSelectRegion={handleSelectRegion} />
            </div>

            {/* Region list sidebar */}
            <div className="w-44 flex-shrink-0 border-l bg-gray-50/50 py-4 px-3 overflow-y-auto">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                เลือกภาค
              </p>
              <div className="space-y-1">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleSelectRegion(region.id, region.name)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 group"
                  >
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${region.color}, ${region.colorEnd})` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-gray-800 group-hover:text-blue-900 leading-tight">
                        {region.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {region.provinces.length} จังหวัด
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-blue-700 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Province grid */}
        {step === "province" && selectedRegionData && (
          <ScrollArea style={{ maxHeight: "calc(90vh - 96px)" }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
              {selectedRegionData.provinces.map((province) => (
                <button
                  key={province.name}
                  onClick={() => handleSelectProvince(province)}
                  className="flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition hover:bg-blue-50 hover:border-blue-200 group"
                >
                  <MapPin className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900 truncate">
                      {province.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {province.districts.length} อำเภอ
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
