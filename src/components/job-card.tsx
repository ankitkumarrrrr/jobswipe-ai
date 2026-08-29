"use client";

import {
  MapPin,
  DollarSign,
  Building2,
  ExternalLink,
  Star,
  Clock,
  Users,
  Mail,
  Phone,
  Link,
  Briefcase,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salaryMin: number;
    salaryMax: number;
    currency: string;
    description: string;
    matchScore: number;
    source: string;
    postedAt: string;
    contactEmail?: string;
    contactPhone?: string;
    contactLinkedin?: string;
    jobType?: string;
    isRemote?: boolean;
    postedBy?: string;
  };
  style?: React.CSSProperties;
}

export default function JobCard({ job, style }: JobCardProps) {
  const isFreelancerPosted = job.source === "freelancer";

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500 bg-green-50 dark:bg-green-500/10";
    if (score >= 75) return "text-violet-500 bg-violet-50 dark:bg-violet-500/10";
    if (score >= 60)
      return "text-amber-500 bg-amber-50 dark:bg-amber-500/10";
    return "text-gray-500 bg-gray-50 dark:bg-gray-500/10";
  };

  const formatSalary = (min: any, max: any, currency: string) => {
    if (!min && !max) return "Competitive";
    const toNum = (v: any) => {
      if (!v) return 0;
      const str = String(v).replace(/[^0-9]/g, '');
      const n = parseInt(str) || 0;
      if (n > 100000000) return 0;
      return n;
    };
    const n1 = toNum(min);
    const n2 = toNum(max);
    if (!n1 && !n2) return "Competitive";
    const fmt = (n: number) => {
      if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
      if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
      return String(n);
    };
    if (n1 && n2) return `${currency} ${fmt(n1)} - ${fmt(n2)}`;
    if (n1) return `${currency} ${fmt(n1)}+`;
    return "Competitive";
  };

  return (
    <Card
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none overflow-hidden"
      style={style}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header with gradient */}
        <div className={`relative p-6 text-white ${isFreelancerPosted ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-violet-600 to-indigo-700'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                {job.company[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold">{job.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-white/70" />
                  <span className="text-white/90">{job.company}</span>
                </div>
              </div>
            </div>
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${getScoreColor(job.matchScore)}`}
            >
              <Star className="h-4 w-4" />
              {job.matchScore}%
            </div>
          </div>

          {/* Freelancer Posted Badge */}
          {isFreelancerPosted && (
            <div className="mt-3 flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                <Users className="h-3 w-3 mr-1" />
                Posted by {job.postedBy || "Recruiter"}
              </Badge>
              {job.jobType && (
                <Badge className="bg-white/20 text-white border-white/30 capitalize">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {job.jobType}
                </Badge>
              )}
              {job.isRemote && (
                <Badge className="bg-white/20 text-white border-white/30">
                  🌍 Remote
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-5 overflow-auto">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 text-violet-500" />
              {job.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <DollarSign className="h-4 w-4 text-green-500" />
              {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 text-blue-500" />
              {job.postedAt}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Badge variant="outline" className="text-xs">
                {isFreelancerPosted ? "🟢 Direct Post" : job.source}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold mb-2">About the Role</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-6">
              {job.description}
            </p>
          </div>

          {/* Contact Info for Freelancer Posted Jobs */}
          {isFreelancerPosted && (job.contactEmail || job.contactPhone || job.contactLinkedin) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-100 dark:border-emerald-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Contact Recruiter Directly
                </span>
              </div>
              <div className="space-y-2">
                {job.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <a href={`mailto:${job.contactEmail}`} className="text-emerald-600 hover:underline">
                      {job.contactEmail}
                    </a>
                  </div>
                )}
                {job.contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <a href={`tel:${job.contactPhone}`} className="text-emerald-600 hover:underline">
                      {job.contactPhone}
                    </a>
                  </div>
                )}
                {job.contactLinkedin && (
                  <div className="flex items-center gap-2 text-sm">
                    <Link className="h-3 w-3 text-gray-400" />
                    <a href={job.contactLinkedin} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      View LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match Info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-500/5 dark:to-indigo-500/5 border border-violet-100 dark:border-violet-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">
                {isFreelancerPosted ? "Recruiter Match" : "AI Match Analysis"}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {isFreelancerPosted
                ? `This job was posted directly by ${job.postedBy || "a recruiter"}. Swipe right to apply and they will contact you directly.`
                : "This job matches your skills in React, TypeScript, and Node.js. Your experience at similar startups makes you a strong candidate."}
            </p>
          </div>
        </div>

        {/* Swipe Indicators */}
        <div className="absolute top-4 left-4 opacity-0 transition-opacity pointer-events-none">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-xl font-bold rotate-[-20deg] border-2 border-red-400">
            SKIP
          </div>
        </div>
        <div className="absolute top-4 right-4 opacity-0 transition-opacity pointer-events-none">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg text-xl font-bold rotate-[20deg] border-2 border-green-400">
            APPLY
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
