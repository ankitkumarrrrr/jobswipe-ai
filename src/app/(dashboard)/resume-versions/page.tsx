"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Trash2, Copy, Briefcase } from "lucide-react";

export default function ResumeVersionsPage() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", customizedFor: "", skills: "", experience: "", education: "", goals: "" });

  useEffect(() => {
    fetch("/api/resume-versions").then(r => r.json()).then(d => setVersions(d.versions || [])).finally(() => setLoading(false));
  }, []);

  const createVersion = async () => {
    const res = await fetch("/api/resume-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean) }),
    });
    const data = await res.json();
    if (data.version) {
      setVersions([data.version, ...versions]);
      setShowCreate(false);
      setForm({ name: "", customizedFor: "", skills: "", experience: "", education: "", goals: "" });
    }
  };

  const deleteVersion = async (id: string) => {
    await fetch("/api/resume-versions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ versionId: id }) });
    setVersions(versions.filter(v => v.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resume Versions</h1>
          <p className="text-muted-foreground">Save multiple customized resumes for different job types</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />New Version</Button>
      </div>

      {showCreate && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader><CardTitle>Create Resume Version</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Version name (e.g., Frontend Developer)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Customized for (e.g., Google Frontend Role)" value={form.customizedFor} onChange={e => setForm({ ...form, customizedFor: e.target.value })} />
            <Input placeholder="Key skills (comma separated)" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
            <textarea className="w-full p-3 bg-muted rounded-lg text-sm min-h-[80px]" placeholder="Relevant experience..." value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
            <textarea className="w-full p-3 bg-muted rounded-lg text-sm min-h-[60px]" placeholder="Education..." value={form.education} onChange={e => setForm({ ...form, education: e.target.value })} />
            <textarea className="w-full p-3 bg-muted rounded-lg text-sm min-h-[60px]" placeholder="Career goals..." value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={createVersion} className="bg-orange-500 hover:bg-orange-600">Create Version</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded animate-pulse" />)}</div>
      ) : versions.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur"><CardContent className="p-12 text-center"><FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No resume versions yet. Create one to customize your resume for specific jobs.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map(v => (
            <Card key={v.id} className="bg-card/50 backdrop-blur hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg"><FileText className="w-5 h-5 text-orange-500" /></div>
                  <Button variant="ghost" size="sm" onClick={() => deleteVersion(v.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
                <h3 className="font-semibold mb-1">{v.name}</h3>
                {v.customizedFor && <p className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="w-3 h-3" />{v.customizedFor}</p>}
                {v.skills && v.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">{v.skills.slice(0, 5).map((s: string, i: number) => <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{s}</span>)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Created {new Date(v.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
