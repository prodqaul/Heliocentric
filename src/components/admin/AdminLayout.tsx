import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { AppPage } from "../../types/scan";

type AdminLayoutProps = {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  children: React.ReactNode;
};

type NavItem = {
  id: AppPage;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Overview", icon: "▣" },
  { id: "users", label: "Users", icon: "◎" },
  { id: "notifications", label: "Notifications", icon: "◉" },
];

const pageTitle = (page: AppPage): string => {
  switch (page) {
    case "dashboard":
      return "Overview";
    case "users":
      return "Users";
    case "notifications":
      return "Notifications";
    default:
      return "Admin";
  }
};

const linkClass = (active: boolean) =>
  `w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition ${
    active
      ? "bg-emerald-700 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

const AdminLayout: React.FC<AdminLayoutProps> = ({
  activePage,
  onNavigate,
  children,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onNavigate("login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white px-4 py-5">
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-3 mb-6 px-1"
        >
          <img
            src="/climavise_logo.png"
            alt=""
            className="h-9 w-9 object-contain"
          />
          <div className="text-left">
            <p className="font-semibold tracking-wide">Climavise</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400">
              Admin
            </p>
          </div>
        </button>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={linkClass(activePage === item.id)}
              onClick={() => onNavigate(item.id)}
            >
              <span className="w-5 text-center text-xs opacity-80">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-4 px-3 py-2.5 rounded-lg text-sm text-slate-300 bg-slate-800 hover:bg-slate-700"
        >
          Log out
        </button>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-slate-800 text-white px-4 md:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-300">
                Admin / {pageTitle(activePage)}
              </p>
              <h1 className="text-lg font-semibold">
                Hi, welcome back!
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate("notifications")}
                className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-sm hover:bg-slate-600"
                aria-label="Notifications"
              >
                ◉
              </button>
              <div className="hidden sm:block text-right">
                <p className="text-sm">{user?.name ?? "Admin"}</p>
                <p className="text-xs text-slate-300">{user?.email}</p>
              </div>
              <div className="md:hidden flex gap-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`px-2.5 py-1.5 rounded-md text-xs ${
                      activePage === item.id
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-700 text-slate-200"
                    }`}
                    onClick={() => onNavigate(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-slate-100">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
