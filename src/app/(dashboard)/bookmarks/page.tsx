"use client";

import { useState, useEffect } from "react";
import { Bookmark, MapPin, Building2, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BookmarkJob {
  bookmarkId: string;
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  jobType: string;
  isRemote: boolean;
  bookmarkedAt: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch("/api/bookmarks");
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch {}
    setLoading(false);
  };

  const removeBookmark = async (jobId: string) => {
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks(prev => prev.filter(b => b.id !== jobId));
        toast.success("Removed from saved jobs");
      }
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Jobs</h1>
        <p className="text-gray-500 text-sm mt-1">Jobs you&apos;ve bookmarked for later</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Bookmark className="h-12 w-12 mb-3 text-gray-300" />
          <p className="font-medium">No saved jobs yet</p>
          <p className="text-sm">Bookmark jobs from the Jobs page to save them here</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                        {job.company?.[0] || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{job.title}</p>
                        <p className="text-xs text-gray-500 truncate">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px]">{job.jobType}</Badge>
                      {job.isRemote && <Badge variant="outline" className="text-[10px] text-green-600">Remote</Badge>}
                    </div>

                    {(job.salaryMin || job.salaryMax) && (
                      <p className="text-xs text-gray-500 mt-2">
                        ₹{job.salaryMin || "?"} - ₹{job.salaryMax || "?"}
                      </p>
                    )}
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => removeBookmark(job.id)} className="text-gray-400 hover:text-red-500 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-[#1c1c1f]">
                  <span className="text-[10px] text-gray-400">
                    Saved {new Date(job.bookmarkedAt).toLocaleDateString()}
                  </span>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => window.location.href = "/jobs"}>
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
