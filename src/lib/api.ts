import type {
  ApiResponse,
  ApiPaginatedResponse,
  AuthResponse,
  RegisterBody,
  LoginBody,
  AuthTokens,
  User,
  ListingSummary,
  ListingDetailResponse,
  ListingsQuery,
  FavoriteItem,
  FavoriteToggle,
  Facility,
  InquiryBody,
  Inquiry,
} from "./types";

// ==========================================
// API Client for BaanTDee Backend
// ==========================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// ---------- Token helpers ----------

const TOKEN_KEY = "baantdee_access_token";
const REFRESH_KEY = "baantdee_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ---------- Fetch wrapper ----------

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.success) {
      setTokens(json.data.access_token, json.data.refresh_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false,
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (withAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 — try token refresh once
  if (res.status === 401 && withAuth && retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefresh();
    }
    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      return apiFetch<T>(path, options, withAuth, false);
    }
    // Refresh failed — clear tokens
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  const json = await res.json();
  return json as T;
}

// ---------- Auth API ----------

export async function register(body: RegisterBody): Promise<ApiResponse<AuthResponse>> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function login(body: LoginBody): Promise<ApiResponse<AuthResponse>> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function refreshTokens(): Promise<ApiResponse<AuthTokens>> {
  const rt = getRefreshToken();
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: rt }),
  });
}

export async function logout(): Promise<void> {
  const rt = getRefreshToken();
  await apiFetch(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({ refresh_token: rt }),
    },
    true
  );
  clearTokens();
}

export async function getMe(): Promise<ApiResponse<User>> {
  return apiFetch("/auth/me", {}, true);
}

// ---------- Listings API ----------

export async function getListings(
  params: ListingsQuery = {}
): Promise<ApiPaginatedResponse<ListingSummary>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return apiFetch(`/listings${qs ? `?${qs}` : ""}`);
}

export async function getListingBySlug(
  slug: string
): Promise<ApiResponse<ListingDetailResponse>> {
  return apiFetch(`/listings/${slug}`);
}

export async function createListing(
  body: Record<string, unknown>
): Promise<ApiResponse<ListingSummary>> {
  return apiFetch(
    "/listings",
    { method: "POST", body: JSON.stringify(body) },
    true
  );
}

export async function updateListing(
  id: number,
  body: Record<string, unknown>
): Promise<ApiResponse<ListingSummary>> {
  return apiFetch(
    `/listings/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
    true
  );
}

export async function deleteListing(id: number): Promise<ApiResponse<{ message: string }>> {
  return apiFetch(`/listings/${id}`, { method: "DELETE" }, true);
}

// ---------- Images API ----------

export async function uploadImage(
  listingId: number,
  file: File,
  isCover = false
): Promise<ApiResponse<{ id: number; url: string }>> {
  const form = new FormData();
  form.append("image", file);
  if (isCover) form.append("is_cover", "true");

  return apiFetch(
    `/listings/${listingId}/images`,
    { method: "POST", body: form },
    true
  );
}

export async function deleteImage(
  listingId: number,
  imageId: number
): Promise<ApiResponse<{ message: string }>> {
  return apiFetch(`/listings/${listingId}/images/${imageId}`, { method: "DELETE" }, true);
}

// ---------- Facilities API ----------

export async function getFacilities(): Promise<ApiResponse<Facility[]>> {
  return apiFetch("/facilities");
}

export async function addFacility(
  listingId: number,
  facilityId: number
): Promise<ApiResponse<unknown>> {
  return apiFetch(
    `/listings/${listingId}/facilities`,
    { method: "POST", body: JSON.stringify({ facility_id: facilityId }) },
    true
  );
}

export async function removeFacility(
  listingId: number,
  facilityId: number
): Promise<ApiResponse<unknown>> {
  return apiFetch(`/listings/${listingId}/facilities/${facilityId}`, { method: "DELETE" }, true);
}

// ---------- Favorites API ----------

export async function addFavorite(listingId: number): Promise<ApiResponse<FavoriteToggle>> {
  return apiFetch(`/listings/${listingId}/favorite`, { method: "POST" }, true);
}

export async function removeFavorite(listingId: number): Promise<ApiResponse<FavoriteToggle>> {
  return apiFetch(`/listings/${listingId}/favorite`, { method: "DELETE" }, true);
}

export async function getFavorites(
  page = 1,
  perPage = 12
): Promise<ApiPaginatedResponse<FavoriteItem>> {
  return apiFetch(`/favorites?page=${page}&per_page=${perPage}`, {}, true);
}

// ---------- Addresses API ----------

export interface ThProvince { id: number; nameTh: string; nameEn: string | null }
export interface ThDistrict  { id: number; provinceId: number; nameTh: string; nameEn: string | null }
export interface ThSubdistrict { id: number; districtId: number; nameTh: string; postalCode: string | null }
export interface PostalLookup { subdistrictId: number; subdistrict: string; districtId: number; district: string; provinceId: number; province: string; postalCode: string | null }

export async function getThProvinces(search?: string): Promise<ThProvince[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/addresses/provinces${qs}`);
}

export async function getThDistricts(provinceId?: number, search?: string): Promise<ThDistrict[]> {
  const params = new URLSearchParams();
  if (provinceId) params.set("provinceId", String(provinceId));
  if (search) params.set("search", search);
  const qs = params.toString();
  return apiFetch(`/addresses/districts${qs ? `?${qs}` : ""}`);
}

export async function getThSubdistricts(districtId?: number, provinceId?: number, search?: string): Promise<ThSubdistrict[]> {
  const params = new URLSearchParams();
  if (districtId) params.set("districtId", String(districtId));
  else if (provinceId) params.set("provinceId", String(provinceId));
  if (search) params.set("search", search);
  const qs = params.toString();
  return apiFetch(`/addresses/subdistricts${qs ? `?${qs}` : ""}`);
}

export async function lookupByPostalCode(postalCode: string): Promise<PostalLookup[]> {
  return apiFetch(`/addresses/lookup?postalCode=${encodeURIComponent(postalCode)}`);
}

// ---------- Inquiries API ----------

export async function sendInquiry(
  listingId: number,
  body: InquiryBody
): Promise<ApiResponse<Inquiry>> {
  // Auth is optional — send token if available
  const token = getAccessToken();
  return apiFetch(
    `/listings/${listingId}/inquiries`,
    { method: "POST", body: JSON.stringify(body) },
    !!token
  );
}

export async function getInquiries(
  listingId: number,
  page = 1,
  perPage = 20
): Promise<ApiPaginatedResponse<Inquiry>> {
  return apiFetch(
    `/listings/${listingId}/inquiries?page=${page}&per_page=${perPage}`,
    {},
    true
  );
}

// ---------- Helpers ----------

/** Format price number to Thai display string e.g. 5500000 → "5,500,000" */
export function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

/** Map listing type to Thai label */
export function typeLabel(type: string): string {
  const map: Record<string, string> = {
    house: "บ้านเดี่ยว",
    condo: "คอนโด",
    townhouse: "ทาวน์เฮาส์",
    land: "ที่ดิน",
    commercial: "อาคารพาณิชย์",
  };
  return map[type] || type;
}

/** Map offer type to Thai label */
export function offerLabel(offer: string): string {
  const map: Record<string, string> = {
    sale: "ขาย",
    rent: "เช่า",
    sale_rent: "ขาย/เช่า",
  };
  return map[offer] || offer;
}
