// ==========================================
// BaanTDee Backend API — TypeScript Types
// ==========================================

// ---------- Enums ----------

export type ListingType = "house" | "condo" | "townhouse" | "land" | "commercial";
export type ListingOffer = "sale" | "rent" | "sale_rent";
export type ListingStatus = "draft" | "pending" | "active" | "sold" | "rented" | "inactive";

// ---------- Response wrappers ----------

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
export type ApiPaginatedResponse<T> = ApiPaginated<T> | ApiError;

// ---------- Auth ----------

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

// ---------- Listings ----------

/** Listing returned in list endpoint (compact) */
export interface ListingSummary {
  id: number;
  user_id: number;
  slug: string;
  title: string;
  type: ListingType;
  offer: ListingOffer;
  status: ListingStatus;
  price: number;
  price_rent: number | null;
  area: number | null;
  land_area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  province: string;
  district: string;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  // cover image (populated by backend list query)
  cover_url?: string | null;
}

/** Listing returned in detail endpoint (full) */
export interface ListingDetail extends ListingSummary {
  description: string | null;
  floors: number | null;
  parking: number | null;
  year_built: number | null;
  address: string | null;
  subdistrict: string | null;
  postal_code: string | null;
  map_url: string | null;
  longitude: number | null;
  latitude: number | null;
  user_name: string;
  user_phone: string;
  user_avatar: string | null;
}

export interface ListingImage {
  id: number;
  listing_id: number;
  url: string;
  key: string;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface Facility {
  id: number;
  slug: string;
  label: string;
}

export interface ListingDetailResponse {
  listing: ListingDetail;
  images: ListingImage[];
  facilities: Facility[];
}

export interface CreateListingBody {
  title: string;
  description?: string;
  type?: ListingType;
  offer?: ListingOffer;
  price: number;
  price_rent?: number | null;
  area?: number | null;
  land_area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floors?: number | null;
  parking?: number | null;
  year_built?: number | null;
  address?: string;
  province: string;
  district: string;
  subdistrict?: string;
  postal_code?: string;
  map_url?: string;
  longitude?: number;
  latitude?: number;
}

// ---------- Listings query params ----------

export interface ListingsQuery {
  province?: string;
  type?: ListingType;
  offer?: ListingOffer;
  min_price?: number;
  max_price?: number;
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  user_id?: number;
}

// ---------- Favorites ----------

export interface FavoriteItem {
  listing_id: number;
  slug: string;
  title: string;
  type: ListingType;
  offer: ListingOffer;
  price: number;
  province: string;
  district: string;
  cover_url: string | null;
  favorited_at: string;
}

export interface FavoriteToggle {
  listing_id: number;
  favorited: boolean;
}

// ---------- Inquiries ----------

export interface InquiryBody {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface Inquiry {
  id: number;
  listing_id: number;
  sender_id: number | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}
