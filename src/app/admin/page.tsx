"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  DollarSign,
  Users,
  Send,
  TrendingUp,
  CreditCard,
  Activity,
  ArrowUpRight,
  Crown,
  Zap,
  BarChart3,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/logo";
import { isFirebaseConfigured, getFirebase } from "@/lib/firebase/config";
import { syncStatsToFirebase } from "@/lib/firebase/hooks";

const ThreeBackground = dynamic(() => import("@/components/three-background"), {
  ssr: false,
});

interface AdminStats {
  stats: {
    totalUsers: number;
    totalApplications: number;
    totalAppsUsed: number;
    revenue: { monthly: number; basic: number; premium: number };
    plans: { free: number; basic: number; premium: number };
  };
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    plan: string;
  }>;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        // Sync to Firebase if configured
        if (isFirebaseConfigured) {
          syncStatsToFirebase(data.stats);
        }
      }
    } catch {
      console.error("Failed to fetch stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchStats]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // For admin email, setup admin user first
      if (email === "ankit176424@gmail.com") {
        await fetch("/api/admin/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      }

      const { signIn } = await import("next-auth/react");
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials: " + result.error);
      } else {
        // Small delay to ensure session is established
        await new Promise(r => setTimeout(r, 500));
        setIsLoggedIn(true);
      }
    } catch (err) {
      setError("Login failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ThreeBackground />
        <Card className="w-full max-w-md mx-4 bg-white/5 border-white/10 backdrop-blur-xl relative z-10">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Logo size="lg" />
              </div>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Admin Access
              </Badge>
              <h1 className="text-2xl font-bold text-white mt-4">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">
                Sign in with your admin credentials
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <Input
                  type="email"
                  placeholder="admin@jobswipe.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Access Admin Dashboard"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-gray-400 hover:text-white">
                ← Back to main site
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <ThreeBackground />

      {/* Admin Header */}
      <header className="relative z-10 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchStats}
                disabled={statsLoading}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLoggedIn(false)}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time overview of your platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats?.stats.totalUsers || 0}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    +{stats?.stats.plans.basic || 0} basic · +{stats?.stats.plans.premium || 0} premium
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    ₹{(stats?.stats.revenue.monthly || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    Basic: ₹{(stats?.stats.revenue.basic || 0).toLocaleString()} · Premium: ₹{(stats?.stats.revenue.premium || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Applications</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats?.stats.totalApplications || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats?.stats.totalAppsUsed || 0} AI-generated
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Send className="h-5 w-5 text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">Conversion Rate</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats?.stats.totalUsers
                      ? Math.round(
                          ((stats.stats.plans.basic + stats.stats.plans.premium) /
                            stats.stats.totalUsers) *
                            100
                        )
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Free → Paid
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Plan Distribution */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Free", count: stats?.stats.plans.free || 0, color: "bg-gray-400", price: "₹0" },
                { name: "Basic", count: stats?.stats.plans.basic || 0, color: "bg-violet-400", price: "₹299/mo" },
                { name: "Premium", count: stats?.stats.plans.premium || 0, color: "bg-amber-400", price: "₹499/mo" },
              ].map((plan) => {
                const total = stats?.stats.totalUsers || 1;
                const pct = Math.round((plan.count / total) * 100);
                return (
                  <div key={plan.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{plan.name}</span>
                      <span className="text-white font-medium">
                        {plan.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${plan.color} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{plan.price}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <p className="text-sm text-green-400">Monthly Total</p>
                <p className="text-3xl font-bold text-white">
                  ₹{(stats?.stats.revenue.monthly || 0).toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400">Basic Plan</p>
                  <p className="text-lg font-bold text-violet-400">
                    ₹{(stats?.stats.revenue.basic || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats?.stats.plans.basic || 0} users × ₹299
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400">Premium Plan</p>
                  <p className="text-lg font-bold text-amber-400">
                    ₹{(stats?.stats.revenue.premium || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats?.stats.plans.premium || 0} users × ₹499
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400">Annual Projection</p>
                <p className="text-lg font-bold text-white">
                  ₹{((stats?.stats.revenue.monthly || 0) * 12).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentUsers?.slice(0, 8).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Badge
                      className={`text-xs ${
                        user.plan === "PREMIUM"
                          ? "bg-amber-500/20 text-amber-400"
                          : user.plan === "BASIC"
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {user.plan}
                    </Badge>
                  </div>
                ))}
                {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Firebase Connection Status */}
        <Card className="mt-6 bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-white">Data Source</p>
                  <p className="text-xs text-gray-500">
                    {isFirebaseConfigured
                      ? "Connected to Firebase (real-time sync)"
                      : "Using local database (SQLite) — Add Firebase config for real-time"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Auto-refresh: 30s
              </Badge>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
