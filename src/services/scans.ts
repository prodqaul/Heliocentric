import type { ScanRecord, ScanResultPayload } from "../types/scan";
import { authHeaders } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type ScanAnalytics = {
  totalScans: number;
  avgConfidence: number;
  uniqueDiseases: number;
  unknownCount: number;
  diseaseCounts: { disease: string; count: number }[];
  severityCounts: { severity: string; count: number }[];
  recentScans: ScanRecord[];
};

type ApiScan = {
  id: number | string;
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  fileName?: string | null;
  prediction: string;
  confidence?: number | null;
  disease?: string | null;
  description?: string | null;
  cause?: string | null;
  treatment?: string[] | null;
  severity?: string | null;
  createdAt?: string | null;
};

const mapScan = (scan: ApiScan): ScanRecord => ({
  id: String(scan.id),
  userId: scan.userId ?? null,
  name: scan.name ?? "",
  email: scan.email ?? null,
  phone: scan.phone ?? "",
  location: scan.location ?? "",
  fileName: scan.fileName ?? "N/A",
  prediction: scan.prediction,
  confidence: typeof scan.confidence === "number" ? scan.confidence : 0,
  disease: scan.disease ?? scan.prediction,
  description: scan.description ?? "",
  cause: scan.cause ?? "",
  treatment: Array.isArray(scan.treatment) ? scan.treatment : [],
  severity: scan.severity ?? "Unknown",
  createdAt: scan.createdAt ? new Date(scan.createdAt) : null,
});

const getApiErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const text = await res.text();
    if (!text.trim()) return fallback;
    try {
      const parsed = JSON.parse(text) as { detail?: unknown; message?: unknown };
      if (typeof parsed.detail === "string" && parsed.detail.trim()) {
        return parsed.detail.trim();
      }
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      return text.trim();
    }
    return text.trim();
  } catch {
    return fallback;
  }
};

export const fetchAnalytics = async (
  scope: "all" | "mine" = "all"
): Promise<ScanAnalytics> => {
  const params = new URLSearchParams();
  if (scope === "mine") params.set("user_id", "me");
  const url = `${API_BASE_URL}/api/analytics${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(await getApiErrorMessage(res, "Failed to load analytics."));
  }
  const data = (await res.json()) as {
    totalScans?: number;
    avgConfidence?: number;
    uniqueDiseases?: number;
    unknownCount?: number;
    diseaseCounts?: { disease: string; count: number }[];
    severityCounts?: { severity: string; count: number }[];
    recentScans?: ApiScan[];
  };

  return {
    totalScans: data.totalScans ?? 0,
    avgConfidence: data.avgConfidence ?? 0,
    uniqueDiseases: data.uniqueDiseases ?? 0,
    unknownCount: data.unknownCount ?? 0,
    diseaseCounts: data.diseaseCounts ?? [],
    severityCounts: data.severityCounts ?? [],
    recentScans: (data.recentScans ?? []).map(mapScan),
  };
};

export type { ScanResultPayload };
