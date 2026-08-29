"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Mail, Users, Eye, MousePointerClick, Briefcase, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setData(null); }
        else { setData(d); }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded" />)}</div></div></div>;
  if (error) return <div className="p-8 text-muted-foreground">Failed to load analytics: {error}</div>;
  if (!data || !data.overview) return <div className="p-8 text-muted-foreground">No analytics data available</div>;

  const { overview, chartData = [], byStatus = [], topCompanies = [] } = data;
  const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your job application performance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: overview.totalApplications, icon: Briefcase, color: "text-orange-500" },
          { label: "Applications Today", value: overview.applicationsToday, icon: TrendingUp, color: "text-blue-500" },
          { label: "This Week", value: overview.applicationsThisWeek, icon: BarChart3, color: "text-green-500" },
          { label: "This Month", value: overview.applicationsThisMonth, icon: Target, color: "text-purple-500" },
          { label: "Response Rate", value: `${overview.responseRate}%`, icon: Mail, color: "text-emerald-500" },
          { label: "Interview Rate", value: `${overview.interviewRate}%`, icon: Users, color: "text-cyan-500" },
          { label: "Email Open Rate", value: `${overview.emailOpenRate}%`, icon: Eye, color: "text-amber-500" },
          { label: "Email Click Rate", value: `${overview.emailClickRate}%`, icon: MousePointerClick, color: "text-rose-500" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Over Time */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader><CardTitle className="text-sm">Applications Over Time (30 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} name="Sent" />
                <Line type="monotone" dataKey="responded" stroke="#10b981" strokeWidth={2} name="Responded" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader><CardTitle className="text-sm">Application Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader><CardTitle className="text-sm">Top Companies Applied To</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCompanies}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="company" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Email Performance */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader><CardTitle className="text-sm">Email Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-orange-500">{overview.totalEmailsOpened}</p>
                <p className="text-sm text-muted-foreground">Emails Opened</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-blue-500">{overview.totalEmailsClicked}</p>
                <p className="text-sm text-muted-foreground">Emails Clicked</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-green-500">{overview.responseRate}%</p>
                <p className="text-sm text-muted-foreground">Response Rate</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-purple-500">{overview.savedJobs}</p>
                <p className="text-sm text-muted-foreground">Saved Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
