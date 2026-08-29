"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Mail } from "lucide-react";

export default function JobAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ keywords: "", location: "", frequency: "daily" });

  useEffect(() => {
    fetch("/api/job-alerts").then(r => r.json()).then(d => setAlerts(d.alerts || [])).finally(() => setLoading(false));
  }, []);

  const createAlert = async () => {
    const res = await fetch("/api/job-alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", ...form }) });
    const data = await res.json();
    if (data.alert) { setAlerts([data.alert, ...alerts]); setShowCreate(false); setForm({ keywords: "", location: "", frequency: "daily" }); }
  };

  const toggleAlert = async (id: string) => {
    await fetch("/api/job-alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle", alertId: id }) });
    setAlerts(alerts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const deleteAlert = async (id: string) => {
    await fetch("/api/job-alerts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alertId: id }) });
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Alerts</h1>
          <p className="text-muted-foreground">Get daily digests of matching jobs in your inbox</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />New Alert</Button>
      </div>

      {showCreate && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500" />Create Job Alert</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Keywords (e.g., React Developer)" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} />
              <Input placeholder="Location (e.g., Bangalore)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <select className="w-full p-3 bg-muted rounded-lg text-sm" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={createAlert} className="bg-orange-500 hover:bg-orange-600">Create Alert</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {alerts.map(alert => (
          <Card key={alert.id} className="bg-card/50 backdrop-blur">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${alert.isActive ? 'bg-orange-500/10' : 'bg-muted'}`}>
                  <Mail className={`w-5 h-5 ${alert.isActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">{alert.keywords}</p>
                  <p className="text-sm text-muted-foreground">{alert.location || 'Everywhere'} • {alert.frequency}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${alert.isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                  {alert.isActive ? 'Active' : 'Paused'}
                </span>
                <Button variant="ghost" size="sm" onClick={() => toggleAlert(alert.id)}>
                  {alert.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length === 0 && !loading && (
        <Card className="bg-card/50 backdrop-blur"><CardContent className="p-12 text-center"><Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No job alerts. Create one to get daily job matches in your inbox.</p></CardContent></Card>
      )}
    </div>
  );
}
