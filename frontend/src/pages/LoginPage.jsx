
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
} from "lucide-react";

import api from "../services/api";
import Logo from "../components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate(
        data.user.role === "Worker"
          ? "/inventory"
          : "/dashboard"
      );
    } catch (err) {
      setError(
        err.response?.data?.error || "Cannot reach the server"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#031f25] text-white">

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#064b50_0%,#032c32_42%,#02191f_100%)]" />

      {/* Concentric circles */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-400/20 sm:h-[560px] sm:w-[560px]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-400/25 sm:h-[820px] sm:w-[820px]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-400/15 sm:h-[1100px] sm:w-[1100px]" />

      {/* Ambient lighting */}
      <div className="absolute -left-32 bottom-[-180px] h-[420px] w-[420px] rounded-full bg-teal-500/20 blur-[110px]" />

      <div className="absolute -right-32 top-[-180px] h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-[110px]" />

      {/* Floating decorative dots */}
      <span className="absolute left-[23%] top-[25%] h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_20px_#2dd4bf]" />

      <span className="absolute right-[22%] top-[55%] h-3 w-3 rounded-full bg-purple-500 shadow-[0_0_20px_#a855f7]" />

      <span className="absolute bottom-[17%] left-[18%] h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-7 sm:px-12 lg:px-20">

        <div className="flex items-center gap-3">

          {/* Exact three-piece Z logo from sidebar */}
          <div className="flex h-12 w-12 items-center justify-center">
            <Logo size={48} />
          </div>

          <div className="text-2xl font-bold tracking-tight">
            TranZact{" "}
            <span className="font-normal text-teal-200">
              ERP
            </span>
          </div>

        </div>

        <p className="hidden text-sm tracking-wide text-teal-100/70 sm:block">
          Smarter Business. Better Tomorrow.
          <span className="ml-4 inline-block h-px w-8 bg-teal-400" />
        </p>

      </header>

      {/* Login section */}
      <main className="relative z-10 flex min-h-[calc(100vh-105px)] items-center justify-center px-5 pb-12">

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[460px] animate-[fadeIn_.8s_ease-out] text-center"
        >

          {/* Heading */}
          <p className="mb-7 text-sm font-bold tracking-[0.35em] text-teal-300">
            [ WELCOME BACK ]
          </p>

          <h1 className="mb-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Enter the studio
          </h1>

          <p className="mb-10 text-sm text-slate-300/60">
            Sign in to access your workspace
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-left text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="mb-4 flex h-[68px] items-center gap-4 rounded-full border border-teal-400/80 bg-white/[0.06] px-6 transition-all duration-300 focus-within:border-teal-300 focus-within:bg-white/[0.1] focus-within:shadow-[0_0_25px_rgba(45,212,191,0.12)]">

            <Mail
              size={21}
              className="shrink-0 text-teal-200"
            />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-white outline-none placeholder:text-slate-300/70"
              autoComplete="username"
              required
            />

          </div>

          {/* Password field */}
          <div className="mb-6 flex h-[68px] items-center gap-4 rounded-full border border-teal-400/80 bg-white/[0.06] px-6 transition-all duration-300 focus-within:border-teal-300 focus-within:bg-white/[0.1] focus-within:shadow-[0_0_25px_rgba(45,212,191,0.12)]">

            <LockKeyhole
              size={21}
              className="shrink-0 text-teal-200"
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-white outline-none placeholder:text-slate-300/70"
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-teal-200/70 transition hover:text-teal-100"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>

          </div>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading}
            className="group flex h-[68px] w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-teal-300 to-cyan-400 text-base font-bold text-[#032c32] shadow-lg shadow-teal-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_35px_rgba(45,212,191,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}

            {!loading && (
              <ArrowRight
                size={21}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            )}
          </button>

          {/* Footer */}
          <p className="mt-7 text-xs tracking-wide text-slate-400/70">
            Secure access to your TranZact workspace
          </p>

        </form>

      </main>

      {/* Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}
