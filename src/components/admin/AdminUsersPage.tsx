import React, { useEffect, useMemo, useState } from "react";
import { fetchUsers, type AdminUser } from "../../services/users";

const roleBadge = (role: AdminUser["role"]) =>
  role === "admin"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-sky-100 text-sky-800";

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "farmer">("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUsers();
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load users.");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.location.toLowerCase().includes(q) ||
        user.phone.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const farmerCount = users.filter((u) => u.role === "farmer").length;

  return (
    <section className="px-4 md:px-8 py-6">
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total users</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Admins</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{adminCount}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-sm text-slate-500">Farmers</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{farmerCount}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-200">
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">All users</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Roles, contact details, and scan activity
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, location..."
            className="w-full md:w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "all" | "admin" | "farmer")
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="farmer">Farmer</option>
          </select>
        </div>

        {error && (
          <p className="mx-4 md:mx-5 mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="px-5 py-8 text-slate-600">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-8 text-slate-500 text-sm">No users match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Location</th>
                  <th className="px-3 py-3 font-medium">Scans</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 text-slate-700">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ${roleBadge(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{user.phone || "—"}</td>
                    <td className="px-3 py-3">{user.location || "—"}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {user.scanCount}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {user.createdAt ? user.createdAt.toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminUsersPage;
