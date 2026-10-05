export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const GC_TIME = 10 * 60_000;

export const STORAGE_KEYS = {
  refreshToken: "school-os.refresh-token",
  activeSchoolId: "school-os.active-school-id",
  activeYearId: "school-os.active-year-id",
} as const;

export const ACCESS_TOKEN_EXPIRY_MARGIN_MS = 60_000;
