"use client";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, MessageSquare, Lightbulb, ChevronDown, ChevronUp, History } from "lucide-react";

export default function InterviewPrepPage() {
  const [preps, setPreps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ jobTitle: "", company: "", jobDescription: "" });
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/interview-prep").then(r => r.json()).then(d => setPreps(d.preps || [])).catch(() => {});
  }, []);

  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.prep) {
        setPreps([{ ...form, questions: data.prep.questions, tips: data.prep.tips, createdAt: new Date().toISOString() }, ...preps]);
        setForm({ jobTitle: "", company: "", jobDescription: "" });
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Interview Prep AI</h1>
        <p className="text-muted-foreground">Generate personalized interview questions and answers</p>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-500" />Generate Interview Prep</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Job Title (e.g., Senior Frontend Engineer)" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
            <Input placeholder="Company (e.g., Google)" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </div>
          <textarea className="w-full p-3 bg-muted rounded-lg text-sm min-h-[80px]" placeholder="Paste job description (optional, improves quality)..." value={form.jobDescription} onChange={e => setForm({ ...form, jobDescription: e.target.value })} />
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          <Button onClick={generate} disabled={generating || !form.jobTitle || !form.company} className="bg-orange-500 hover:bg-orange-600">
            {generating ? <><span className="animate-spin mr-2">⏳</span>Generating 10 questions...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Interview Prep</>}
          </Button>
        </CardContent>
      </Card>

      {preps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5" />Generated Preps</h2>
          {preps.map((prep, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur">
              <CardHeader className="cursor-pointer" onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{prep.jobTitle} at {prep.company}</CardTitle>
                  {expanded === i ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              {expanded === i && (
                <CardContent className="space-y-4">
                  {prep.questions?.map((q: any, j: number) => (
                    <div key={j} className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-start gap-2"><MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /><p className="font-medium">{q.question}</p></div>
                      <div className="ml-6 text-sm text-muted-foreground"><strong>Answer:</strong> {q.answer}</div>
                      {q.tip && <div className="ml-6 text-sm text-orange-500 flex items-center gap-1"><Lightbulb className="w-3 h-3" />{q.tip}</div>}
                    </div>
                  ))}
                  {prep.tips && (
                    <div className="p-4 bg-orange-500/10 rounded-lg">
                      <h4 className="font-medium mb-2">General Tips</h4>
                      <ul className="text-sm space-y-1">{(typeof prep.tips === 'string' ? JSON.parse(prep.tips || '[]') : prep.tips || []).map((t: string, k: number) => <li key={k}>• {t}</li>)}</ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
