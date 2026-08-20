import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { AppPage } from "../types/scan";

type LoginPageProps = {
  onNavigate: (page: AppPage) => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      onNavigate("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative px-4 md:px-10 pt-28 pb-12 min-h-[70vh]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 left-10 h-72 w-72 bg-emerald-700/25 blur-3xl rounded-full" />
        <div className="absolute top-20 right-10 h-72 w-72 bg-green-900/30 blur-3xl rounded-full" />
      </div>
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-semibold text-white mb-2">Log in</h1>
        <p className="text-slate-300 text-sm mb-8">
          Access your scan history and analytics dashboard.
        </p>
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl space-y-4"
        >
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-xl text-white font-medium transition ${
              isSubmitting
                ? "bg-slate-500/60 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500"
            }`}
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="text-sm text-slate-400 mt-5 text-center">
          No account yet?{" "}
          <button
            type="button"
            onClick={() => onNavigate("signup")}
            className="text-emerald-300 hover:text-emerald-200"
          >
            Sign up
          </button>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
