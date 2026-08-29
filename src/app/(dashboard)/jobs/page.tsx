"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Filter, Bookmark, History, Sparkles, ExternalLink,
  Loader2, CheckCircle, Mail, FileText, Send, X, AlertTriangle,
  LinkIcon, Globe, RefreshCw, Zap, Users,
} from "lucide-react";
import SwipeStack from "@/components/swipe-stack";
import { toast } from "sonner";

const tabs = [
  { id: "swipe", label: "Swipe", icon: Sparkles },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "history", label: "History", icon: History },
];

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState("swipe");
  const [likedJobs, setLikedJobs] = useState<string[]>([]);
  const [dislikedJobs, setDislikedJobs] = useState<string[]>([]);
  const [automating, setAutomating] = useState<string | null>(null);
  const [automationResult, setAutomationResult] = useState<any>(null);
  const [automationStep, setAutomationStep] = useState(0);
  const [realJobs, setRealJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("software engineer");
  const [searchLocation, setSearchLocation] = useState("India");
  const [searching, setSearching] = useState(false);
  const [scrapeStats, setScrapeStats] = useState<{ total: number; sources: string[] }>({ total: 0, sources: [] });

  const automationSteps = [
    { icon: Search, label: "Finding real recruiter contacts..." },
    { icon: FileText, label: "Customizing resume with AI..." },
    { icon: FileText, label: "Generating cover letter..." },
    { icon: Mail, label: "Drafting personalized emails..." },
    { icon: Send, label: "Sending emails to recruiters..." },
  ];

  // Auto-load jobs on mount
  useEffect(() => {
    loadRealJobs("software engineer", "India");
    loadPostedJobs();

    // Real-time polling: refresh posted jobs every 30 seconds
    const interval = setInterval(() => {
      loadPostedJobs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadRealJobs = async (keywords: string, location: string) => {
    setLoading(true);
    try {
      // Step 1: Load from database INSTANTLY
      const dbRes = await fetch(`/api/jobs/scrape?q=${encodeURIComponent(keywords)}&limit=30`);
      const dbData = await dbRes.json();

      if (dbData.jobs && dbData.jobs.length > 0) {
        const mapped = dbData.jobs.map((j: any) => ({
          id: j.id || `db_${Math.random()}`,
          title: j.title,
          company: j.company,
          location: j.location || "Remote",
          description: j.description || `${j.title} at ${j.company}`,
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          currency: "₹",
          url: j.url,
          matchScore: Math.floor(Math.random() * 15) + 80,
          source: j.source || "database",
          postedAt: j.postedAt ? new Date(j.postedAt).toLocaleDateString() : "Recent",
        }));
        setRealJobs(mapped);
        setLoading(false);
        toast.success(`Loaded ${mapped.length} real jobs from database`);
      } else {
        setLoading(false);
      }

      // Step 2: Search for FRESH jobs in background (non-blocking)
      setSearching(true);
      fetch("/api/jobs/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, location }),
      })
        .then(r => r.json())
        .then(freshData => {
          if (freshData.jobs && freshData.jobs.length > 0) {
            const freshMapped = freshData.jobs.map((j: any, i: number) => ({
              id: `fresh_${Date.now()}_${i}`,
              title: j.title,
              company: j.company,
              location: j.location || "Remote",
              description: j.description || `${j.title} at ${j.company}`,
              salaryMin: j.salaryMin,
              url: j.url,
              matchScore: Math.floor(Math.random() * 15) + 80,
              source: j.source || "web",
              postedAt: "Just now",
            }));
            setRealJobs(prev => [...freshMapped, ...prev]);
            toast.success(`Found ${freshData.total} fresh jobs from ${freshData.sources?.join(", ") || "web"}`);
          }
        })
        .catch(() => { /* background search failed, DB jobs still available */ })
        .finally(() => setSearching(false));
    } catch (e) {
      console.error("Failed to load jobs:", e);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return toast.error("Enter search keywords");
    setRealJobs([]);
    loadRealJobs(searchQuery, searchLocation);
  };

  const handleAutoScrape = async () => {
    setSearching(true);
    toast.info("🤖 AI is searching all job boards...");
    try {
      const res = await fetch("/api/jobs/auto-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: searchQuery, location: searchLocation }),
      });
      const data = await res.json();
      if (data.success) {
        setScrapeStats({ total: data.total, sources: data.sources });
        toast.success(`Found ${data.total} jobs from ${data.sources.join(", ")}`, {
          description: `${data.saved} new jobs saved to database`,
          duration: 5000,
        });
        loadRealJobs(searchQuery, searchLocation);
      } else {
        toast.error(data.error || "Scraping failed");
      }
    } catch (e) {
      toast.error("Scraping failed");
    }
    setSearching(false);
  };

  // Load freelancer-posted jobs
  const loadPostedJobs = async () => {
    try {
      const res = await fetch("/api/jobs/post?limit=30");
      const data = await res.json();
      if (data.jobs && data.jobs.length > 0) {
        const posted = data.jobs.map((j: any) => ({
          id: `posted_${j.id}`,
          title: j.title,
          company: j.company,
          location: j.location || "Remote",
          description: j.description,
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          currency: j.currency === "INR" ? "₹" : j.currency === "USD" ? "$" : j.currency,
          url: null,
          matchScore: Math.floor(Math.random() * 15) + 80,
          source: "freelancer",
          postedAt: new Date(j.createdAt).toLocaleDateString(),
          contactEmail: j.contactEmail,
          contactPhone: j.contactPhone,
          contactLinkedin: j.contactLinkedin,
          jobType: j.jobType,
          isRemote: j.isRemote,
          postedBy: j.postedBy,
          originalId: j.id,
        }));
        setRealJobs(prev => [...posted, ...prev]);
      }
    } catch (e) {
      console.error("Failed to load posted jobs:", e);
    }
  };

  const allJobs = realJobs;
  const availableJobs = allJobs.filter(
    (j) => !likedJobs.includes(j.id) && !dislikedJobs.includes(j.id)
  );

  const handleSwipe = useCallback(
    async (jobId: string, action: "LIKE" | "DISLIKE") => {
      if (action === "LIKE") {
        const job = allJobs.find((j) => j.id === jobId);
        if (!job) return;
        setLikedJobs((prev) => [...prev, jobId]);
        setAutomating(jobId);
        setAutomationStep(0);
        const stepInterval = setInterval(() => {
          setAutomationStep((prev) => Math.min(prev + 1, automationSteps.length - 1));
        }, 2500);
        toast.success(`Applied to ${job.company}!`, { description: "AI is auto-sending emails to recruiters..." });
        try {
          const res = await fetch("/api/automation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId: job.id,
              jobTitle: job.title,
              company: job.company,
              jobDescription: job.description,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              location: job.location,
              source: job.source,
            }),
          });
          const data = await res.json();
          clearInterval(stepInterval);
          if (data.success) {
            setAutomationResult(data);
            setAutomationStep(automationSteps.length);
            const emailCount = data.contacts?.filter((c: any) => c.emailSent).length || 0;
            toast.success(`AI sent ${emailCount} emails!`, { description: data.message, duration: 6000 });
          } else {
            toast.error("Automation failed", { description: data.error || "Try again" });
          }
        } catch { clearInterval(stepInterval); toast.error("Network error"); }
        finally { setAutomating(null); }
      } else {
        setDislikedJobs((prev) => [...prev, jobId]);
      }
    },
    [allJobs]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Find Real Jobs</h1>
          <p className="text-gray-500 mt-1">AI auto-sends emails to recruiters when you swipe right</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700">{likedJobs.length} Applied</Badge>
          <Badge className="bg-orange-100 text-orange-700">{availableJobs.length} Jobs</Badge>
        </div>
      </div>

      {/* Job Search */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/5 dark:to-amber-500/5 border-orange-200 dark:border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">Live Job Search</h3>
            <Badge className="bg-green-100 text-green-700 text-xs">Real-time</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Input placeholder="What job? (e.g., React Developer, Software Engineer, Marketing Manager)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <Input placeholder="Where? (e.g., Bangalore, Remote, Mumbai)" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} className="w-48" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <Button onClick={handleSearch} disabled={searching} className="bg-orange-500 hover:bg-orange-600">
              {searching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</> : <><Search className="w-4 h-4 mr-2" />Search</>}
            </Button>
            <Button onClick={handleAutoScrape} disabled={searching} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              {searching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping...</> : <><Zap className="w-4 h-4 mr-2" />Auto-Scrape</>}
            </Button>
            <Button onClick={handleSearch} variant="outline" disabled={searching}><RefreshCw className="w-4 h-4" /></Button>
          </div>
          {realJobs.length > 0 && (
            <div className="flex items-center gap-4 mt-2 text-xs text-orange-600">
              <span>✅ {realJobs.length} real jobs loaded</span>
              <span>•</span>
              <span>Sources: {[...new Set(realJobs.map(j => j.source))].join(", ")}</span>
              {scrapeStats.total > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600">🤖 Auto-scraped: {scrapeStats.total} from {scrapeStats.sources.join(", ")}</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white dark:bg-gray-700 text-foreground shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>
        <Badge className="bg-emerald-100 text-emerald-700">
          <Users className="h-3 w-3 mr-1" />
          {realJobs.filter(j => j.source === "freelancer").length} Direct Posts
        </Badge>
      </div>

      {activeTab === "swipe" && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex justify-center py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                <p className="text-gray-500">Loading real jobs...</p>
              </div>
            ) : availableJobs.length === 0 ? (
              <div className="text-center py-20">
                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No more jobs to swipe</h3>
                <p className="text-gray-500 mb-4">Search for different keywords to find more jobs</p>
                <Button onClick={handleSearch} className="bg-orange-500 hover:bg-orange-600"><RefreshCw className="w-4 h-4 mr-2" />Load More Jobs</Button>
              </div>
            ) : (
              <SwipeStack jobs={availableJobs} onSwipe={handleSwipe} />
            )}
          </div>

          {automating && (
            <Card className="lg:w-96 bg-gradient-to-b from-violet-50 to-indigo-50 dark:from-violet-500/5 dark:to-indigo-500/5 border-violet-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4"><Loader2 className="h-5 w-5 text-violet-500 animate-spin" /><h3 className="font-semibold">AI Auto-Sending...</h3></div>
                <p className="text-xs text-gray-500 mb-4">AI is finding real recruiters, generating emails, and sending them automatically.</p>
                <div className="space-y-3">
                  {automationSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {i < automationStep ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : i === automationStep ? <Loader2 className="h-4 w-4 text-violet-500 animate-spin shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />}
                      <span className={`text-sm ${i === automationStep ? "text-violet-600 font-medium" : i < automationStep ? "text-gray-400 line-through" : "text-gray-500"}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {automationResult && !automating && (
            <Card className="lg:w-[420px] bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-500/5 dark:to-emerald-500/5 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><h3 className="font-semibold">Emails Sent Automatically!</h3></div>
                  <Button variant="ghost" size="icon" onClick={() => setAutomationResult(null)}><X className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{automationResult.message}</p>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2"><Send className="w-4 h-4 text-green-500" />Auto-Sent to:</h4>
                  {automationResult.contacts?.map((contact: any, i: number) => (
                    <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{contact.recipient}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{contact.title}</Badge>
                          {contact.emailSent && <Badge className="text-xs bg-green-100 text-green-700"><Send className="h-3 w-3 mr-1" />Sent</Badge>}
                        </div>
                      </div>
                      {contact.emailSubject && <p className="text-xs text-gray-500">Subject: {contact.emailSubject}</p>}
                      {contact.linkedinMessage && <p className="text-xs text-gray-500 mt-1 border-l-2 border-violet-300 pl-2">{contact.linkedinMessage}</p>}
                      {contact.linkedinSearchUrl && <a href={contact.linkedinSearchUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="h-7 text-xs gap-1 mt-2"><LinkIcon className="h-3 w-3" /> Find on LinkedIn</Button></a>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {automationResult.customizedResume && <Button variant="outline" className="w-full gap-2"><FileText className="h-4 w-4" /> View Customized Resume</Button>}
                  <Button variant="outline" className="w-full gap-2" onClick={() => setAutomationResult(null)}><Sparkles className="h-4 w-4" /> Continue Swiping</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {likedJobs.length === 0 ? (
            <div className="col-span-full text-center py-20"><Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold mb-1">No saved jobs yet</h3><p className="text-gray-500 text-sm">Swipe right to save jobs.</p></div>
          ) : allJobs.filter((j) => likedJobs.includes(j.id)).map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow"><CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-sm font-bold text-green-600">{job.company?.[0] || "?"}</div>
                <div className="flex-1 min-w-0"><h3 className="font-semibold text-sm">{job.title}</h3><p className="text-xs text-gray-500">{job.company}</p></div>
                <Badge className="bg-green-100 text-green-700">Applied</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500"><span>{job.location}</span><span>·</span><span>{job.source}</span></div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <Card><CardContent className="p-0"><div className="divide-y">
          {allJobs.slice(0, 20).map((job) => (
            <div key={job.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-violet-600">{job.company?.[0] || "?"}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium">{job.title}</p><p className="text-xs text-gray-500">{job.company} · {job.location}</p></div>
              {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer"><Badge variant="outline" className="text-xs cursor-pointer"><ExternalLink className="h-3 w-3 mr-1" /> View</Badge></a>}
            </div>
          ))}
        </div></CardContent></Card>
      )}
    </div>
  );
}
