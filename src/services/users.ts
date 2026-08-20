import type { UserProfile, UserRole } from "../types/scan";
import { authHeaders } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type AdminUser = UserProfile & {
  scanCount: number;
};

type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role?: string | null;
  createdAt?: string | null;
  scanCount?: number | null;
};

const mapRole = (role: string | null | undefined): UserRole =>
  role === "admin" ? "admin" : "farmer";

const readApiError = async (res: Response, fallback: string): Promise<string> => {
  try {
    const text = await res.text();
    if (!text.trim()) return fallback;
    try {
      const parsed = JSON.parse(text) as { detail?: unknown };
      if (typeof parsed.detail === "string" && parsed.detail.trim()) {
        return parsed.detail.trim();
      }
    } catch {
      return text.trim();
    }
    return text.trim();
  } catch {
    return fallback;
  }
};

export const fetchUsers = async (limit = 200): Promise<AdminUser[]> => {
  const res = await fetch(`${API_BASE_URL}/api/users?limit=${limit}`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to load users."));
  }
  const data = (await res.json()) as { users?: ApiUser[] };
  return (data.users ?? []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    location: user.location,
    role: mapRole(user.role),
    createdAt: user.createdAt ? new Date(user.createdAt) : null,
    scanCount: typeof user.scanCount === "number" ? user.scanCount : 0,
  }));
};
