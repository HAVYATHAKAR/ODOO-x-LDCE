// Types mirroring the backend Pydantic schemas (app/schemas/*).
// NOTE: backend serializes Decimal as a JSON *string* (e.g. "1500.00"), so all
// money fields are typed as `string`. Use lib/format.ts helpers to display them.

export type Money = string;

// ── Common ───────────────────────────────────────────────────
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Message {
  detail: string;
}

export interface ApiError {
  detail: string;
  code?: string;
  /** Populated for 422 validation errors (FastAPI/Pydantic). */
  fields?: Record<string, string>;
}

// ── Users / auth ─────────────────────────────────────────────
export interface UserPublic {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  city: string | null;
  country: string | null;
  additional_info: string | null;
  avatar_url: string | null;
  language_pref: string;
  is_admin: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: TokenPair;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface ForgotPasswordResponse {
  detail: string;
  reset_token?: string | null;
}

export interface UserUpdate {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  city?: string | null;
  country?: string | null;
  additional_info?: string | null;
  avatar_url?: string | null;
  language_pref?: string | null;
}

// ── Catalog ──────────────────────────────────────────────────
export interface CityOut {
  id: number;
  name: string;
  country: string;
  region: string | null;
  latitude: Money | null;
  longitude: Money | null;
  cost_index: Money;
  popularity_score: number;
  image_url: string | null;
  description: string | null;
}

export interface CitySummary {
  id: number;
  name: string;
  country: string;
  image_url: string | null;
}

export interface ActivityOut {
  id: number;
  city_id: number;
  name: string;
  category: string;
  description: string | null;
  estimated_cost: Money;
  duration_minutes: number | null;
  image_url: string | null;
}

// ── Sections & itinerary ─────────────────────────────────────
export const SECTION_TYPES = [
  "transport",
  "accommodation",
  "activity",
  "food",
  "sightseeing",
  "other",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export interface SectionActivityOut {
  id: number;
  trip_section_id: number;
  activity_id: number | null;
  custom_name: string | null;
  display_name: string;
  scheduled_date: string;
  scheduled_time: string | null;
  sequence_order: number;
  expense: Money;
  notes: string | null;
  activity: ActivityOut | null;
}

export interface SectionActivityCreate {
  activity_id?: number | null;
  custom_name?: string | null;
  scheduled_date: string;
  scheduled_time?: string | null;
  expense?: Money;
  notes?: string | null;
}

export interface SectionActivityUpdate {
  activity_id?: number | null;
  custom_name?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  expense?: Money | null;
  notes?: string | null;
}

export interface TripSectionOut {
  id: number;
  trip_id: number;
  title: string;
  description: string | null;
  section_type: SectionType;
  city_id: number | null;
  start_date: string;
  end_date: string;
  budget: Money;
  sequence_order: number;
  notes: string | null;
  city: CitySummary | null;
  activities: SectionActivityOut[];
}

export interface TripSectionCreate {
  title: string;
  description?: string | null;
  section_type: SectionType;
  city_id?: number | null;
  start_date: string;
  end_date: string;
  budget?: Money;
  notes?: string | null;
}

export interface TripSectionUpdate {
  title?: string;
  description?: string | null;
  section_type?: SectionType;
  city_id?: number | null;
  start_date?: string;
  end_date?: string;
  budget?: Money;
  notes?: string | null;
}

export interface ReorderRequest {
  ordered_ids: number[];
}

// ── Trips ────────────────────────────────────────────────────
export type TripStatus = "upcoming" | "ongoing" | "completed";

export interface TripListItem {
  id: number;
  name: string;
  description: string | null;
  cover_photo_url: string | null;
  total_budget: Money | null;
  currency: string;
  is_public: boolean;
  created_at: string;
  start_date: string;
  end_date: string;
  num_days: number;
  status: TripStatus;
}

export interface TripDetail extends TripListItem {
  user_id: number;
  show_public_budget: boolean;
  public_slug: string | null;
  copied_from_trip_id: number | null;
  updated_at: string;
  owner: UserPublic;
  sections: TripSectionOut[];
}

export interface PublicTripOut {
  id: number;
  name: string;
  description: string | null;
  cover_photo_url: string | null;
  currency: string;
  public_slug: string;
  owner: UserPublic;
  show_budget: boolean;
  total_budget: Money | null;
  sections: TripSectionOut[];
  start_date: string;
  end_date: string;
  num_days: number;
  status: TripStatus;
}

export interface TripCreate {
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  cover_photo_url?: string | null;
  total_budget?: Money | null;
  currency?: string;
}

export interface TripUpdate {
  name?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  cover_photo_url?: string | null;
  total_budget?: Money | null;
  currency?: string;
  is_public?: boolean;
  show_public_budget?: boolean;
}

export interface ShareResponse {
  is_public: boolean;
  public_slug: string | null;
  public_path: string | null;
}

// ── Budget & health ──────────────────────────────────────────
export interface CategoryBreakdown {
  planned: Money;
  actual: Money;
}

export interface BudgetSummary {
  trip_id: number;
  currency: string;
  target_budget: Money | null;
  total_planned: Money;
  total_actual: Money;
  variance: Money | null;
  per_day: Money | null;
  breakdown: Record<string, CategoryBreakdown>;
}

export interface HealthInsight {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  action: string | null;
  section_id: number | null;
  day: string | null;
  meta: Record<string, unknown>;
}

export interface TripHealth {
  trip_id: number;
  overall_score: number;
  rating: "excellent" | "good" | "fair" | "needs work";
  insights: HealthInsight[];
}

// ── Dashboard ────────────────────────────────────────────────
export interface TripCounts {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
}

export interface DashboardResponse {
  counts: TripCounts;
  upcoming_trips: TripListItem[];
  recent_trips: TripListItem[];
  popular_cities: CityOut[];
}

// ── Saved destinations ───────────────────────────────────────
export interface SavedOut {
  id: number;
  created_at: string;
  city: CityOut;
}

// ── Community ────────────────────────────────────────────────
export interface PostOut {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  like_count: number;
  trip_id: number | null;
  created_at: string;
  author: UserPublic;
  comment_count: number;
  liked_by_me: boolean;
}

export interface CommentOut {
  id: number;
  post_id: number;
  body: string;
  created_at: string;
  author: UserPublic;
}

export interface LikeToggleResponse {
  liked: boolean;
  like_count: number;
}

export interface PostCreate {
  title: string;
  body: string;
  image_url?: string | null;
  trip_id?: number | null;
}

// ── Admin ────────────────────────────────────────────────────
export interface PopularCity {
  city: CityOut;
  usage_count: number;
}

export interface PopularActivity {
  activity: ActivityOut;
  usage_count: number;
}

export interface AdminOverview {
  user_count: number;
  trip_count: number;
  public_trip_count: number;
  city_count: number;
  activity_count: number;
  post_count: number;
  popular_cities: PopularCity[];
  popular_activities: PopularActivity[];
}
