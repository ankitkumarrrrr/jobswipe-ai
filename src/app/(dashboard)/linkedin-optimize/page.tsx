"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, CheckCircle, ExternalLink, Target, Award, Users, Globe } from "lucide-react";

export default function LinkedInOptimizePage() {
  const [optimization, setOptimization] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<any>(null);
  const [form, setForm] = useState({ targetRole: "", currentHeadline: "", currentSummary: "", skills: "", experience: "" });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/linkedin-optimize").then(r => r.json()).then(d => { if (d.optimization) setSaved(d.optimization); }).catch(() => {});
  }, []);

  const optimize = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/linkedin-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.optimization) setOptimization(data.optimization);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const opt = optimization || (saved ? {
    headline: saved.headline,
    summary: saved.summary,
    skillsToAdd: JSON.parse(saved.skills || '[]'),
    experienceBullets: JSON.parse(saved.experience || '[]'),
    recommendations: JSON.parse(saved.recommendations || '[]'),
  } : null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LinkedIn Profile Optimizer</h1>
        <p className="text-muted-foreground">AI rewrites your LinkedIn headline, summary, and experience for maximum impact</p>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-500" />Optimize Your Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Target role (e.g., Senior Software Engineer at FAANG)" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} />
          <Input placeholder="Current headline (copy from LinkedIn)" value={form.currentHeadline} onChange={e => setForm({ ...form, currentHeadline: e.target.value })} />
          <textarea className="w-full p-3 bg-muted rounded-lg text-sm min-h-[60px]" placeholder="Current summary/about section..." value={form.currentSummary} onChange={e => setForm({ ...form, currentSummary: e.target.value })} />
          <Input placeholder="Your skills (comma separated)" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
          <textarea className="w-full p-3 bg-muted rounded-lg text-sm min-h-[60px]" placeholder="Your experience..." value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
          <Button onClick={optimize} disabled={loading || !form.targetRole} className="bg-orange-500 hover:bg-orange-600">
            {loading ? <><span className="animate-spin mr-2">⏳</span>Optimizing...</> : <><Sparkles className="w-4 h-4 mr-2" />Optimize Profile</>}
          </Button>
        </CardContent>
      </Card>

      {opt && (
        <div className="space-y-4">
          {/* Optimized Headline */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600" />Optimized Headline</CardTitle></CardHeader>
            <CardContent>
              <div className="relative bg-muted p-4 rounded-lg">
                <p className="font-medium">{opt.headline}</p>
                <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copy(opt.headline, 'headline')}>
                  {copied === 'headline' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Optimized Summary */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-orange-500" />Optimized Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="relative bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-line">{opt.summary}</p>
                <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copy(opt.summary, 'summary')}>
                  {copied === 'summary' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skills to Add */}
          {opt.skillsToAdd?.length > 0 && (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" />Skills to Add</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {opt.skillsToAdd.map((s: string, i: number) => <span key={i} className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-sm">{s}</span>)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experience Bullets */}
          {opt.experienceBullets?.length > 0 && (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader><CardTitle>Optimized Experience Bullets</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {opt.experienceBullets.map((exp: any, i: number) => (
                  <div key={i} className="bg-muted p-3 rounded-lg">
                    <p className="font-medium text-sm mb-2">{exp.role}</p>
                    <ul className="text-sm space-y-1">{exp.bullets?.map((b: string, j: number) => <li key={j}>• {b}</li>)}</ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {opt.recommendations?.length > 0 && (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-cyan-500" />People to Ask for Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">{opt.recommendations.map((r: string, i: number) => <li key={i} className="bg-muted p-2 rounded">• {r}</li>)}</ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
