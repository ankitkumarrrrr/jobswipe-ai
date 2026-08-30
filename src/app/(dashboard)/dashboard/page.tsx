"use client";

import { useState, useEffect } from "react";
import {
  Send, Eye, TrendingUp, Zap, ArrowUpRight,
  Briefcase, Clock, Target, Upload, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/stat-card";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-purple-100 text-purple-700",
  RESPONDED: "bg-green-100 text-green-700",
  INTERVIEW: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const [totalApps, setTotalApps] = useState(0);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [userName, setUserName] = useState("there");
  const [interviews, setInterviews] = useState(0);
  const [responseRate, setResponseRate] = useState("0%");
  const [appsUsed, setAppsUsed] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState("FREE");
  const [appsLimit, setAppsLimit] = useState(5);
  const [monthlyData, setMonthlyData] = useState<{ month: string; apps: number; resp: number }[]>([]);

  useEffect(() => {
    // Fetch applications from real data
    fetch("/api/automation")
      .then((r) => r.json())
      .then((data) => {
        if (data.applications) {
          const apps = data.applications;
          setTotalApps(apps.length);
          setAppsUsed(apps.length);

          const responded = apps.filter((a: any) =>
            ["VIEWED", "RESPONDED", "INTERVIEW"].includes(a.status)
          );
          const ints = apps.filter((a: any) => a.status === "INTERVIEW");
          setInterviews(ints.length);
          setResponseRate(apps.length > 0 ? `${Math.round((responded.length / apps.length) * 100)}%` : "0%");

          setRecentApps(apps.slice(0, 5).map((a: any) => ({
            id: a.id,
            company: a.job?.company || "Unknown",
            position: a.job?.title || "Position",
            status: a.status,
            date: new Date(a.createdAt).toLocaleDateString(),
            match: 85,
          })));

          // Build real monthly data from applications
          const now = new Date();
          const months: { month: string; apps: number; resp: number }[] = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString("default", { month: "short" });
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const monthApps = apps.filter((a: any) => {
              const created = new Date(a.createdAt);
              return created >= monthStart && created <= monthEnd;
            });
            const monthResp = monthApps.filter((a: any) =>
              ["VIEWED", "RESPONDED", "INTERVIEW"].includes(a.status)
            );
            months.push({ month: monthName, apps: monthApps.length, resp: monthResp.length });
          }
          setMonthlyData(months);
        }
      })
      .catch(() => {});

    // Fetch subscription data
    fetch("/api/payments")
      .then((r) => r.json())
      .then((data) => {
        if (data.plan) {
          setSubscriptionPlan(data.plan);
          setAppsLimit(data.applicationsLimit || 5);
        }
      })
      .catch(() => {});

    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d?.user?.name) setUserName(d.user.name.split(" ")[0]); })
      .catch(() => {});
  }, []);

  const maxH = Math.max(...monthlyData.map((d) => d.apps), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Good morning, {userName} 👋</h1>
          <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your job search today.</p>
        </div>
        <Link href="/jobs">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500">
            <Briefcase className="h-4 w-4 mr-2" /> Browse Jobs
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applications Sent" value={String(totalApps)} change={`${totalApps > 0 ? "Active" : "Start swiping!"}`} changeType="positive" icon={Send} iconColor="text-violet-500" iconBg="bg-violet-100 dark:bg-violet-500/10" />
        <StatCard title="Profile Views" value={String(Math.floor(totalApps * 0.7))} change="Estimated" changeType="positive" icon={Eye} iconColor="text-blue-500" iconBg="bg-blue-100 dark:bg-blue-500/10" />
        <StatCard title="Response Rate" value={responseRate} change="From outreach" changeType="positive" icon={TrendingUp} iconColor="text-green-500" iconBg="bg-green-100 dark:bg-green-500/10" />
        <StatCard title="Interview Requests" value={String(interviews)} change="From automation" changeType="positive" icon={Target} iconColor="text-amber-500" iconBg="bg-amber-100 dark:bg-amber-500/10" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Applications Overview</CardTitle>
            <Badge variant="outline">Last 6 months</Badge>
          </CardHeader>
          <CardContent>
            {monthlyData.every(d => d.apps === 0) ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <BarChart3 className="h-8 w-8 mb-2" />
                <p className="text-sm">No applications yet</p>
                <p className="text-xs">Start applying to see your progress here</p>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3 h-48">
                  {monthlyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center gap-1">
                        <div className="w-full bg-gradient-to-t from-violet-500 to-indigo-400 rounded-t-md" style={{ height: `${maxH > 0 ? (d.apps / maxH) * 140 : 0}px` }} />
                        <div className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-md" style={{ height: `${maxH > 0 ? (d.resp / maxH) * 140 : 0}px` }} />
                      </div>
                      <span className="text-xs text-gray-500">{d.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 text-xs mt-4">
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-gradient-to-r from-violet-500 to-indigo-400" /><span className="text-gray-500">Applications</span></div>
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-gradient-to-r from-emerald-500 to-teal-400" /><span className="text-gray-500">Responses</span></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Subscription</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                <Zap className="h-4 w-4" /> {subscriptionPlan} Plan
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Applications Used</span>
                <span className="font-medium">{appsUsed} / {appsLimit === -1 ? "∞" : appsLimit}</span>
              </div>
              <Progress value={appsLimit === -1 ? 5 : Math.min(100, Math.round((appsUsed / appsLimit) * 100))} className="h-2" />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-3">{subscriptionPlan === "FREE" ? "Upgrade to Basic for 100 applications/month" : subscriptionPlan === "BASIC" ? "Upgrade to Premium for unlimited applications" : "You're on the best plan!"}</p>
              {subscriptionPlan === "FREE" && <Link href="/settings"><Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm">Upgrade Plan</Button></Link>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Applications</CardTitle>
            <Link href="/applications" className="text-sm text-violet-500 hover:text-violet-600">View All</Link>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <div className="text-center py-8">
                <Send className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No applications yet</p>
                <p className="text-xs text-gray-400 mt-1">Swipe right on jobs to start applying with AI</p>
                <Link href="/jobs"><Button size="sm" className="mt-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">Find Jobs</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentApps.map((app: any) => (
                  <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-violet-600">{(app.company || "?")[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{app.position}</p>
                      <p className="text-xs text-gray-500">{app.company} · {app.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-violet-100 text-violet-700">{app.match}%</Badge>
                      <Badge className={`text-xs ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>{app.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link href="/resume" className="block">
              <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center"><Upload className="h-5 w-5 text-violet-500" /></div>
                <div><p className="text-sm font-medium">Upload Resume</p><p className="text-xs text-gray-500">Let AI extract your skills and experience</p></div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
              </div>
            </Link>
            <Link href="/jobs" className="block">
              <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center"><Briefcase className="h-5 w-5 text-blue-500" /></div>
                <div><p className="text-sm font-medium">Find Jobs</p><p className="text-xs text-gray-500">Browse AI-matched opportunities</p></div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
              </div>
            </Link>
            <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-500/5 dark:to-indigo-500/5 border border-violet-100 dark:border-violet-500/10">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-violet-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Pro Tip</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Upload your resume first — AI will use it to generate personalized cover letters, customize your resume for each job, and find hiring managers to contact.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
