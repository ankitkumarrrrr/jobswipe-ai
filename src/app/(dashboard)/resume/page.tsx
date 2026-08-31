"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, CheckCircle2, Sparkles, Download, Trash2,
  Loader2, AlertCircle, User, Briefcase, GraduationCap, Target,
} from "lucide-react";
import { toast } from "sonner";

interface ParsedData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; duration: string; description: string }[];
  education: { degree: string; institution: string; year: string }[];
  goals: string;
}

export default function ResumePage() {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "parsing" | "done" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/resume").then(r => r.json()).then(data => {
      if (data.resume?.parsedData) {
        setParsedData(data.resume.parsedData);
        setFileName(data.resume.fileName);
        setUploadState("done");
      }
    }).catch(() => {});
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const processFile = async (file: File) => {
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Please upload a PDF or DOCX file" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Please upload a file smaller than 10MB" });
      return;
    }

    setFileName(file.name);
    setUploadState("uploading");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      setUploadState("parsing");

      const res = await fetch("/api/resume", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setParsedData(data.parsedData);
      setUploadState("done");
      toast.success("Resume parsed successfully!", {
        description: `AI extracted ${data.parsedData.skills?.length || 0} skills, ${data.parsedData.experience?.length || 0} experiences`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrorMsg(error.message || "Upload failed");
      setUploadState("error");
      toast.error("Upload failed", { description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume</h1>
        <p className="text-gray-500 mt-1">Upload your resume and let AI extract your profile</p>
      </div>

      {uploadState !== "done" ? (
        <Card>
          <CardContent className="p-0">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl m-4 p-12 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-500/5"
                  : "border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 dark:border-gray-800"
              }`}
            >
              {/* File input - positioned to be clickable */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: 10 }}
                onChange={(e) => {
                  if (e.target.files?.[0]) processFile(e.target.files[0]);
                }}
              />

              {uploadState === "idle" && (
                <div className="relative pointer-events-none">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/10 dark:to-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-violet-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Drop your resume here</h3>
                  <p className="text-gray-500 text-sm mb-4">or click to browse files</p>
                  <p className="text-xs text-gray-400 mb-6">Supports PDF and DOCX files up to 10MB</p>
                  <Button type="button" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white pointer-events-none">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File from Device
                  </Button>
                </div>
              )}

              {(uploadState === "uploading" || uploadState === "parsing") && (
                <div className="relative pointer-events-none">
                  <Loader2 className="h-12 w-12 text-violet-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {uploadState === "uploading" ? "Uploading resume..." : "AI is analyzing your resume..."}
                  </h3>
                  <p className="text-gray-500 text-sm">Extracting skills, experience, and career goals</p>
                  <div className="mt-4 max-w-xs mx-auto">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: uploadState === "uploading" ? "40%" : "80%" }} />
                    </div>
                  </div>
                </div>
              )}

              {uploadState === "error" && (
                <div className="relative pointer-events-none">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
                  <p className="text-gray-500 text-sm mb-4">{errorMsg || "Please try again"}</p>
                  <Button type="button" variant="outline" className="pointer-events-auto" onClick={(e) => {
                    e.stopPropagation();
                    setUploadState("idle");
                    setErrorMsg(null);
                  }}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : parsedData ? (
        <>
          <Card className="border-green-200 bg-green-50/50 dark:border-green-500/20 dark:bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{fileName}</p>
                <p className="text-xs text-gray-500">Resume parsed successfully · {parsedData.skills?.length || 0} skills extracted</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700"><Sparkles className="h-3 w-3 mr-1" />Parsed</Badge>
                <Button variant="outline" size="sm" onClick={() => window.open("/api/resume/download", "_blank")}>
                  <Download className="h-4 w-4 mr-1" />Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setUploadState("idle"); setFileName(null); setParsedData(null); }}>
                  <Trash2 className="h-4 w-4 mr-1" />Remove
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" />AI-Extracted Summary</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-gray-600 dark:text-gray-400">{parsedData.summary}</p></CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-violet-500" />Skills</CardTitle></CardHeader>
              <CardContent><div className="flex flex-wrap gap-2">{(parsedData.skills || []).map(skill => (
                <Badge key={skill} className="bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">{skill}</Badge>
              ))}</div></CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-violet-500" />Contact</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{parsedData.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{parsedData.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{parsedData.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium">{parsedData.location}</span></div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-violet-500" />Experience</CardTitle></CardHeader>
              <CardContent className="space-y-4">{(parsedData.experience || []).map((exp, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-violet-600 shrink-0">{(exp.company || "?")[0]}</div>
                  <div>
                    <p className="font-semibold text-sm">{exp.title}</p>
                    <p className="text-xs text-gray-500">{exp.company} · {exp.duration}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exp.description}</p>
                  </div>
                </div>
              ))}</CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-violet-500" />Education</CardTitle></CardHeader>
              <CardContent>{(parsedData.education || []).map((edu, i) => (
                <div key={i}><p className="font-semibold text-sm">{edu.degree}</p><p className="text-xs text-gray-500">{edu.institution} · {edu.year}</p></div>
              ))}</CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-violet-500" />Career Goals</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-gray-600 dark:text-gray-400">{parsedData.goals}</p></CardContent>
            </Card>
          </div>

          <Card className="border-green-200 bg-green-50/50 dark:border-green-500/20 dark:bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-semibold text-sm text-green-700">Profile Auto-Filled!</p>
              </div>
              <p className="text-xs text-green-600 ml-8">Your name, email, phone, skills, experience, and education have been automatically added to your profile.</p>
              <div className="ml-8 mt-2">
                <Button variant="link" className="h-auto p-0 text-green-700" onClick={() => window.location.href = "/settings"}>View in Settings →</Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Download Original</Button>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white gap-2" onClick={() => window.location.href = "/jobs"}>
              <Sparkles className="h-4 w-4" />Start Finding Jobs
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
