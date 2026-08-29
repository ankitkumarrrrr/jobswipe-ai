"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MousePointerClick, Clock, Mail, CheckCircle } from "lucide-react";

export default function EmailTrackingPage() {
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then(r => r.json()).then(d => {
      // We'll show email tracks from the analytics overview
      setTracking([]);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Tracking</h1>
        <p className="text-muted-foreground">Track when recruiters open and click your emails</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-3xl font-bold">—</p>
            <p className="text-sm text-muted-foreground">Emails Opened</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <MousePointerClick className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold">—</p>
            <p className="text-sm text-muted-foreground">Links Clicked</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <p className="text-3xl font-bold">—</p>
            <p className="text-sm text-muted-foreground">Avg. Response Time</p>
          </CardContent>
        </Card>
      </div>

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

      {tracking.length > 0 && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tracking.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{t.recipientEmail}</p>
                    <p className="text-xs text-muted-foreground">{t.subject}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{t.openCount}</span>
                    <span className="flex items-center gap-1"><MousePointerClick className="w-4 h-4" />{t.clickCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
