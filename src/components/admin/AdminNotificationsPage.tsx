import React, { useEffect, useMemo, useState } from "react";
import { fetchAnalytics } from "../../services/scans";
import type { ScanRecord } from "../../types/scan";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "critical" | "warning" | "info";
  tag: string;
};

const toneStyles: Record<NotificationItem["tone"], string> = {
  critical: "bg-rose-100 text-rose-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-sky-100 text-sky-800",
};

const severityTone = (severity: string): NotificationItem["tone"] => {
  if (/high|severe|critical/i.test(severity)) return "critical";
  if (/medium|moderate/i.test(severity)) return "warning";
  return "info";
};

const AdminNotificationsPage: React.FC = () => {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">(
    "all"
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnalytics("all");
        if (!cancelled) setScans(data.recentScans);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load notifications."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const fromScans = scans.map((scan) => {
      const tone = severityTone(scan.severity);
      return {
        id: `scan-${scan.id}`,
        title:
          tone === "critical"
            ? `High-severity scan: ${scan.disease}`
            : `New scan: ${scan.disease}`,
        detail: `${scan.name || "Unknown farmer"} · ${scan.location || "Unknown location"} · ${(
          scan.confidence * 100
        ).toFixed(1)}% confidence`,
        time: scan.createdAt ? scan.createdAt.toLocaleString() : "Recently",
        tone,
        tag: scan.severity || "Scan",
      };
    });

    const system: NotificationItem[] = [
      {
        id: "sys-welcome",
        title: "Admin console ready",
        detail: "Overview, users, and scan alerts are available from the sidebar.",
        time: "System",
        tone: "info",
        tag: "System",
      },
    ];

    return [...fromScans, ...system];
  }, [scans]);

  const filtered = notifications.filter(
    (item) => filter === "all" || item.tone === filter
  );

  const counts = {
    all: notifications.length,
    critical: notifications.filter((n) => n.tone === "critical").length,
    warning: notifications.filter((n) => n.tone === "warning").length,
    info: notifications.filter((n) => n.tone === "info").length,
  };

  return (
    <section className="px-4 md:px-8 py-6">
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          [
            ["all", "All"],
            ["critical", "Critical"],
            ["warning", "Warning"],
            ["info", "Info"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl border p-4 text-left shadow-sm transition ${
              filter === key
                ? "bg-emerald-700 border-emerald-700 text-white"
                : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
            }`}
          >
            <p className={`text-sm ${filter === key ? "text-emerald-100" : "text-slate-500"}`}>
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold">{counts[key]}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="px-4 md:px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Notification feed</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            High-severity findings and recent platform scan activity
          </p>
        </div>

        {error && (
          <p className="mx-4 md:mx-5 mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="px-5 py-8 text-slate-600">Loading notifications...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">
            No notifications in this category.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="px-4 md:px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <span
                  className={`inline-flex shrink-0 rounded-md px-2 py-1 text-xs font-medium ${toneStyles[item.tone]}`}
                >
                  {item.tag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{item.detail}</p>
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">{item.time}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AdminNotificationsPage;
