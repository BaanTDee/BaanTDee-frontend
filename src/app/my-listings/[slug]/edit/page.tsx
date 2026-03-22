"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Loader2,
  Upload,
  X,
  Plus,
  Star,
  Home,
  Building2,
  Trees,
  Store,
  LayoutGrid,
  Search,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getListingBySlug,
  updateListing,
  uploadImage,
  deleteImage,
  setCoverImage,
  getFacilities,
  addFacility,
  removeFacility,
  getThProvinces,
  getThDistricts,
  getThSubdistricts,
  lookupByPostalCode,
  setTokens,
  getAccessToken,
} from "@/lib/api";
import type {
  ThProvince,
  ThDistrict,
  ThSubdistrict,
  PostalLookup,
} from "@/lib/api";
import type {
  ListingType,
  ListingOffer,
  Facility,
  ListingImage,
} from "@/lib/types";

const TYPES: { value: ListingType; label: string; icon: React.ReactNode }[] = [
  { value: "house", label: "บ้านเดี่ยว", icon: <Home className="h-5 w-5" /> },
  {
    value: "condo",
    label: "คอนโด",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    value: "townhouse",
    label: "ทาวน์เฮาส์",
    icon: <LayoutGrid className="h-5 w-5" />,
  },
  { value: "land", label: "ที่ดิน", icon: <Trees className="h-5 w-5" /> },
  {
    value: "commercial",
    label: "อาคารพาณิชย์",
    icon: <Store className="h-5 w-5" />,
  },
];

const OFFERS: { value: ListingOffer; label: string }[] = [
  { value: "sale", label: "ขาย" },
  { value: "rent", label: "เช่า" },
  { value: "sale_rent", label: "ขาย/เช่า" },
];

export default function EditListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"main" | "uploading">("main");

  // Original listing data
  const [listingId, setListingId] = useState<number>(0);
  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  const [originalFacilityIds, setOriginalFacilityIds] = useState<number[]>([]);

  // Form state
  const [type, setType] = useState<ListingType>("house");
  const [offer, setOffer] = useState<ListingOffer>("sale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceRent, setPriceRent] = useState("");
  const [area, setArea] = useState("");
  const [landArea, setLandArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [floors, setFloors] = useState("");
  const [parking, setParking] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [subdistrictId, setSubdistrictId] = useState<number | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);

  const resolveMapUrl = async (url: string) => {
    if (!url.trim()) return;
    try {
      const res = await fetch(`/api/maps/resolve?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.lat != null && data.lng != null) {
        setMapLat(data.lat);
        setMapLng(data.lng);
      }
    } catch {}
  };

  // Address API data
  const [allProvinces, setAllProvinces] = useState<ThProvince[]>([]);
  const [allDistricts, setAllDistricts] = useState<ThDistrict[]>([]);
  const [allSubdistricts, setAllSubdistricts] = useState<ThSubdistrict[]>([]);
  const [postalSuggestions, setPostalSuggestions] = useState<PostalLookup[]>([]);
  const [postalOpen, setPostalOpen] = useState(false);

  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);

  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [subdistrictSearch, setSubdistrictSearch] = useState("");
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [subdistrictOpen, setSubdistrictOpen] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const provinceRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const subdistrictRef = useRef<HTMLDivElement>(null);
  const postalRef = useRef<HTMLDivElement>(null);
  const autofillRef = useRef<{
    districtId: number;
    district: string;
    subdistrictId: number;
    subdistrict: string;
  } | null>(null);

  // New images to upload
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [coverImageId, setCoverImageId] = useState<number | null>(null);
  const [coverNewIndex, setCoverNewIndex] = useState<number | null>(null);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Facilities
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<number[]>([]);

  const [fieldErrors, setFieldErrors] = useState({
    title: false,
    price: false,
    province: false,
    district: false,
  });

  // Load listing data
  useEffect(() => {
    if (!slug || status === "loading") return;
    (async () => {
      try {
        const [listingRes, facRes] = await Promise.all([
          getListingBySlug(slug),
          getFacilities(),
        ]);
        if (facRes.success) setFacilities(facRes.data);

        if (!listingRes.success) {
          setError("ไม่พบประกาศ");
          setPageLoading(false);
          return;
        }

        const { listing, images, facilities: listingFacs } = listingRes.data;
        const backendUser = (session as any)?.backendUser;

        // Ownership check
        if (backendUser && Number(listing.user_id) !== Number(backendUser.id)) {
          router.replace("/my-listings");
          return;
        }

        setListingId(listing.id);
        setType(listing.type);
        setOffer(listing.offer);
        setTitle(listing.title);
        setDescription(listing.description || "");
        setPrice(listing.price ? String(listing.price) : "");
        setPriceRent(listing.price_rent ? String(listing.price_rent) : "");
        setArea(listing.area ? String(listing.area) : "");
        setLandArea(listing.land_area ? String(listing.land_area) : "");
        setBedrooms(listing.bedrooms != null ? String(listing.bedrooms) : "");
        setBathrooms(
          listing.bathrooms != null ? String(listing.bathrooms) : ""
        );
        setFloors(listing.floors != null ? String(listing.floors) : "");
        setParking(listing.parking != null ? String(listing.parking) : "");
        setYearBuilt(
          listing.year_built != null ? String(listing.year_built) : ""
        );
        setAddress(listing.address || "");
        setProvince(listing.province || "");
        setDistrict(listing.district || "");
        setSubdistrict(listing.subdistrict || "");
        setPostalCode(listing.postal_code || "");
        setMapUrl(listing.map_url || "");
        if (listing.latitude != null) {
          setMapLat(listing.latitude);
          setMapLng(listing.longitude);
        } else if (listing.map_url) {
          // Auto-resolve coords from saved map_url if no coords stored yet
          try {
            const r = await fetch(`/api/maps/resolve?url=${encodeURIComponent(listing.map_url)}`);
            const d = await r.json();
            if (d.lat != null) { setMapLat(d.lat); setMapLng(d.lng); }
          } catch {}
        }

        setExistingImages(images);
        const cover = images.find((i) => i.is_cover);
        if (cover) setCoverImageId(cover.id);

        const facIds = listingFacs.map((f) => f.id);
        setSelectedFacilities(facIds);
        setOriginalFacilityIds(facIds);

        // Resolve province/district IDs for address dropdowns
        const provinces = await getThProvinces();
        if (Array.isArray(provinces)) {
          setAllProvinces(provinces);
          const prov = provinces.find((p) => p.nameTh === listing.province);
          if (prov) {
            setProvinceId(prov.id);
            const districts = await getThDistricts(prov.id);
            if (Array.isArray(districts)) {
              setAllDistricts(districts);
              const dist = districts.find((d) => d.nameTh === listing.district);
              if (dist) {
                setDistrictId(dist.id);
                const subs = await getThSubdistricts(dist.id);
                if (Array.isArray(subs)) {
                  setAllSubdistricts(subs);
                  const sub = subs.find(
                    (s) => s.nameTh === listing.subdistrict
                  );
                  if (sub) setSubdistrictId(sub.id);
                }
              }
            }
          }
        }
      } catch {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [slug, status, session, router]);

  // Load districts when province changes (user selects new province)
  useEffect(() => {
    if (!provinceId || pageLoading) return;
    getThDistricts(provinceId)
      .then((res) => {
        if (Array.isArray(res)) setAllDistricts(res);
        if (autofillRef.current) {
          setDistrict(autofillRef.current.district);
          setDistrictId(autofillRef.current.districtId);
        }
      })
      .catch(() => {});
    if (!autofillRef.current) {
      setDistrict("");
      setDistrictId(null);
      setSubdistrict("");
      setSubdistrictId(null);
      setAllSubdistricts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId]);

  // Load subdistricts when district changes
  useEffect(() => {
    if (!districtId || pageLoading) return;
    getThSubdistricts(districtId)
      .then((res) => {
        if (Array.isArray(res)) setAllSubdistricts(res);
        if (autofillRef.current) {
          setSubdistrict(autofillRef.current.subdistrict);
          setSubdistrictId(autofillRef.current.subdistrictId);
          autofillRef.current = null;
        }
      })
      .catch(() => {});
    if (!autofillRef.current) {
      setSubdistrict("");
      setSubdistrictId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId]);

  // Postal code lookup
  useEffect(() => {
    if (postalCode.length === 5) {
      lookupByPostalCode(postalCode)
        .then((res) => {
          setPostalSuggestions(res);
          setPostalOpen(res.length > 0);
        })
        .catch(() => {});
    } else {
      setPostalSuggestions([]);
      setPostalOpen(false);
    }
  }, [postalCode]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        provinceRef.current &&
        !provinceRef.current.contains(e.target as Node)
      )
        setProvinceOpen(false);
      if (
        districtRef.current &&
        !districtRef.current.contains(e.target as Node)
      )
        setDistrictOpen(false);
      if (
        subdistrictRef.current &&
        !subdistrictRef.current.contains(e.target as Node)
      )
        setSubdistrictOpen(false);
      if (postalRef.current && !postalRef.current.contains(e.target as Node))
        setPostalOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Visible existing images (not marked for deletion)
  const visibleExisting = existingImages.filter(
    (img) => !imagesToDelete.includes(img.id)
  );
  const totalImages = visibleExisting.length + newImages.length;

  const handleNewImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 10 - totalImages);
    setNewImages((prev) => [...prev, ...valid]);
    setNewPreviews((prev) => [
      ...prev,
      ...valid.map((f) => URL.createObjectURL(f)),
    ]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleExistingImageRemove = (imageId: number) => {
    setImagesToDelete((prev) => [...prev, imageId]);
    if (coverImageId === imageId) {
      // Move cover to next existing or first new
      const remaining = existingImages.filter(
        (i) => i.id !== imageId && !imagesToDelete.includes(i.id)
      );
      if (remaining.length > 0) {
        setCoverImageId(remaining[0].id);
        setCoverNewIndex(null);
      } else if (newImages.length > 0) {
        setCoverImageId(null);
        setCoverNewIndex(0);
      } else {
        setCoverImageId(null);
        setCoverNewIndex(null);
      }
    }
  };

  const handleNewImageRemove = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (coverNewIndex === idx) {
      setCoverNewIndex(null);
      if (visibleExisting.length > 0) setCoverImageId(visibleExisting[0].id);
    } else if (coverNewIndex !== null && idx < coverNewIndex) {
      setCoverNewIndex(coverNewIndex - 1);
    }
  };

  const toggleFacility = (id: number) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Filtered lists for dropdowns
  const safeProvinces = Array.isArray(allProvinces) ? allProvinces : [];
  const safeDistricts = Array.isArray(allDistricts) ? allDistricts : [];
  const safeSubdistricts = Array.isArray(allSubdistricts)
    ? allSubdistricts
    : [];

  const filteredProvinces = provinceSearch
    ? safeProvinces.filter((p) => p.nameTh.includes(provinceSearch))
    : safeProvinces;
  const filteredDistricts = districtSearch
    ? safeDistricts.filter((d) => d.nameTh.includes(districtSearch))
    : safeDistricts;
  const filteredSubdistricts = subdistrictSearch
    ? safeSubdistricts.filter((s) => s.nameTh.includes(subdistrictSearch))
    : safeSubdistricts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errs = {
      title: !title.trim(),
      price: !price || isNaN(Number(price)) || Number(price) <= 0,
      province: !province,
      district: !district,
    };
    setFieldErrors(errs);
    if (errs.title || errs.price || errs.province || errs.district) {
      const firstRef = errs.title
        ? titleRef
        : errs.price
        ? priceRef
        : errs.province
        ? provinceRef
        : districtRef;
      firstRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSaving(true);
    setStep("main");

    try {
      // Get fresh token
      let token = (session as any)?.accessToken as string | undefined;
      if (!token) token = getAccessToken() || undefined;
      if (!token) {
        setError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        setSaving(false);
        return;
      }
      const srt = (session as any)?.refreshToken as string | undefined;
      if (srt) setTokens(token, srt);

      // Build update body
      const listing_details: Record<string, unknown> = {};
      if (area) listing_details.area = Number(area);
      if (landArea) listing_details.land_area = Number(landArea);
      if (bedrooms) listing_details.bedrooms = Number(bedrooms);
      if (bathrooms) listing_details.bathrooms = Number(bathrooms);
      if (floors) listing_details.floors = Number(floors);

      const addressObj: Record<string, unknown> = {
        province,
        district,
      };
      if (address.trim()) addressObj.address = address.trim();
      if (subdistrict.trim()) addressObj.subdistrict = subdistrict.trim();
      if (postalCode.trim()) addressObj.postal_code = postalCode.trim();
      if (mapUrl.trim()) addressObj.map_url = mapUrl.trim();
      if (mapLat != null) addressObj.latitude = mapLat;
      if (mapLng != null) addressObj.longitude = mapLng;

      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || "",
        type,
        offer,
        price: Number(price),
        listing_details,
        address: addressObj,
      };

      const res = await updateListing(listingId, body, token);
      if (!res.success) {
        const msg =
          (res as any).message ||
          res.error?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่";
        setError(msg);
        setSaving(false);
        return;
      }

      // Delete removed images
      const imgToken = getAccessToken() || token;
      for (const imgId of imagesToDelete) {
        await deleteImage(listingId, imgId, imgToken);
      }

      // If cover changed to an existing image, update it
      if (coverImageId !== null && coverNewIndex === null) {
        const originalCover = existingImages.find((i) => i.is_cover);
        if (!originalCover || originalCover.id !== coverImageId) {
          await setCoverImage(listingId, coverImageId, imgToken);
        }
      }

      // Upload new images
      if (newImages.length > 0) {
        setStep("uploading");
        for (let i = 0; i < newImages.length; i++) {
          const isCover = coverNewIndex === i;
          await uploadImage(listingId, newImages[i], isCover, imgToken);
        }
      }

      // Sync facilities — add new, remove deleted
      const toAdd = selectedFacilities.filter(
        (id) => !originalFacilityIds.includes(id)
      );
      const toRemove = originalFacilityIds.filter(
        (id) => !selectedFacilities.includes(id)
      );
      for (const fid of toAdd) {
        await addFacility(listingId, fid, imgToken);
      }
      for (const fid of toRemove) {
        await removeFacility(listingId, fid, imgToken);
      }

      router.push(`/listings/${res.data.slug}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setSaving(false);
    }
  };

  // Auth guard
  if (status === "loading" || pageLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
  }
  if (!session?.user) {
    router.replace("/login");
    return null;
  }

  if (error && !listingId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/my-listings")}
        >
          กลับ
        </Button>
      </div>
    );
  }

  const isLand = type === "land";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <button
        onClick={() => router.push("/my-listings")}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-blue-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าประกาศของฉัน
      </button>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        แก้ไขประกาศ
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-semibold text-gray-800">
            รูปภาพ (สูงสุด 10 รูป)
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            คลิกที่ ★ เพื่อเลือกเป็นรูปหลัก
          </p>
          <div className="flex flex-wrap gap-3">
            {/* Existing images */}
            {visibleExisting.map((img) => (
              <div
                key={img.id}
                className={`relative h-28 w-28 overflow-hidden rounded-lg border-2 transition ${
                  coverImageId === img.id && coverNewIndex === null
                    ? "border-blue-900"
                    : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {coverImageId === img.id && coverNewIndex === null && (
                  <span className="absolute left-1 top-1 rounded bg-blue-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    รูปหลัก
                  </span>
                )}
                {(coverImageId !== img.id || coverNewIndex !== null) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageId(img.id);
                      setCoverNewIndex(null);
                    }}
                    title="ตั้งเป็นรูปหลัก"
                    className="absolute left-1 top-1 rounded-full bg-black/40 p-0.5 text-white hover:bg-blue-900 transition"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExistingImageRemove(img.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* New images */}
            {newPreviews.map((src, idx) => (
              <div
                key={`new-${idx}`}
                className={`relative h-28 w-28 overflow-hidden rounded-lg border-2 transition ${
                  coverNewIndex === idx ? "border-blue-900" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {coverNewIndex === idx && (
                  <span className="absolute left-1 top-1 rounded bg-blue-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    รูปหลัก
                  </span>
                )}
                {coverNewIndex !== idx && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverNewIndex(idx);
                      setCoverImageId(null);
                    }}
                    title="ตั้งเป็นรูปหลัก"
                    className="absolute left-1 top-1 rounded-full bg-black/40 p-0.5 text-white hover:bg-blue-900 transition"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleNewImageRemove(idx)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Add button */}
            {totalImages < 10 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-28 w-28 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-900 hover:text-blue-900 transition"
              >
                <Plus className="h-6 w-6" />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleNewImageAdd}
          />
        </section>

        {/* Basic Info + Type + Offer + Price */}
        <section className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">ข้อมูลพื้นฐาน</h2>
            <div ref={titleRef}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ชื่อประกาศ <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="เช่น บ้านเดี่ยว 3 ห้องนอน ใกล้ BTS..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title)
                    setFieldErrors((prev) => ({ ...prev, title: false }));
                }}
                maxLength={200}
                aria-invalid={fieldErrors.title}
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-500">
                  กรุณากรอกชื่อประกาศ
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                คำอธิบาย
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 resize-none overflow-hidden"
                placeholder="อธิบายรายละเอียดของอสังหาริมทรัพย์..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
            </div>
          </div>

          {/* ประเภทอสังหาริมทรัพย์ */}
          <div className="border-t pt-5 space-y-5">
            <div>
              <h2 className="mb-3 font-semibold text-gray-800">
                ประเภทอสังหาริมทรัพย์
              </h2>
              <div className="flex flex-wrap gap-3">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      type === t.value
                        ? "border-blue-900 bg-blue-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-blue-900 hover:text-blue-900"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-3 font-semibold text-gray-800">
                ประเภทการขาย/เช่า
              </h2>
              <div className="flex gap-3">
                {OFFERS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOffer(o.value)}
                    className={`flex-1 rounded-full border py-2 text-sm font-medium transition ${
                      offer === o.value
                        ? "border-blue-900 bg-blue-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-blue-900 hover:text-blue-900"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ราคา */}
          <div className="border-t pt-5" ref={priceRef}>
            <h2 className="mb-4 font-semibold text-gray-800">ราคา</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(offer === "sale" || offer === "sale_rent") && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ราคาขาย (บาท) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="เช่น 1,500,000"
                    value={price ? Number(price).toLocaleString("th-TH") : ""}
                    onChange={(e) => {
                      setPrice(e.target.value.replace(/[^0-9]/g, ""));
                      if (fieldErrors.price)
                        setFieldErrors((prev) => ({ ...prev, price: false }));
                    }}
                    className="[appearance:textfield]"
                    aria-invalid={fieldErrors.price}
                  />
                  {fieldErrors.price && (
                    <p className="mt-1 text-xs text-red-500">
                      กรุณากรอกราคาที่ถูกต้อง
                    </p>
                  )}
                </div>
              )}
              {offer === "rent" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ราคาเช่า/เดือน (บาท){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="เช่น 15,000"
                    value={price ? Number(price).toLocaleString("th-TH") : ""}
                    onChange={(e) => {
                      setPrice(e.target.value.replace(/[^0-9]/g, ""));
                      if (fieldErrors.price)
                        setFieldErrors((prev) => ({ ...prev, price: false }));
                    }}
                    className="[appearance:textfield]"
                    aria-invalid={fieldErrors.price}
                  />
                  {fieldErrors.price && (
                    <p className="mt-1 text-xs text-red-500">
                      กรุณากรอกราคาที่ถูกต้อง
                    </p>
                  )}
                </div>
              )}
              {offer === "sale_rent" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ราคาเช่า/เดือน (บาท)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="เช่น 15,000"
                    value={
                      priceRent
                        ? Number(priceRent).toLocaleString("th-TH")
                        : ""
                    }
                    onChange={(e) =>
                      setPriceRent(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="[appearance:textfield]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* รายละเอียด */}
          <div className="border-t pt-5 space-y-4">
            <h2 className="font-semibold text-gray-800">รายละเอียด</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {!isLand && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ห้องนอน
                    </label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ห้องน้ำ
                    </label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ชั้น
                    </label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={floors}
                      onChange={(e) => setFloors(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ที่จอดรถ
                    </label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={parking}
                      onChange={(e) => setParking(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      พื้นที่ใช้สอย (ตร.ม.)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {isLand ? "พื้นที่ (ตร.ว.)" : "พื้นที่ดิน (ตร.ว.)"}
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                />
              </div>
            </div>

            {/* ที่ตั้ง */}
            <div className="border-t pt-5 space-y-4">
              <h2 className="font-semibold text-gray-800">ที่ตั้ง</h2>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  เลขที่/ที่อยู่
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น 123/4 ซอยสุขุมวิท 71 ถนนสุขุมวิท..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* จังหวัด */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <div ref={provinceRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setProvinceOpen((v) => !v);
                        setProvinceSearch("");
                      }}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background ${
                        fieldErrors.province
                          ? "border-red-500 ring-1 ring-red-500"
                          : ""
                      } ${
                        province ? "text-gray-900" : "text-muted-foreground"
                      }`}
                    >
                      <span>{province || "-- เลือกจังหวัด --"}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          provinceOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {provinceOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                        <div className="flex items-center gap-2 border-b px-3 py-2">
                          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <input
                            autoFocus
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="ค้นหาจังหวัด..."
                            value={provinceSearch}
                            onChange={(e) =>
                              setProvinceSearch(e.target.value)
                            }
                          />
                        </div>
                        <ul className="max-h-52 overflow-y-auto py-1">
                          {filteredProvinces.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setProvince(p.nameTh);
                                  setProvinceId(p.id);
                                  setProvinceOpen(false);
                                  if (fieldErrors.province)
                                    setFieldErrors((prev) => ({
                                      ...prev,
                                      province: false,
                                    }));
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-900 transition ${
                                  province === p.nameTh
                                    ? "bg-blue-50 font-medium text-blue-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {p.nameTh}
                              </button>
                            </li>
                          ))}
                          {filteredProvinces.length === 0 && (
                            <li className="px-4 py-3 text-center text-sm text-muted-foreground">
                              ไม่พบจังหวัด
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                {/* เขต/อำเภอ */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    เขต/อำเภอ <span className="text-red-500">*</span>
                  </label>
                  <div ref={districtRef} className="relative">
                    <button
                      type="button"
                      disabled={!province}
                      onClick={() => {
                        setDistrictOpen((v) => !v);
                        setDistrictSearch("");
                      }}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background ${
                        !province ? "cursor-not-allowed opacity-50" : ""
                      } ${
                        fieldErrors.district
                          ? "border-red-500 ring-1 ring-red-500"
                          : ""
                      } ${
                        district ? "text-gray-900" : "text-muted-foreground"
                      }`}
                    >
                      <span>{district || "-- เลือกเขต/อำเภอ --"}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          districtOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {districtOpen && province && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                        <div className="flex items-center gap-2 border-b px-3 py-2">
                          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <input
                            autoFocus
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="ค้นหาเขต/อำเภอ..."
                            value={districtSearch}
                            onChange={(e) =>
                              setDistrictSearch(e.target.value)
                            }
                          />
                        </div>
                        <ul className="max-h-52 overflow-y-auto py-1">
                          {filteredDistricts.map((d) => (
                            <li key={d.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setDistrict(d.nameTh);
                                  setDistrictId(d.id);
                                  setDistrictOpen(false);
                                  if (fieldErrors.district)
                                    setFieldErrors((prev) => ({
                                      ...prev,
                                      district: false,
                                    }));
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-900 transition ${
                                  district === d.nameTh
                                    ? "bg-blue-50 font-medium text-blue-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {d.nameTh}
                              </button>
                            </li>
                          ))}
                          {filteredDistricts.length === 0 && (
                            <li className="px-4 py-3 text-center text-sm text-muted-foreground">
                              ไม่พบเขต/อำเภอ
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* แขวง/ตำบล */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    แขวง/ตำบล
                  </label>
                  <div ref={subdistrictRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setSubdistrictOpen((v) => !v);
                        setSubdistrictSearch("");
                      }}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background ${
                        subdistrict
                          ? "border-input text-gray-900"
                          : "border-input text-muted-foreground"
                      }`}
                    >
                      <span>
                        {subdistrict || "-- เลือกแขวง/ตำบล --"}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          subdistrictOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {subdistrictOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                        <div className="flex items-center gap-2 border-b px-3 py-2">
                          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <input
                            autoFocus
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="ค้นหาแขวง/ตำบล..."
                            value={subdistrictSearch}
                            onChange={(e) =>
                              setSubdistrictSearch(e.target.value)
                            }
                          />
                        </div>
                        <ul className="max-h-52 overflow-y-auto py-1">
                          {filteredSubdistricts.map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSubdistrict(s.nameTh);
                                  setSubdistrictId(s.id);
                                  if (s.postalCode)
                                    setPostalCode(s.postalCode);
                                  setSubdistrictOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-900 transition ${
                                  subdistrict === s.nameTh
                                    ? "bg-blue-50 font-medium text-blue-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {s.nameTh}
                                {s.postalCode ? ` (${s.postalCode})` : ""}
                              </button>
                            </li>
                          ))}
                          {filteredSubdistricts.length === 0 && (
                            <li className="px-4 py-3 text-center text-sm text-muted-foreground">
                              {allSubdistricts.length === 0
                                ? "เลือกจังหวัดก่อน"
                                : "ไม่พบแขวง/ตำบล"}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                {/* รหัสไปรษณีย์ */}
                <div ref={postalRef} className="relative">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    รหัสไปรษณีย์
                  </label>
                  <Input
                    placeholder="เช่น 10110"
                    value={postalCode}
                    onChange={(e) =>
                      setPostalCode(
                        e.target.value.replace(/\D/g, "").slice(0, 5)
                      )
                    }
                    maxLength={5}
                  />
                  {postalOpen && postalSuggestions.length > 0 && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-md border bg-white shadow-lg">
                      <p className="border-b px-3 py-2 text-xs text-muted-foreground">
                        เลือกเพื่อ autofill ที่อยู่
                      </p>
                      <ul className="max-h-52 overflow-y-auto py-1">
                        {postalSuggestions.map((s, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() => {
                                autofillRef.current = {
                                  districtId: s.districtId,
                                  district: s.district,
                                  subdistrictId: s.subdistrictId,
                                  subdistrict: s.subdistrict,
                                };
                                setProvince(s.province);
                                setProvinceId(s.provinceId);
                                setPostalCode(s.postalCode ?? postalCode);
                                setPostalOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-900 transition text-gray-700"
                            >
                              <span className="font-medium">
                                {s.subdistrict}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                › {s.district} › {s.province}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ลิงก์ Google Maps
              </label>
              <Input
                type="url"
                placeholder="https://maps.app.goo.gl/..."
                value={mapUrl}
                onChange={(e) => { setMapUrl(e.target.value); setMapLat(null); setMapLng(null); }}
                onBlur={(e) => resolveMapUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {mapLat != null ? `✓ พบพิกัด: ${mapLat.toFixed(5)}, ${mapLng?.toFixed(5)}` : "วาง link จาก Google Maps เช่น https://maps.app.goo.gl/..."}
              </p>
            </div>
          </div>

          {/* สิ่งอำนวยความสะดวก */}
          {facilities.length > 0 && (
            <div className="border-t pt-5">
              <h2 className="mb-4 font-semibold text-gray-800">
                สิ่งอำนวยความสะดวก
              </h2>
              <div className="flex flex-wrap gap-2">
                {facilities.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFacility(f.id)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition ${
                      selectedFacilities.includes(f.id)
                        ? "border-blue-900 bg-blue-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-blue-900 hover:text-blue-900"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/my-listings")}
            disabled={saving}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="min-w-[140px] bg-blue-900 hover:bg-blue-800"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {step === "uploading"
                  ? "กำลังอัปโหลดรูป..."
                  : "กำลังบันทึก..."}
              </>
            ) : (
              "บันทึกการแก้ไข"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
