"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpRight } from "lucide-react";

const applications = [
  { id: "1", company: "Google", position: "Senior Frontend Engineer", status: "INTERVIEW", sentAt: "2026-08-27", matchScore: 94, coverLetter: true, linkedinSent: true, emailSent: true },
  { id: "2", company: "Microsoft", position: "Full Stack Developer", status: "VIEWED", sentAt: "2026-08-26", matchScore: 88, coverLetter: true, linkedinSent: true, emailSent: true },
  { id: "3", company: "Amazon", position: "Software Development Engineer", status: "RESPONDED", sentAt: "2026-08-25", matchScore: 91, coverLetter: true, linkedinSent: false, emailSent: true },
  { id: "4", company: "Stripe", position: "Backend Engineer", status: "SENT", sentAt: "2026-08-24", matchScore: 85, coverLetter: true, linkedinSent: true, emailSent: true },
  { id: "5", company: "Netflix", position: "Senior UI Engineer", status: "REJECTED", sentAt: "2026-08-22", matchScore: 82, coverLetter: true, linkedinSent: true, emailSent: true },
  { id: "6", company: "Flipkart", position: "React Native Developer", status: "SENT", sentAt: "2026-08-23", matchScore: 79, coverLetter: true, linkedinSent: false, emailSent: true },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-purple-100 text-purple-700",
  RESPONDED: "bg-green-100 text-green-700",
  INTERVIEW: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      searchQuery === "" ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === null || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts: Record<string, number> = {};
  applications.forEach((app) => {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Applications</h1>
        <p className="text-gray-500 mt-1">Track all your AI-sent applications in one place</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.keys(statusColors).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? null : status)}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === status
                ? "border-violet-300 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/5"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-800"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`h-4 w-4 rounded-full ${statusColors[status]?.split(" ")[0] || "bg-gray-300"}`} />
              <span className="text-lg font-bold">{statusCounts[status] || 0}</span>
            </div>
            <p className="text-xs text-gray-500 capitalize">{status.toLowerCase()}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search applications..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Sort
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((app) => (
              <div key={app.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/10 dark:to-indigo-500/10 flex items-center justify-center text-lg font-bold text-violet-600 shrink-0">
                  {app.company[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{app.position}</p>
                    <Badge className={`text-xs shrink-0 ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>{app.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{app.company}</span>
                    <span>·</span>
                    <span>{app.sentAt}</span>
                    <span>·</span>
                    <span className="text-violet-500 font-medium">{app.matchScore}% match</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {app.coverLetter && <Badge variant="outline" className="text-xs">Cover Letter</Badge>}
                    {app.linkedinSent && <Badge variant="outline" className="text-xs">LinkedIn</Badge>}
                    {app.emailSent && <Badge variant="outline" className="text-xs">Email</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12"><p className="text-gray-500">No applications found</p></div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
