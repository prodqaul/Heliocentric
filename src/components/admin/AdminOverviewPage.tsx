import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { fetchAnalytics, type ScanAnalytics } from "../../services/scans";
import type { AppPage } from "../../types/scan";

type AdminOverviewPageProps = {
  onNavigate: (page: AppPage) => void;
};

const MetricCard = ({
  title,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  accent,
}: {
  title: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  accent: string;
}) => (
  <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3 mb-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <span className={`h-9 w-9 rounded-lg ${accent}`} />
    </div>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-slate-500">{primaryLabel}</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{primaryValue}</p>
      </div>
      <div>
        <p className="text-slate-500">{secondaryLabel}</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{secondaryValue}</p>
      </div>
    </div>
  </div>
);

const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({ onNavigate }) => {
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<ScanAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAnalytics("all");
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load analytics."
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
  }, [authLoading, user]);

  const maxDisease = analytics?.diseaseCounts[0]?.count ?? 1;
  const highSeverity =
    analytics?.severityCounts.find((s) =>
      /high|severe|critical/i.test(s.severity)
    )?.count ?? 0;
  const recentAlerts = (analytics?.recentScans ?? [])
    .filter((scan) => /high|severe|critical/i.test(scan.severity))
    .slice(0, 5);

  return (
    <section className="px-4 md:px-8 py-6">
      <div className="mb-6 rounded-xl bg-emerald-700 text-white px-5 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-emerald-100 text-sm">Platform summary</p>
          <h2 className="text-2xl font-semibold mt-1">
            Welcome{user?.name ? `, ${user.name}` : ""}
          </h2>
          <p className="text-emerald-50/90 text-sm mt-2 max-w-xl">
            Monitor scans, farmers, and disease trends across Climavise.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg bg-emerald-800 px-4 py-3 min-w-[120px]">
            <p className="text-xs uppercase tracking-wide text-emerald-200">
              Scans
            </p>
            <p className="text-2xl font-semibold mt-1">
              {analytics?.totalScans ?? "—"}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-800 px-4 py-3 min-w-[120px]">
            <p className="text-xs uppercase tracking-wide text-emerald-200">
              Diseases
            </p>
            <p className="text-2xl font-semibold mt-1">
              {analytics?.uniqueDiseases ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-600">Loading overview...</p>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Scans"
              primaryLabel="Total"
              primaryValue={String(analytics.totalScans)}
              secondaryLabel="Unknown"
              secondaryValue={String(analytics.unknownCount)}
              accent="bg-sky-600"
            />
            <MetricCard
              title="Confidence"
              primaryLabel="Average"
              primaryValue={`${(analytics.avgConfidence * 100).toFixed(1)}%`}
              secondaryLabel="Diseases"
              secondaryValue={String(analytics.uniqueDiseases)}
              accent="bg-rose-600"
            />
            <MetricCard
              title="Severity"
              primaryLabel="High / severe"
              primaryValue={String(highSeverity)}
              secondaryLabel="Categories"
              secondaryValue={String(analytics.severityCounts.length)}
              accent="bg-emerald-600"
            />
            <MetricCard
              title="Activity"
              primaryLabel="Recent"
              primaryValue={String(analytics.recentScans.length)}
              secondaryLabel="Alerts"
              secondaryValue={String(recentAlerts.length)}
              accent="bg-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className="xl:col-span-2 rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Disease breakdown</h3>
                <button
                  type="button"
                  onClick={() => onNavigate("users")}
                  className="text-xs text-emerald-700 hover:text-emerald-800"
                >
                  View users
                </button>
              </div>
              {analytics.diseaseCounts.length === 0 ? (
                <p className="text-sm text-slate-500">No scans yet.</p>
              ) : (
                <ul className="space-y-3">
                  {analytics.diseaseCounts.slice(0, 8).map((item) => (
                    <li key={item.disease}>
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span className="truncate pr-3">{item.disease}</span>
                        <span className="font-medium text-slate-800">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{
                            width: `${Math.max(
                              8,
                              (item.count / maxDisease) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Severity</h3>
                <button
                  type="button"
                  onClick={() => onNavigate("notifications")}
                  className="text-xs text-emerald-700 hover:text-emerald-800"
                >
                  Alerts
                </button>
              </div>
              {analytics.severityCounts.length === 0 ? (
                <p className="text-sm text-slate-500">No severity data.</p>
              ) : (
                <ul className="space-y-2">
                  {analytics.severityCounts.map((item) => (
                    <li
                      key={item.severity}
                      className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-700">{item.severity}</span>
                      <span className="font-semibold text-slate-900">{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-xl bg-white border border-slate-200 p-5 shadow-sm overflow-x-auto">
              <h3 className="font-semibold text-slate-900 mb-4">Recent scans</h3>
              {analytics.recentScans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No scans recorded yet.</p>
                </div>
              ) : (
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Disease</th>
                      <th className="py-2 pr-3 font-medium">Confidence</th>
                      <th className="py-2 pr-3 font-medium">Severity</th>
                      <th className="py-2 font-medium">Farmer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentScans.slice(0, 8).map((scan) => (
                      <tr key={scan.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-3 pr-3 whitespace-nowrap">
                          {scan.createdAt ? scan.createdAt.toLocaleString() : "—"}
                        </td>
                        <td className="py-3 pr-3">{scan.disease}</td>
                        <td className="py-3 pr-3">
                          {(scan.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 pr-3">{scan.severity}</td>
                        <td className="py-3">{scan.name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Latest alerts</h3>
              {recentAlerts.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No high-severity findings right now.
                </p>
              ) : (
                <ul className="space-y-3">
                  {recentAlerts.map((scan) => (
                    <li
                      key={scan.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {scan.disease}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {scan.name || "Unknown farmer"} · {scan.location || "—"}
                      </p>
                      <p className="text-xs text-amber-700 mt-2 font-medium">
                        {scan.severity}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};

export default AdminOverviewPage;
