import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { fetchAnalytics, type ScanAnalytics } from "../services/scans";
import type { AppPage } from "../types/scan";

type DashboardPageProps = {
  onNavigate: (page: AppPage) => void;
  /** When true, use tighter padding for admin shell. */
  embedded?: boolean;
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
    <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
  </div>
);

const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  embedded = false,
}) => {
  const { user, profile, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const [analytics, setAnalytics] = useState<ScanAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"all" | "mine">(isAdmin ? "all" : "mine");

  useEffect(() => {
    // Farmers are locked to their own scans.
    if (!isAdmin && scope !== "mine") {
      setScope("mine");
    }
  }, [isAdmin, scope]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const effectiveScope = isAdmin ? scope : "mine";
        const data = await fetchAnalytics(effectiveScope);
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load scan analytics from the API."
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
  }, [authLoading, user, scope, isAdmin]);

  if (authLoading) {
    return (
      <section
        className={`px-4 md:px-10 pb-12 text-slate-300 ${
          embedded ? "pt-8" : "pt-28"
        }`}
      >
        Loading account...
      </section>
    );
  }

  if (!user) {
    return (
      <section className="px-4 md:px-10 pt-28 pb-12 min-h-[60vh]">
        <div className="max-w-xl mx-auto text-center bg-white/5 border border-white/10 rounded-3xl p-8">
          <h1 className="text-2xl font-semibold text-white mb-3">Dashboard</h1>
          <p className="text-slate-300 mb-6">
            Log in to view collected scan analytics from the API.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="px-4 py-3 rounded-xl text-white font-medium bg-emerald-700 hover:bg-emerald-600 transition"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => onNavigate("signup")}
              className="px-4 py-3 rounded-xl font-medium bg-slate-700/70 text-slate-100 hover:bg-slate-600/70 transition"
            >
              Sign up
            </button>
          </div>
        </div>
      </section>
    );
  }

  const maxDisease = analytics?.diseaseCounts[0]?.count ?? 1;

  return (
    <section
      className={`relative px-4 md:px-10 pb-12 ${embedded ? "pt-8" : "pt-28"}`}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 left-10 h-72 w-72 bg-emerald-700/25 blur-3xl rounded-full" />
        <div className="absolute top-20 right-10 h-72 w-72 bg-green-900/30 blur-3xl rounded-full" />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-emerald-300 uppercase tracking-[0.25em] text-xs mb-3">
              {isAdmin ? "Platform analytics" : "Your analytics"}
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">
              Welcome{profile?.name ? `, ${profile.name}` : ""}
            </h1>
            <p className="text-slate-300 mt-3 max-w-2xl">
              {isAdmin
                ? "Review all farmer scans across the platform."
                : "You only see scans from your own account."}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  scope === "all"
                    ? "text-emerald-100 bg-emerald-500/25 border-emerald-400/40"
                    : "text-slate-200 bg-slate-800/50 border-slate-600/50"
                }`}
              >
                All scans
              </button>
              <button
                type="button"
                onClick={() => setScope("mine")}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  scope === "mine"
                    ? "text-emerald-100 bg-emerald-500/25 border-emerald-400/40"
                    : "text-slate-200 bg-slate-800/50 border-slate-600/50"
                }`}
              >
                My scans
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mb-6 text-sm text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-slate-300">Loading analytics...</p>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total scans" value={String(analytics.totalScans)} />
              <StatCard
                label="Avg confidence"
                value={`${(analytics.avgConfidence * 100).toFixed(1)}%`}
              />
              <StatCard
                label="Diseases found"
                value={String(analytics.uniqueDiseases)}
              />
              <StatCard
                label="Unknown results"
                value={String(analytics.unknownCount)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl">
                <h2 className="text-white font-semibold mb-4">Disease breakdown</h2>
                {analytics.diseaseCounts.length === 0 ? (
                  <p className="text-slate-400 text-sm">No scans yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {analytics.diseaseCounts.map((item) => (
                      <li key={item.disease}>
                        <div className="flex justify-between text-sm text-slate-300 mb-1">
                          <span className="truncate pr-3">{item.disease}</span>
                          <span>{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
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

              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl">
                <h2 className="text-white font-semibold mb-4">Severity breakdown</h2>
                {analytics.severityCounts.length === 0 ? (
                  <p className="text-slate-400 text-sm">No scans yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {analytics.severityCounts.map((item) => (
                      <li
                        key={item.severity}
                        className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm"
                      >
                        <span className="text-slate-200">{item.severity}</span>
                        <span className="text-emerald-300 font-medium">
                          {item.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl overflow-x-auto">
              <h2 className="text-white font-semibold mb-4">Recent scans</h2>
              {analytics.recentScans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm mb-4">
                    No scans recorded yet. Run an analysis on Home.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("home")}
                    className="px-4 py-2 rounded-xl text-white bg-emerald-700 hover:bg-emerald-600 transition"
                  >
                    Go scan a leaf
                  </button>
                </div>
              ) : (
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-white/10">
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Disease</th>
                      <th className="py-2 pr-3 font-medium">Confidence</th>
                      <th className="py-2 pr-3 font-medium">Severity</th>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentScans.map((scan) => (
                      <tr
                        key={scan.id}
                        className="border-b border-white/5 text-slate-200"
                      >
                        <td className="py-3 pr-3 whitespace-nowrap">
                          {scan.createdAt
                            ? scan.createdAt.toLocaleString()
                            : "—"}
                        </td>
                        <td className="py-3 pr-3">{scan.disease}</td>
                        <td className="py-3 pr-3">
                          {(scan.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 pr-3">{scan.severity}</td>
                        <td className="py-3 pr-3">{scan.name || "—"}</td>
                        <td className="py-3">{scan.location || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};

export default DashboardPage;
