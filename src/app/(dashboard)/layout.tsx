"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Send, FileText, Settings,
  CreditCard, LogOut, Search, Bell, ChevronLeft, ChevronRight,
  Zap, Sun, Moon, BarChart3, Mail, Users,
  Sparkles, Target, BellRing, ExternalLink, GitBranch, Phone,
  GraduationCap, Brain, ChevronDown, Bookmark, LayoutGrid,
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

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/jobs", label: "Jobs", icon: Briefcase },
      { href: "/applications", label: "Applications", icon: Send },
      { href: "/bookmarks", label: "Saved Jobs", icon: Bookmark, badge: "NEW" },
      { href: "/kanban", label: "Job Tracker", icon: LayoutGrid, badge: "NEW" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { href: "/resume", label: "Resume", icon: FileText },
      { href: "/fresher-resume", label: "Resume Builder", icon: GraduationCap, badge: "NEW" },
      { href: "/mock-interview", label: "Mock Interview", icon: Brain, badge: "NEW" },
      { href: "/ai-interview", label: "AI Interview", icon: Phone },
      { href: "/interview-prep", label: "Interview Prep", icon: Sparkles },
      { href: "/linkedin-optimize", label: "LinkedIn Optimizer", icon: ExternalLink },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/email-tracking", label: "Email Tracking", icon: Mail },
      { href: "/job-alerts", label: "Job Alerts", icon: BellRing },
    ],
  },
  {
    label: "Collaborate",
    items: [
      { href: "/referrals", label: "Referral Finder", icon: Users },
      { href: "/resume-versions", label: "Resume Versions", icon: GitBranch },
      { href: "/teams", label: "Teams", icon: Target },
    ],
  },
  {
    label: "Recruiter",
    items: [
      { href: "/post-job", label: "Post a Job", icon: Briefcase },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<{ name: string; email: string; initials: string; plan: string; appsLimit: number } | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Main: true,
    "AI Tools": true,
    Insights: false,
    Collaborate: false,
    Recruiter: false,
  });

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
        setUser({ name, email, initials, plan: "FREE", appsLimit: 5 });
        // Fetch real subscription data
        fetch("/api/payments").then(r => r.json()).then(sub => {
          if (sub?.plan) {
            setUser(prev => prev ? { ...prev, plan: sub.plan, appsLimit: sub.applicationsLimit || 5 } : null);
          }
        }).catch(() => {});
      } else { router.push("/login"); }
    }).catch(() => router.push("/login"));
  }, [router]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const planLabel = user?.plan === "FREE" ? `Free Plan (${user?.appsLimit || 5} left)` :
    user?.plan === "BASIC" ? "Basic Plan" :
    user?.plan === "PREMIUM" ? "Premium Plan" :
    user?.plan === "TEAM" ? "Team Plan" : "Free Plan";

  const renderSidebarNav = (isMobile: boolean) => (
    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
      {navGroups.map(group => {
        const isOpen = openGroups[group.label];
        const hasActive = group.items.some(item => pathname === item.href);
        return (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                  hasActive ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
                } hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
              >
                <span>{group.label}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
              </button>
            )}
            {(collapsed || isOpen) && group.items.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-gray-600 hover:bg-gray-100 dark:text-[#8a8a8e] dark:hover:bg-[#1c1c1f]"
                  }`}
                  title={collapsed ? item.label : undefined}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
      {/* Settings always at bottom */}
      <div className="pt-2 border-t border-gray-200 dark:border-[#1c1c1f]">
        <Link href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            pathname === "/settings" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-gray-600 hover:bg-gray-100 dark:text-[#8a8a8e] dark:hover:bg-[#1c1c1f]"
          }`}
          title={collapsed ? "Settings" : undefined}>
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-gray-200 dark:border-[#1c1c1f] bg-white dark:bg-[#111114] transition-all duration-300 ${collapsed ? "w-[68px]" : "w-64"}`}>
        <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-[#1c1c1f]">
          <Logo size="sm" showText={!collapsed} />
        </div>
        {renderSidebarNav(false)}
        <div className="p-2 border-t border-gray-200 dark:border-[#1c1c1f]">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:text-[#8a8a8e] dark:hover:bg-[#1c1c1f]">
            {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <><ChevronLeft className="h-4 w-4 shrink-0" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#111114] shadow-xl overflow-y-auto">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#1c1c1f]">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="text-gray-500"><ChevronLeft className="h-5 w-5" /></button>
            </div>
            {renderSidebarNav(true)}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sm:h-16 border-b border-gray-200 dark:border-[#1c1c1f] bg-white dark:bg-[#111114] flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
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
                <Zap className="h-3 w-3 mr-1" /> {planLabel}
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

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">{children}</main>
      </div>
      <AiChatbot />
    </div>
  );
}
