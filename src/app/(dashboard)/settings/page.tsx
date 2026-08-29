"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, Bell, Link as LinkIcon, Save, Zap, Check, Mail, Loader2, Crown, Users, Infinity } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", location: "", linkedinUrl: "", goals: "", skills: [] as string[], experience: [] as any[], education: [] as any[] });
  const [subscription, setSubscription] = useState({ plan: "FREE", applicationsUsed: 0, applicationsLimit: 5, price: 0, features: [] as string[] });
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(data => {
      if (data.user) setProfile({ name: data.user.name || "", email: data.user.email || "", phone: data.profile?.phone || "", location: data.profile?.location || "", linkedinUrl: data.profile?.linkedinUrl || "", goals: data.profile?.goals || "", skills: data.profile?.skills || [], experience: data.profile?.experience || [], education: data.profile?.education || [] });
      setLoading(false);
    }).catch(() => setLoading(false));

    fetch("/api/payments").then(r => r.json()).then(data => {
      if (data.plan) setSubscription({ plan: data.plan, applicationsUsed: data.applicationsUsed, applicationsLimit: data.applicationsLimit, price: data.price, features: data.features || [] });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      if (res.ok) toast.success("Profile saved!"); else toast.error("Failed to save");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const upgradePlan = async (plan: string, method: string) => {
    setPaymentProcessing(true);
    try {
      if (method === 'razorpay') {
        // Step 1: Create order on server
        const res = await fetch("/api/payments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, paymentMethod: 'razorpay' }),
        });
        const data = await res.json();

        if (data.error) {
          toast.error(data.error);
          setPaymentProcessing(false);
          return;
        }

        if (!data.orderId) {
          toast.error("Failed to create payment order");
          setPaymentProcessing(false);
          return;
        }

        // Step 2: Load Razorpay script if not loaded
        if (!window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Razorpay'));
            document.body.appendChild(script);
          });
        }

        // Step 3: Open Razorpay checkout
        const options = {
          key: data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'JobSwipe',
          description: `${plan} Plan - Monthly Subscription`,
          order_id: data.orderId,
          handler: async function (response: any) {
            // Step 4: Verify payment on server
            try {
              const verifyRes = await fetch("/api/payments", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  plan,
                  paymentMethod: 'razorpay',
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                toast.success(`🎉 Upgraded to ${plan}!`, { description: "Your plan has been activated. Enjoy your new features!" });
                setSubscription(prev => ({ ...prev, plan }));
              } else {
                toast.error("Payment verification failed", { description: "Please contact support" });
              }
            } catch (e) {
              toast.error("Payment verification failed", { description: "Please contact support" });
            }
            setPaymentProcessing(false);
          },
          prefill: {
            name: profile.name || 'Ankit Kumar',
            email: profile.email || 'ankit176424@gmail.com',
            contact: profile.phone || '',
          },
          notes: { plan, userId: 'current' },
          theme: { color: '#f97316' },
          modal: {
            ondismiss: function () {
              toast.info("Payment cancelled");
              setPaymentProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.error("Payment failed", { description: response.error?.description || "Please try again" });
          setPaymentProcessing(false);
        });
        rzp.open();
      } else if (method === 'stripe') {
        const res = await fetch("/api/payments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, paymentMethod: 'stripe' }),
        });
        const data = await res.json();
        if (data.checkoutUrl) window.location.href = data.checkoutUrl;
        else toast.error(data.error || "Stripe not configured");
      }
    } catch (e) {
      toast.error("Payment failed", { description: "Please try again" });
    }
    setPaymentProcessing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500 mt-1">Manage your account, billing, and integrations</p></div>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard className="h-4 w-4" /> Billing</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><LinkIcon className="h-4 w-4" /> Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name</Label><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your full name" /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={profile.email} disabled className="bg-gray-50" /><p className="text-xs text-gray-400">Emails to recruiters are sent from this address</p></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} placeholder="Bangalore, India" /></div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2"><LinkIcon className="h-5 w-5 text-blue-600" /><Label className="text-base font-semibold">LinkedIn Profile URL</Label></div>
                <p className="text-xs text-gray-500 mb-3">Required for AI to send LinkedIn connection requests</p>
                <Input value={profile.linkedinUrl} onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/your-profile" className="bg-white" />
              </div>
              <div className="space-y-2"><Label>Career Goals</Label><Input value={profile.goals} onChange={e => setProfile({ ...profile, goals: e.target.value })} placeholder="Looking for senior engineering roles..." /></div>
              
              {profile.skills.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2"><span className="text-green-600">✅</span><Label className="text-base font-semibold">Auto-filled from Resume</Label></div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Skills ({profile.skills.length})</p>
                      <div className="flex flex-wrap gap-1">{profile.skills.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{s}</span>
                      ))}</div>
                    </div>
                    {profile.experience.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Experience ({profile.experience.length})</p>
                        {profile.experience.map((e: any, i: number) => (
                          <p key={i} className="text-sm">{e.title} {e.company ? `at ${e.company}` : ''}</p>
                        ))}
                      </div>
                    )}
                    {profile.education.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Education ({profile.education.length})</p>
                        {profile.education.map((e: any, i: number) => (
                          <p key={i} className="text-sm">{e.degree} {e.institution ? `from ${e.institution}` : ''}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end"><Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}{saving ? "Saving..." : "Save Changes"}</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Current Plan</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/5 dark:to-amber-500/5 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center"><Zap className="h-5 w-5 text-white" /></div>
                  <div><p className="font-semibold">{subscription.plan} Plan</p><p className="text-sm text-gray-500">{subscription.applicationsUsed} / {subscription.applicationsLimit === -1 ? "∞" : subscription.applicationsLimit} applications used</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { name: "FREE", price: "₹0", icon: Zap, color: "gray", limit: "3 apps/mo", features: ["AI Resume Customization", "Cover Letter", "LinkedIn Messages", "3 Applications/Month"] },
              { name: "BASIC", price: "₹299", icon: Users, color: "blue", limit: "100 apps/mo", features: ["Everything in Free", "Email Automation", "Analytics Dashboard", "Auto-Apply Bot", "100 Applications/Month"], highlight: true },
              { name: "PREMIUM", price: "₹499", icon: Crown, color: "purple", limit: "Unlimited", features: ["Everything in Basic", "Priority Matching", "Interview Prep AI", "Referral Finder", "Unlimited Applications"] },
              { name: "TEAM", price: "₹1,999", icon: Infinity, color: "orange", limit: "Unlimited", features: ["Everything in Premium", "5 Team Members", "Team Analytics", "Shared Job Boards", "Bulk Operations"] },
            ].map(plan => (
              <Card key={plan.name} className={`relative ${plan.highlight ? "border-orange-300 dark:border-orange-500/30 ring-1 ring-orange-200" : ""}`}>
                {plan.highlight && <Badge className="absolute -top-2 left-4 bg-orange-500 text-white text-xs">Popular</Badge>}
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2"><plan.icon className="w-5 h-5 text-orange-500" /><h3 className="font-semibold">{plan.name}</h3></div>
                  <p className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                  <p className="text-xs text-gray-500 mb-3">{plan.limit}</p>
                  <Separator className="my-3" />
                  <ul className="space-y-1.5 mb-4">{plan.features.map(f => <li key={f} className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-orange-500 shrink-0" />{f}</li>)}</ul>
                  {subscription.plan === plan.name ? (
                    <Button disabled className="w-full bg-gray-200 text-gray-500">Current Plan</Button>
                  ) : (
                    <div className="space-y-2">
                      <Button onClick={() => upgradePlan(plan.name, 'razorpay')} disabled={paymentProcessing} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                        {paymentProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Pay with Razorpay
                      </Button>
                      <Button onClick={() => upgradePlan(plan.name, 'stripe')} disabled={paymentProcessing} variant="outline" className="w-full">
                        Pay with Stripe
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "New job matches", description: "Get notified when new jobs match your profile", default: true },
                { label: "Application updates", description: "Status changes on sent applications", default: true },
                { label: "Interview requests", description: "When a company responds with an interview", default: true },
                { label: "Email opens", description: "When a recruiter opens your email", default: true },
                { label: "Weekly report", description: "Summary of your job search activity", default: false },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
                  <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-gray-500">{item.description}</p></div>
                  <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked={item.default} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" /></label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader><CardTitle className="text-base">Connected Services</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "LinkedIn", connected: !!profile.linkedinUrl, icon: "in", note: profile.linkedinUrl ? "Profile URL saved" : "Add LinkedIn URL in Profile" },
                { name: "Gmail (SMTP)", connected: true, icon: "G", note: "Configured for sending emails" },
                { name: "Gemini AI", connected: true, icon: "✦", note: "Free tier active" },
                { name: "Razorpay", connected: false, icon: "R", note: "Add keys in .env.local" },
                { name: "Stripe", connected: false, icon: "S", note: "Add keys in .env.local" },
              ].map(service => (
                <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-sm">{service.icon}</div>
                    <div><p className="text-sm font-medium">{service.name}</p><p className="text-xs text-gray-500">{service.note}</p></div>
                  </div>
                  <Badge className={service.connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>{service.connected ? "Active" : "Setup needed"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
