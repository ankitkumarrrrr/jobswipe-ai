"use client";

import { useState, useEffect, useActionState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/actions/auth";

export default function LampLoginAnimation() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isPending) {
      setLampOn(true);
    }
  }, [isPending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLampOn(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      await formAction(formData);
      // Server action handles redirect — no client-side redirect needed
    } catch {
      // NEXT_REDIRECT errors are expected on success
    } finally {
      // Only reset if we didn't redirect
      setTimeout(() => setIsLoading(false), 100);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030712] via-[#111827] to-[#030712] overflow-hidden relative">
      {/* Lamp Scene */}
      <div className="fixed inset-0 flex items-start justify-center pointer-events-none z-0">
        {/* Light cone */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out ${
            lampOn
              ? "w-[800px] h-[800px] opacity-100"
              : "w-0 h-0 opacity-0"
          }`}
          style={{
            top: "180px",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.07) 40%, transparent 70%)",
          }}
        />

        {/* Ambient glow */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full transition-opacity duration-700 ${
            lampOn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: "50px",
            background:
              "radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Floating particles */}
        {[
          { top: "100px", left: "calc(50% - 100px)", delay: "0s" },
          { top: "60px", left: "calc(50% + 90px)", delay: "0.5s" },
          { top: "150px", left: "calc(50% - 60px)", delay: "1s" },
          { top: "40px", left: "calc(50% + 40px)", delay: "1.5s" },
          { top: "130px", left: "calc(50% + 70px)", delay: "2s" },
          { top: "180px", left: "calc(50% - 90px)", delay: "0.7s" },
          { top: "80px", left: "calc(50% + 20px)", delay: "1.3s" },
        ].map((p, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full transition-opacity duration-500 ${
              lampOn ? "opacity-100" : "opacity-0"
            }`}
            style={{
              top: p.top,
              left: p.left,
              background: "rgba(251,191,36,0.5)",
              animation: lampOn
                ? `floatLamp 3s ease-in-out ${p.delay} infinite`
                : "none",
            }}
          />
        ))}

        {/* Lamp SVG */}
        <div
          className={`transition-all duration-700 ${
            mounted
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-8 opacity-0 scale-90"
          }`}
          style={{ marginTop: "30px" }}
        >
          <svg
            width="240"
            height="320"
            viewBox="0 0 120 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible" }}
          >
            {/* Lamp shade */}
            <path
              d="M30 20 L60 2 L90 20 L80 50 L40 50 Z"
              fill={lampOn ? "#fbbf24" : "#374151"}
              stroke={lampOn ? "#f59e0b" : "#4b5563"}
              strokeWidth="2"
              style={{ transition: "all 0.5s" }}
            />
            {/* Inner glow */}
            <ellipse
              cx="60"
              cy="45"
              rx="18"
              ry="8"
              fill="#fef3c7"
              opacity={lampOn ? 0.8 : 0}
              style={{ transition: "opacity 0.5s" }}
            />
            {/* Bulb */}
            <circle
              cx="60"
              cy="55"
              r="8"
              fill={lampOn ? "#fef08a" : "#1f2937"}
              stroke={lampOn ? "#facc15" : "#374151"}
              strokeWidth="1.5"
              style={{ transition: "all 0.3s" }}
            />
            {/* Bulb outer ring */}
            <circle
              cx="60"
              cy="55"
              r="14"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1"
              opacity={lampOn ? 0.4 : 0}
              style={{ transition: "opacity 0.3s" }}
            />
            {/* Bulb outer ring 2 */}
            <circle
              cx="60"
              cy="55"
              r="20"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.5"
              opacity={lampOn ? 0.2 : 0}
              style={{ transition: "opacity 0.5s" }}
            />
            {/* Neck */}
            <line
              x1="60"
              y1="63"
              x2="60"
              y2="110"
              stroke="#6b7280"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Joint */}
            <circle cx="60" cy="110" r="5" fill="#4b5563" />
            {/* Arm */}
            <line
              x1="60"
              y1="110"
              x2="60"
              y2="130"
              stroke="#6b7280"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Base */}
            <ellipse
              cx="60"
              cy="140"
              rx="30"
              ry="8"
              fill="#374151"
              stroke="#4b5563"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Login Card */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
        style={{ marginTop: "340px" }}
      >
        <div
          className={`bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl transition-shadow duration-500 ${
            lampOn ? "shadow-[0_25px_50px_rgba(0,0,0,0.5),0_0_60px_rgba(251,191,36,0.08)]" : ""
          }`}
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-2 transition-all duration-500">
              {lampOn ? "Welcome back! ✨" : "Turn on the light 💡"}
            </h1>
            <p className="text-gray-400 text-sm">
              Sign in to continue your job search
            </p>
          </div>

          {state?.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {state.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400">
                <input
                  type="checkbox"
                  className="rounded border-white/20 bg-white/5"
                />
                Remember me
              </label>
              <a
                href="#"
                className="text-amber-400 hover:text-amber-300"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className={`w-full h-11 text-white transition-all duration-500 ${
                lampOn
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/25"
                  : "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500"
              }`}
              disabled={isLoading || isPending}
            >
              {isLoading || isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              Sign up for free
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatLamp {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-25px) translateX(12px);
          }
        }
      `}</style>
    </div>
  );
}
