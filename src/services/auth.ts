import type { UserProfile } from "../types/scan";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_KEY = "climavise_auth_token";

export type AuthUser = UserProfile;

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    role?: string | null;
    createdAt?: string | null;
  };
};

const mapRole = (role: string | null | undefined): AuthUser["role"] =>
  role === "admin" ? "admin" : "farmer";

const mapUser = (user: AuthResponse["user"]): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  location: user.location,
  role: mapRole(user.role),
  createdAt: user.createdAt ? new Date(user.createdAt) : null,
});

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

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
};

export const authHeaders = (): HeadersInit => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const signupRequest = async (input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
}): Promise<{ token: string; user: AuthUser }> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Unable to create account."));
  }
  const data = (await res.json()) as AuthResponse;
  return { token: data.token, user: mapUser(data.user) };
};

export const loginRequest = async (
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser }> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Unable to log in."));
  }
  const data = (await res.json()) as AuthResponse;
  return { token: data.token, user: mapUser(data.user) };
};

export const fetchMe = async (): Promise<AuthUser> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Unable to load account."));
  }
  const data = (await res.json()) as { user: AuthResponse["user"] };
  return mapUser(data.user);
};
