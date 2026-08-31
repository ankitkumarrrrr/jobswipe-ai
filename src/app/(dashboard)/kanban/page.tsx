"use client";

import { useState, useEffect, useRef } from "react";
import { GripVertical, ExternalLink, Calendar, Building2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KanbanJob {
  id: string;
  title: string;
  company: string;
  location?: string;
  status: string;
  createdAt: string;
  match?: number;
}

const columns = [
  { id: "APPLIED", label: "Applied", color: "bg-blue-500", lightColor: "bg-blue-100 dark:bg-blue-500/10" },
  { id: "VIEWED", label: "Viewed", color: "bg-amber-500", lightColor: "bg-amber-100 dark:bg-amber-500/10" },
  { id: "INTERVIEW", label: "Interview", color: "bg-purple-500", lightColor: "bg-purple-100 dark:bg-purple-500/10" },
  { id: "OFFER", label: "Offer", color: "bg-green-500", lightColor: "bg-green-100 dark:bg-green-500/10" },
  { id: "REJECTED", label: "Rejected", color: "bg-red-500", lightColor: "bg-red-100 dark:bg-red-500/10" },
];

export default function KanbanPage() {
  const [jobs, setJobs] = useState<KanbanJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/automation");
      const data = await res.json();
      if (data.applications) {
        const mapped = data.applications.map((a: any) => ({
          id: a.id,
          title: a.job?.title || "Unknown Position",
          company: a.job?.company || "Unknown",
          location: a.job?.location,
          status: a.status === "SENT" ? "APPLIED" : a.status,
          createdAt: a.createdAt,
          match: 85,
        }));
        setJobs(mapped);
      }
    } catch {}
    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedId) return;

    setJobs(prev => prev.map(j => j.id === draggedId ? { ...j, status: newStatus } : j));
    setDraggedId(null);
    setDragOverColumn(null);

    // Update in database
    try {
      await fetch("/api/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggedId, status: newStatus === "APPLIED" ? "SENT" : newStatus }),
      });
    } catch {}
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverColumn(null);
  };

  const getColumnJobs = (columnId: string) => jobs.filter(j => j.status === columnId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">Drag and drop jobs between columns to track your progress</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <Building2 className="h-12 w-12 mb-3 text-gray-300" />
          <p className="font-medium">No applications yet</p>
          <p className="text-sm">Start applying to jobs and they&apos;ll appear here</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {columns.map(col => {
            const colJobs = getColumnJobs(col.id);
            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-72 rounded-xl transition-colors ${
                  dragOverColumn === col.id ? "bg-blue-500/5 ring-2 ring-blue-500/30" : "bg-gray-100 dark:bg-[#111114]"
                }`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragLeave={() => setDragOverColumn(null)}
              >
                <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-[#1c1c1f]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="font-semibold text-sm">{col.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{colJobs.length}</Badge>
                </div>

                <div className="p-2 space-y-2 min-h-[200px]">
                  {colJobs.map(job => (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white dark:bg-[#161616] rounded-lg p-3 border border-gray-200 dark:border-[#1c1c1f] cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                        draggedId === job.id ? "opacity-50 scale-95" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{job.company}</span>
                          </div>
                          {job.location && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{job.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="text-[10px] bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">{job.match}% match</Badge>
                            <span className="text-[10px] text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colJobs.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
                      Drop jobs here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
