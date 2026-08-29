"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, ExternalLink, Copy, CheckCircle } from "lucide-react";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ company: "", role: "" });
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/referrals").then(r => r.json()).then(d => setReferrals(d.referrals || [])).catch(() => {});
  }, []);

  const findReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.referrals) setReferrals([...data.referrals, ...referrals]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (msg: string, i: number) => {
    navigator.clipboard.writeText(msg);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referral Finder</h1>
        <p className="text-muted-foreground">Find people at companies who can refer you</p>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-orange-500" />Find Referrals</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Company (e.g., Google)" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Target Role (e.g., Software Engineer)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
          </div>
          <Button onClick={findReferrals} disabled={loading || !form.company} className="bg-orange-500 hover:bg-orange-600">
            {loading ? <><span className="animate-spin mr-2">⏳</span>Searching...</> : <><Users className="w-4 h-4 mr-2" />Find Referral Contacts</>}
          </Button>
        </CardContent>
      </Card>

      {referrals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {referrals.map((ref, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{ref.name}</h3>
                    <p className="text-sm text-muted-foreground">{ref.title} • {ref.department}</p>
                  </div>
                  <a href={ref.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600"><ExternalLink className="w-4 h-4" /></a>
                </div>
                {ref.approach && <p className="text-sm bg-muted/50 p-2 rounded"><strong>Approach:</strong> {ref.approach}</p>}
                {ref.message && (
                  <div className="relative">
                    <p className="text-sm bg-orange-500/10 p-2 rounded pr-8">{ref.message}</p>
                    <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => copyMessage(ref.message, i)}>
                      {copied === i ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
