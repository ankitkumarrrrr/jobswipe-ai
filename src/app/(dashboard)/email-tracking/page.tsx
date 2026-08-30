"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MousePointerClick, Clock, Mail, CheckCircle, Send, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailTrackingPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [stats, setStats] = useState({ opened: 0, clicked: 0, sent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from BOTH email tracking AND applications (for complete picture)
    Promise.allSettled([
      fetch("/api/email-track").then(r => r.json()),
      fetch("/api/automation").then(r => r.json()),
    ])
      .then(([trackResult, appsResult]) => {
        const allEmails: any[] = [];
        
        // 1. Add tracked emails (with open/click data)
        if (trackResult.status === "fulfilled" && trackResult.value.tracks) {
          for (const t of trackResult.value.tracks) {
            allEmails.push({
              id: t.id,
              recipient: t.recipientEmail,
              jobTitle: t.application?.job?.title || "Position",
              subject: t.subject,
              status: t.openedAt ? "OPENED" : t.clickedAt ? "CLICKED" : "SENT",
              sentAt: t.sentAt ? new Date(t.sentAt).toLocaleString() : "Recently",
              company: t.application?.job?.company || "Unknown",
              openCount: t.openCount || 0,
              clickCount: t.clickCount || 0,
              source: "tracked",
            });
          }
        }
        
        // 2. Add applications with emailBody (sent via SMTP, may not have tracking)
        if (appsResult.status === "fulfilled" && appsResult.value.applications) {
          for (const a of appsResult.value.applications) {
            if (a.sentAt || a.emailBody) {
              // Check if already in tracked list
              if (!allEmails.some(e => e.id === a.id)) {
                allEmails.push({
                  id: a.id,
                  recipient: a.job?.company ? `HR at ${a.job.company}` : "Recruiter",
                  jobTitle: a.job?.title || "Position",
                  subject: `Application for ${a.job?.title || "Position"}`,
                  status: a.status || "SENT",
                  sentAt: a.sentAt ? new Date(a.sentAt).toLocaleString() : "Recently",
                  company: a.job?.company || "Unknown",
                  openCount: 0,
                  clickCount: 0,
                  source: "application",
                });
              }
            }
          }
        }
        
        // Sort by most recent first
        allEmails.sort((a, b) => {
          if (a.sentAt === "Recently") return -1;
          if (b.sentAt === "Recently") return 1;
          return 0;
        });
        
        setEmails(allEmails);
        setStats({
          sent: allEmails.length,
          opened: allEmails.filter(e => e.status === "OPENED").length,
          clicked: allEmails.filter(e => e.status === "CLICKED").length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Tracking</h1>
          <p className="text-muted-foreground">Track when recruiters open and click your emails</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); window.location.reload(); }}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Send className="w-8 h-8 mx-auto text-violet-500 mb-2" />
            <p className="text-3xl font-bold">{stats.sent}</p>
            <p className="text-sm text-muted-foreground">Emails Sent</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-3xl font-bold">{stats.opened}</p>
            <p className="text-sm text-muted-foreground">Emails Opened</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <MousePointerClick className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold">{stats.clicked}</p>
            <p className="text-sm text-muted-foreground">Links Clicked</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-3xl font-bold">{stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0}%</p>
            <p className="text-sm text-muted-foreground">Open Rate</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading email data...</CardContent></Card>
      ) : emails.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No emails sent yet</h3>
            <p className="text-sm text-muted-foreground">Swipe right on jobs to auto-send application emails to recruiters</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader><CardTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-orange-500" /> Sent Applications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emails.map((email: any) => (
                <div key={email.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-violet-600">
                      {email.company?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{email.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">To: {email.recipient} · {email.company} · Sent {email.sentAt}</p>
                      {email.openCount > 0 && <p className="text-xs text-blue-400">Opened {email.openCount} time{email.openCount > 1 ? 's' : ''}</p>}
                      {email.clickCount > 0 && <p className="text-xs text-green-400">Clicked {email.clickCount} time{email.clickCount > 1 ? 's' : ''}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs ${
                      email.status === "OPENED" ? "bg-blue-100 text-blue-700" :
                      email.status === "CLICKED" ? "bg-green-100 text-green-700" :
                      "bg-violet-100 text-violet-700"
                    }`}>
                      {email.status === "SENT" ? "📧 Sent" :
                       email.status === "OPENED" ? "👁️ Opened" :
                       email.status === "CLICKED" ? "🔗 Clicked" :
                       email.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-orange-500" />How Email Tracking Works</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm">Every email sent through JobSwipe includes an invisible tracking pixel</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm">When the recruiter opens the email, the pixel loads and records the open event</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm">You'll see exactly when and how many times each email was opened</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm">Click tracking on job links tells you when recruiters are interested</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
