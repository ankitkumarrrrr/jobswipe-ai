"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/logo";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLampOn(true);
    setError("");

    try {
      // Step 1: Register the user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        setLampOn(false);
        return;
      }

      // Step 2: Auto-login via native form POST to NextAuth
      // This sets the cookie and redirects server-side — works on ALL devices
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/callback/credentials?callbackUrl=/dashboard";

      const fields: Record<string, string> = {
        csrfToken,
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: "true",
      };

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      {/* Left side — Pendant lamp + branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center px-12 relative overflow-hidden">
        {/* Light cone */}
        <div
          className={`absolute transition-all duration-[1500ms] ease-out ${
            lampOn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            height: "90%",
            background:
              "radial-gradient(ellipse at 50% 8%, rgba(255,220,130,0.18) 0%, rgba(255,200,80,0.06) 25%, transparent 55%)",
          }}
        />

        {/* Ambient warm glow */}
        <div
          className={`absolute transition-opacity duration-1000 ${
            lampOn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,200,80,0.2) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Pendant Lamp SVG — centered */}
        <div
          className={`absolute transition-all duration-700 ${
            lampOn ? "opacity-100" : "opacity-0"
          }`}
          style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
        >
          <svg
            width="180"
            height="320"
            viewBox="0 0 120 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Wire */}
            <line x1="60" y1="0" x2="60" y2="50" stroke="#555" strokeWidth="1.5" />
            {/* Ceiling plate */}
            <rect x="48" y="0" width="24" height="7" rx="3" fill="#444" />
            {/* Socket holder */}
            <rect x="50" y="45" width="20" height="16" rx="3" fill="#3a3a3a" />
            {/* Socket rim */}
            <rect x="47" y="57" width="26" height="5" rx="2" fill="#4a4a4a" />
            {/* Bulb outer */}
            <ellipse
              cx="60" cy="82"
              rx="18" ry="22"
              fill={lampOn ? "#ffeaa7" : "#2a2a2a"}
              style={{ transition: "fill 0.8s ease" }}
            />
            {/* Bulb inner glow */}
            {lampOn && (
              <ellipse cx="60" cy="78" rx="10" ry="12" fill="#fff3c4" opacity="0.7" />
            )}
            {/* Bulb highlight */}
            {lampOn && (
              <ellipse cx="55" cy="72" rx="4" ry="6" fill="#ffffff" opacity="0.3" />
            )}
            {/* Filament lines */}
            {lampOn && (
              <>
                <path d="M55 74 Q60 68 65 74" stroke="#e6a800" strokeWidth="1" fill="none" opacity="0.8" />
                <path d="M56 80 Q60 75 64 80" stroke="#e6a800" strokeWidth="1" fill="none" opacity="0.6" />
              </>
            )}
          </svg>
        </div>

        {/* Text below lamp */}
        <div
          className={`text-center max-w-md transition-all duration-700 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ position: "absolute", bottom: "80px" }}
        >
          <span className="text-6xl block mb-4">✨</span>
          <h2 className="text-3xl font-bold text-white mb-3">
            Your AI job search starts here
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Create your free account and let our AI transform your job search experience.
          </p>
          <div className="space-y-4">
            {["AI-powered resume customization", "Smart job matching algorithm", "Automated cover letters", "LinkedIn & email outreach"].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                </div>
                <span className="text-gray-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Create your account
                </h1>
                <p className="text-gray-400 text-sm">
                  Start applying to jobs with AI in under 2 minutes
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-amber-500/20"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className={`w-full h-11 text-white transition-all duration-500 ${
                    lampOn
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/25"
                      : "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500"
                  }`}
                  disabled={loading || !csrfToken}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator className="bg-white/10" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111827] px-2 text-xs text-gray-500">
                  or sign up with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={handleGoogleLogin}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
              </div>

              <p className="mt-6 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-amber-400 hover:text-amber-300 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
