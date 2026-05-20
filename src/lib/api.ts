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
import { mockGetListings, mockGetListingBySlug, mockGetFacilities } from "./mock-data";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

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
    // Use Next.js API proxy because the backend reads refresh_token from
    // an HttpOnly cookie — the browser cannot set Cookie headers directly.
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.success && json.data) {
      setTokens(json.data.access_token, json.data.refresh_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Check if the current access token is expired (or about to) and refresh proactively. */
export async function ensureFreshToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      const bufferMs = 60_000; // 1 min buffer
      if (Date.now() >= payload.exp * 1000 - bufferMs) {
        const ok = await tryRefresh();
        return ok ? getAccessToken() : null;
      }
    }
  } catch {
    // token parse failed — try refresh anyway
    const ok = await tryRefresh();
    return ok ? getAccessToken() : null;
  }

  return token; // still valid
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false,
  retry = true,
  tokenOverride?: string
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (withAuth) {
    const token = tokenOverride || getAccessToken();
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
      // Use the newly refreshed token from localStorage, not the stale tokenOverride
      return apiFetch<T>(path, options, withAuth, false);
    }
    // Refresh failed — clear localStorage tokens but don't redirect
    // (NextAuth handles session-based auth separately)
    clearTokens();
  }

  // Handle 204 No Content — return a success wrapper
  if (res.status === 204) {
    return { success: true, data: null } as T;
  }

  const json = await res.json();
  return json as T;
}

// ---------- Auth API ----------

export async function register(body: RegisterBody): Promise<ApiResponse<{ message: string; email: string }>> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function sendOtp(email: string): Promise<ApiResponse<{ message: string }>> {
  return apiFetch("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email: string, code: string): Promise<ApiResponse<AuthResponse>> {
  return apiFetch("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function createCharge(body: {
  plan: string;
  method: "card" | "promptpay";
  token: string;
}): Promise<ApiResponse<{ chargeId: string; status: string; promptpayQr?: string; authorizeUri?: string }>> {
  return apiFetch("/payments/charge", {
    method: "POST",
    body: JSON.stringify(body),
  }, true);
}

export async function getChargeStatus(chargeId: string): Promise<ApiResponse<{ status: string }>> {
  return apiFetch(`/payments/status/${chargeId}`, {}, true);
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

export async function updateMe(body: {
  name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
}): Promise<ApiResponse<User>> {
  return apiFetch("/users/me", { method: "PATCH", body: JSON.stringify(body) }, true);
}

// ---------- Listings API ----------

export async function getListings(
  params: ListingsQuery = {}
): Promise<ApiPaginatedResponse<ListingSummary>> {
  if (USE_MOCK) return mockGetListings(params);
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
  if (USE_MOCK) return mockGetListingBySlug(slug);
  return apiFetch(`/listings/${slug}`);
}

export async function createListing(
  body: Record<string, unknown>,
  token?: string
): Promise<ApiResponse<ListingSummary>> {
  return apiFetch(
    "/listings",
    { method: "POST", body: JSON.stringify(body) },
    true,
    true,
    token
  );
}

export async function updateListing(
  id: number,
  body: Record<string, unknown>,
  token?: string
): Promise<ApiResponse<ListingSummary>> {
  return apiFetch(
    `/listings/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
    true,
    true,
    token
  );
}

export async function deleteListing(id: number): Promise<ApiResponse<{ message: string }>> {
  return apiFetch(`/listings/${id}`, { method: "DELETE" }, true);
}

// ---------- Images API ----------

export async function uploadImage(
  listingId: number,
  file: File,
  isCover = false,
  token?: string
): Promise<ApiResponse<{ id: number; url: string }>> {
  const form = new FormData();
  form.append("image", file);
  if (isCover) form.append("is_cover", "true");

  return apiFetch(
    `/listings/${listingId}/images`,
    { method: "POST", body: form },
    true,
    true,
    token
  );
}

export async function deleteImage(
  listingId: number,
  imageId: number,
  token?: string
): Promise<ApiResponse<{ message: string }>> {
  return apiFetch(`/listings/${listingId}/images/${imageId}`, { method: "DELETE" }, true, true, token);
}

export async function setCoverImage(
  listingId: number,
  imageId: number,
  token?: string
): Promise<ApiResponse<{ imageId: number; is_cover: boolean }>> {
  return apiFetch(`/listings/${listingId}/images/${imageId}/cover`, { method: "PATCH" }, true, true, token);
}

// ---------- Facilities API ----------

export async function getFacilities(): Promise<ApiResponse<Facility[]>> {
  if (USE_MOCK) return mockGetFacilities();
  return apiFetch("/facilities");
}

export async function addFacility(
  listingId: number,
  facilityId: number,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiFetch(
    `/listings/${listingId}/facilities`,
    { method: "POST", body: JSON.stringify({ facility_id: facilityId }) },
    true,
    true,
    token
  );
}

export async function removeFacility(
  listingId: number,
  facilityId: number,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiFetch(`/listings/${listingId}/facilities/${facilityId}`, { method: "DELETE" }, true, true, token);
}

// ---------- Favorites API ----------

export async function addFavorite(listingId: number, token?: string): Promise<void> {
  const res = await apiFetch<any>(
    `/listings/${listingId}/favorite`,
    { method: "POST" },
    true,
    true,
    token
  );
  if (res?.statusCode && res.statusCode >= 400) throw new Error(res.message || "addFavorite failed");
}

export async function removeFavorite(listingId: number, token?: string): Promise<void> {
  const res = await apiFetch<any>(
    `/listings/${listingId}/favorite`,
    { method: "DELETE" },
    true,
    true,
    token
  );
  if (res?.statusCode && res.statusCode >= 400) throw new Error(res.message || "removeFavorite failed");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFavoriteItem(raw: any): FavoriteItem {
  const l = raw.listing || {};
  const images: { url: string; is_cover: boolean }[] = l.images || [];
  const cover = images.find((i) => i.is_cover) || images[0];
  return {
    listing_id: Number(raw.listing_id ?? l.id),
    slug: l.slug ?? "",
    title: l.title ?? "",
    type: l.type ?? "house",
    offer: l.offer ?? "sale",
    price: Number(l.price ?? 0),
    province: l.province ?? "",
    district: l.district ?? "",
    cover_url: l.cover_url ?? cover?.url ?? null,
    favorited_at: raw.created_at ?? "",
  };
}

export async function getFavorites(token?: string): Promise<{ success: true; data: FavoriteItem[] } | { success: false }> {
  // Backend returns raw array (no {success,data} wrapper)
  const res = await apiFetch<unknown>("/favorites", {}, true, true, token);
  // Handle both raw array and potential wrapped format
  const arr = Array.isArray(res) ? res : (res as { data?: unknown[] }).data;
  if (!Array.isArray(arr)) return { success: false };
  return { success: true, data: arr.map(toFavoriteItem) };
}

/** Get just the listing IDs the current user has favorited */
export async function getMyFavoriteIds(token?: string): Promise<Set<number>> {
  try {
    const res = await getFavorites(token);
    if (res.success) {
      return new Set(res.data.map((f) => f.listing_id));
    }
  } catch { /* ignore */ }
  return new Set();
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
  return Math.round(price).toLocaleString("en-US");
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
