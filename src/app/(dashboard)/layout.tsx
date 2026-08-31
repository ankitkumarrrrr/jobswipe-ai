"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Send, FileText, Settings,
  CreditCard, LogOut, Search, Bell, ChevronLeft, ChevronRight,
  Zap, HelpCircle, Sun, Moon, BarChart3, Mail, Users,
  Sparkles, Target, BellRing, ExternalLink, GitBranch, Phone,
  GraduationCap, Brain,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/logo";
import AiChatbot from "@/components/ai-chatbot";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/applications", label: "Applications", icon: Send },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/fresher-resume", label: "Resume Builder", icon: GraduationCap, badge: "NEW" },
  { href: "/mock-interview", label: "Mock Interview", icon: Brain, badge: "NEW" },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/email-tracking", label: "Email Tracking", icon: Mail },
  { href: "/interview-prep", label: "Interview Prep", icon: Sparkles },
  { href: "/ai-interview", label: "AI Interview", icon: Phone },
  { href: "/referrals", label: "Referral Finder", icon: Users },
  { href: "/resume-versions", label: "Resume Versions", icon: GitBranch },
  { href: "/linkedin-optimize", label: "LinkedIn Optimizer", icon: ExternalLink },
  { href: "/job-alerts", label: "Job Alerts", icon: BellRing },
  { href: "/teams", label: "Teams", icon: Target },
  { href: "/post-job", label: "Post a Job", icon: Briefcase },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) { setTheme(saved); document.documentElement.classList.toggle("dark", saved === "dark"); }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(data => {
      if (data?.user) {
        const name = data.user.name || "User";
        const email = data.user.email || "";
        const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        setUser({ name, email, initials });
      } else { router.push("/login"); }
    }).catch(() => router.push("/login"));
  }, [router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-gray-200 dark:border-[#1c1c1f] bg-white dark:bg-[#111114] transition-all duration-300 ${collapsed ? "w-[68px]" : "w-64"}`}>
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-[#1c1c1f]">
          <Logo size="sm" showText={!collapsed} />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-gray-600 hover:bg-gray-100 dark:text-[#8a8a8e] dark:hover:bg-[#1c1c1f]"}`}
                title={collapsed ? item.label : undefined}>
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <><span className="flex-1">{item.label}</span>{"badge" in item && item.badge && <span className="text-[10px] font-bold bg-gradient-to-r bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>}</>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-1">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:text-[#8a8a8e] dark:hover:bg-[#1c1c1f]">              {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <><ChevronLeft className="h-4 w-4 shrink-0" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#111114] shadow-xl overflow-y-auto">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#1c1c1f]">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="text-gray-500"><ChevronLeft className="h-5 w-5" /></button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-gray-600 hover:bg-gray-100 dark:text-[#8a8a8e] dark:hover:bg-[#1c1c1f]"}`}>
                    <item.icon className="h-5 w-5 shrink-0" /><span>{item.label}</span>{"badge" in item && item.badge && <span className="ml-auto text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 dark:border-[#1c1c1f] bg-white dark:bg-[#111114] flex items-center px-4 gap-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search jobs, applications..." className="pl-10 bg-gray-100 border-0 dark:bg-[#1c1c1f] dark:text-[#e5e5e7]" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/settings">
              <Badge className="bg-blue-600 text-white hidden sm:flex cursor-pointer hover:bg-blue-700">
                <Zap className="h-3 w-3 mr-1" /> Free Plan
              </Badge>
            </Link>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-500 hover:text-gray-700 dark:text-[#8a8a8e] dark:hover:text-white">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" className="relative text-gray-500" onClick={() => router.push("/applications")}>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#1c1c1f] rounded-lg px-2 py-1 cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {user?.initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.name || "Loading..."}</p>
                  <p className="text-xs text-gray-500">{user?.email || ""}</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push("/settings")}><Settings className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}><CreditCard className="h-4 w-4 mr-2" /> Billing</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" /> Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      <AiChatbot />
    </div>
  );
}
