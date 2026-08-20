import React from "react";
import { useAuth } from "../contexts/AuthContext";
import type { AppPage } from "../types/scan";

type NavbarProps = {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
};

const navBtn = (active: boolean) =>
  `text-xs md:text-sm px-3 py-1 rounded-full border transition ${
    active
      ? "text-emerald-100 bg-emerald-500/25 border-emerald-400/40"
      : "text-slate-200 bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/60"
  }`;

const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate("home");
    } catch {
      onNavigate("home");
    }
  };

  return (
    <nav className="w-full px-6 md:px-10 py-4 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl text-white fixed top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 md:gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80"
          aria-label="Climavise home"
        >
          <img
            src="/climavise_logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 md:h-10 md:w-10 object-contain"
            decoding="async"
          />
          <span className="font-bold text-xl md:text-2xl tracking-wide">
            Climavise
          </span>
        </button>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className={navBtn(activePage === "home")}
          >
            Home
          </button>
          {!loading && user && (
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className={navBtn(activePage === "dashboard")}
            >
              Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate("support")}
            className={navBtn(activePage === "support")}
          >
            Support
          </button>
          {!loading &&
            (user ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className={navBtn(false)}
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className={navBtn(activePage === "login")}
              >
                Log in
              </button>
            ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
