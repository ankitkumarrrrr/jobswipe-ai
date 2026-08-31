"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Briefcase, Sparkles, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const steps = [
  { title: "Upload Your Resume", subtitle: "Let AI extract your skills automatically", icon: Upload },
  { title: "Set Job Preferences", subtitle: "Tell us what you're looking for", icon: Briefcase },
  { title: "How Swiping Works", subtitle: "Quick guide to finding your dream job", icon: Sparkles },
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    jobTitle: "",
    location: "",
    salaryMin: "",
    remote: false,
  });
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("/api/resume/upload", { method: "POST", body: formData });
      if (res.ok) toast.success("Resume uploaded! AI is extracting your skills...");
      else toast.error("Upload failed. You can do this later in Settings.");
    } catch { toast.error("Upload failed. You can do this later."); }
    setLoading(false);
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredRole: preferences.jobTitle,
          preferredLocation: preferences.location,
          expectedSalary: preferences.salaryMin,
          remotePreference: preferences.remote,
        }),
      });
      toast.success("Preferences saved!");
    } catch {}
    setLoading(false);
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_complete", "true");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#111827] to-[#030712] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? "bg-green-500 text-white" : i === step ? "bg-blue-600 text-white" : "bg-white/10 text-gray-500"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? "bg-green-500" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          {/* Step 0: Upload Resume */}
          {step === 0 && (
            <div className="space-y-6 text-center">
              <Upload className="h-12 w-12 text-blue-400 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-white">Upload Your Resume</h2>
                <p className="text-gray-400 mt-2">AI will extract your skills, experience, and education automatically.</p>
              </div>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-blue-500/50 transition-colors">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" id="resume-upload" />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  {loading ? (
                    <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-white font-medium">Click to upload</p>
                      <p className="text-gray-500 text-sm mt-1">PDF, DOC, or DOCX (max 5MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Step 1: Job Preferences */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <Briefcase className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white">Job Preferences</h2>
                <p className="text-gray-400 mt-1">Help AI find the best matches for you.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-300 text-sm">Job Title</Label>
                  <Input placeholder="e.g. Frontend Developer" value={preferences.jobTitle}
                    onChange={e => setPreferences(p => ({ ...p, jobTitle: e.target.value }))}
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-gray-500" />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Location</Label>
                  <Input placeholder="e.g. Bangalore, Mumbai" value={preferences.location}
                    onChange={e => setPreferences(p => ({ ...p, location: e.target.value }))}
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-gray-500" />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Expected Salary (₹/month)</Label>
                  <Input placeholder="e.g. 50000" value={preferences.salaryMin}
                    onChange={e => setPreferences(p => ({ ...p, salaryMin: e.target.value }))}
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-gray-500" />
                </div>
                <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                  <input type="checkbox" checked={preferences.remote}
                    onChange={e => setPreferences(p => ({ ...p, remote: e.target.checked }))}
                    className="rounded border-white/20 bg-white/5" />
                  Open to remote work
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Tutorial */}
          {step === 2 && (
            <div className="space-y-6 text-center">
              <Sparkles className="h-12 w-12 text-blue-400 mx-auto" />
              <h2 className="text-2xl font-bold text-white">How Swiping Works</h2>

              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04]">
                  <span className="text-2xl">👉</span>
                  <div>
                    <p className="text-white font-medium">Swipe Right = Apply</p>
                    <p className="text-gray-400 text-sm">AI sends your customized resume + cover letter to the recruiter</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04]">
                  <span className="text-2xl">👈</span>
                  <div>
                    <p className="text-white font-medium">Swipe Left = Skip</p>
                    <p className="text-gray-400 text-sm">Not interested? Just skip to the next job</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04]">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-white font-medium">Track Everything</p>
                    <p className="text-gray-400 text-sm">See when recruiters open your email and respond</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.04]">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="text-white font-medium">AI Does the Work</p>
                    <p className="text-gray-400 text-sm">Cover letters, resume customization, and email outreach — all automated</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-gray-400">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            ) : <div />}

            {step < steps.length - 1 ? (
              <Button onClick={() => {
                if (step === 1) handleSavePreferences();
                setStep(s => s + 1);
              }} className="bg-blue-600 hover:bg-blue-500 text-white">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-500 text-white">
                Start Swiping! 🚀
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
