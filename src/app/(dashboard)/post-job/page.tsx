"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, Plus, Trash2, Eye, Users, MapPin, DollarSign,
  Loader2, CheckCircle, Edit3, ExternalLink, Mail, Phone, Link,
} from "lucide-react";
import { toast } from "sonner";

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  jobType: string;
  description: string;
  requirements: string[];
  contactEmail: string;
  contactPhone: string;
  contactLinkedin: string;
  isRemote: boolean;
  views: number;
  applications: number;
  postedBy: string;
  createdAt: string;
}

export default function PostJobPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myJobs, setMyJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [editingJob, setEditingJob] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    currency: "INR",
    jobType: "full-time",
    description: "",
    requirements: "",
    contactEmail: "",
    contactPhone: "",
    contactLinkedin: "",
    isRemote: false,
  });

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const res = await fetch("/api/jobs/post?mine=true");
      const data = await res.json();
      setMyJobs(data.jobs || []);
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
    }
    setLoadingJobs(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.company || !form.description) {
      toast.error("Please fill in title, company, and description");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/post", {
        method: editingJob ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: editingJob,
          requirements: form.requirements.split(",").map((r) => r.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingJob ? "Job updated!" : "Job posted! It will appear in users' swipe feed.");
        setShowForm(false);
        setEditingJob(null);
        resetForm();
        fetchMyJobs();
      } else {
        toast.error(data.error || "Failed to post job");
      }
    } catch (e) {
      toast.error("Failed to post job");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      const res = await fetch(`/api/jobs/post?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Job deleted");
        fetchMyJobs();
      }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (job: JobPosting) => {
    setForm({
      title: job.title,
      company: job.company,
      location: job.location || "",
      salaryMin: job.salaryMin || "",
      salaryMax: job.salaryMax || "",
      currency: job.currency || "INR",
      jobType: job.jobType || "full-time",
      description: job.description,
      requirements: (job.requirements || []).join(", "),
      contactEmail: job.contactEmail || "",
      contactPhone: job.contactPhone || "",
      contactLinkedin: job.contactLinkedin || "",
      isRemote: job.isRemote,
    });
    setEditingJob(job.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      title: "",
      company: "",
      location: "",
      salaryMin: "",
      salaryMax: "",
      currency: "INR",
      jobType: "full-time",
      description: "",
      requirements: "",
      contactEmail: "",
      contactPhone: "",
      contactLinkedin: "",
      isRemote: false,
    });
  };

  const stats = {
    totalJobs: myJobs.length,
    totalViews: myJobs.reduce((s, j) => s + j.views, 0),
    totalApps: myJobs.reduce((s, j) => s + j.applications, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Post a Job</h1>
          <p className="text-gray-500 mt-1">Post jobs and reach thousands of talented candidates</p>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); setEditingJob(null); resetForm(); }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancel" : "Post New Job"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Briefcase className="h-6 w-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalJobs}</p>
            <p className="text-xs text-gray-500">Jobs Posted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalViews}</p>
            <p className="text-xs text-gray-500">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalApps}</p>
            <p className="text-xs text-gray-500">Applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Job Posting Form */}
      {showForm && (
        <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-500/20 dark:bg-violet-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-500" />
              {editingJob ? "Edit Job Posting" : "New Job Posting"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title *</label>
                <Input
                  placeholder="e.g. Senior Frontend Developer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company *</label>
                <Input
                  placeholder="e.g. TechCorp Inc."
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g. Bangalore, India"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Type</label>
                <select
                  className="w-full p-2 border rounded-lg text-sm"
                  value={form.jobType}
                  onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <select
                  className="w-full p-2 border rounded-lg text-sm"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Salary</label>
                <Input
                  placeholder="e.g. 500000"
                  value={form.salaryMin}
                  onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum Salary</label>
                <Input
                  placeholder="e.g. 1200000"
                  value={form.salaryMax}
                  onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Description *</label>
              <textarea
                className="w-full p-3 border rounded-lg text-sm min-h-[120px]"
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Requirements (comma-separated)</label>
              <Input
                placeholder="e.g. React, TypeScript, 3+ years experience"
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 rounded-xl">
              <p className="text-sm font-medium text-blue-700 mb-3">Contact Information (for candidates to reach you)</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Phone"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="LinkedIn URL"
                    value={form.contactLinkedin}
                    onChange={(e) => setForm({ ...form, contactLinkedin: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRemote}
                  onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Remote-friendly</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); setEditingJob(null); }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {editingJob ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Posted Jobs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">My Posted Jobs</h2>
        {loadingJobs ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto" />
          </div>
        ) : myJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No jobs posted yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Post New Job" to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                        {job.isRemote && <Badge className="bg-blue-100 text-blue-700 text-xs">Remote</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">
                        {job.company} · {job.location || "Location not specified"} · {job.jobType}
                      </p>
                      {(job.salaryMin || job.salaryMax) && (
                        <p className="text-sm text-green-600 mt-1">
                          {job.salaryMin && job.salaryMax
                            ? `${job.currency === "INR" ? "₹" : job.currency === "USD" ? "$" : job.currency} ${job.salaryMin} - ${job.salaryMax}`
                            : job.salaryMin
                            ? `From ${job.currency === "INR" ? "₹" : "$"} ${job.salaryMin}`
                            : `Up to ${job.currency === "INR" ? "₹" : "$"} ${job.salaryMax}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{job.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {job.views} views</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {job.applications} applicants</span>
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(job)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(job.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
