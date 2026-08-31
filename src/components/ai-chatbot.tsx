"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, GripHorizontal } from "lucide-react";

interface Message {
  role: "bot" | "user";
  text: string;
}

const BOT_INFO = `I'm JobSwipe AI Assistant! 🤖

Here's what you can do on JobSwipe:

🎯 **Job Swiping** — Swipe right to apply, left to skip. Like Tinder but for jobs!

📄 **Resume Upload** — Upload your resume once, and AI extracts your skills automatically.

✉️ **Auto Applications** — AI sends personalized emails to recruiters on your behalf.

📊 **Dashboard** — Track your applications, views, and response rates in real-time.

💰 **Pricing Plans:**
• FREE — 3 applications/month
• BASIC (₹299) — 100 applications/month
• PREMIUM (₹499) — Unlimited applications
• TEAM (₹1,999) — Unlimited + 5 team members

🔧 **Post a Job** — Recruiters can post jobs and find talent.

📧 **Email Tracking** — See when recruiters open your applications.

🌙 **Dark Mode** — Toggle in settings!

Need help with anything specific? Just ask!`;

const QUICK_REPLIES = [
  "How do I apply for jobs?",
  "How does the resume parser work?",
  "What are the pricing plans?",
  "How do I post a job?",
  "How does email tracking work?",
];

function getResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("apply") || lower.includes("swipe")) {
    return "🎯 **How to apply:**\n\n1. Go to **Jobs** from the sidebar\n2. Swipe RIGHT 👉 to apply for a job\n3. Swipe LEFT 👈 to skip\n4. AI will automatically send your resume to the recruiter via email!\n\nYou get 3 free applications per month on the free plan.";
  }
  if (lower.includes("resume") || lower.includes("parse")) {
    return "📄 **Resume Parser:**\n\n1. Go to **Settings → Profile**\n2. Click **Upload Resume**\n3. Upload your PDF resume\n4. AI extracts your skills, experience, and education automatically!\n\nYour resume is then used when applying to jobs.";
  }
  if (lower.includes("price") || lower.includes("plan") || lower.includes("cost")) {
    return "💰 **Pricing Plans:**\n\n• **FREE** — ₹0 (3 apps/month)\n• **BASIC** — ₹299/month (100 apps)\n• **PREMIUM** — ₹499/month (Unlimited)\n• **TEAM** — ₹1,999/month (Unlimited + 5 members)\n\nGo to **Settings → Billing** to upgrade!";
  }
  if (lower.includes("post") || lower.includes("recruiter") || lower.includes("job posting")) {
    return "🔧 **Post a Job:**\n\n1. Click **Post a Job** in the sidebar\n2. Fill in job details (title, company, description)\n3. Click **Post Job**\n4. Job appears in candidates' swipe feed!\n\nYou can track views and applications from your dashboard.";
  }
  if (lower.includes("email") || lower.includes("track")) {
    return "📧 **Email Tracking:**\n\nWhen AI sends an application email:\n• ✅ Delivered — Email reached the recruiter\n• 👁️ Opened — Recruiter opened the email\n• 🔗 Clicked — Recruiter clicked a link\n• ❌ Bounced — Email bounced\n\nCheck **Email Tracking** in the sidebar to see all your sent emails!";
  }
  if (lower.includes("login") || lower.includes("sign in") || lower.includes("log in")) {
    return "🔐 **Login:**\n\n1. Go to the Login page\n2. Enter your email and password\n3. Click **Sign In**\n4. Watch the lamp light up! 💡\n\nDon't have an account? Click **Sign up for free**!";
  }
  if (lower.includes("dashboard") || lower.includes("home")) {
    return "📊 **Dashboard:**\n\nYour dashboard shows:\n• 📈 Applications sent today\n• 👁️ Total views\n• 📩 Response rate\n• 📊 Weekly activity chart\n• 🏢 Companies viewed\n• 📅 Upcoming interviews\n\nEverything updates in real-time!";
  }
  if (lower.includes("dark") || lower.includes("theme") || lower.includes("mode")) {
    return "🌙 **Dark Mode:**\n\nClick the **moon icon** in the top-right header to toggle between light and dark mode. Your preference is saved!";
  }
  if (lower.includes("settings") || lower.includes("profile")) {
    return "⚙️ **Settings:**\n\nGo to **Settings** in the sidebar to:\n• Edit your profile\n• Upload your resume\n• Manage billing & plans\n• Toggle dark mode\n• Sign out";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hey there! 👋 Welcome to JobSwipe! I'm here to help you navigate the platform. What would you like to know?";
  }
  if (lower.includes("thank")) {
    return "You're welcome! 😊 Happy job hunting! Let me know if you need anything else.";
  }
  if (lower.includes("real") || lower.includes("live")) {
    return "⚡ **Real-time Features:**\n\n• Job feed updates live as new jobs are posted\n• Application tracking is instant\n• Email delivery status updates in real-time\n• Dashboard stats refresh automatically\n\nEverything on JobSwipe works in real-time!";
  }

  return "I can help you with:\n\n• **Job Swiping** — How to apply\n• **Resume** — Upload & parsing\n• **Pricing** — Plans & billing\n• **Post a Job** — For recruiters\n• **Email Tracking** — Application status\n• **Dashboard** — Overview & stats\n• **Dark Mode** — Theme toggle\n• **Settings** — Profile & account\n\nJust ask about any of these! 😊";
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: BOT_INFO },
  ]);
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");

    // Simulate bot thinking
    setTimeout(() => {
      const response = getResponse(msg);
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Dragging logic
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!chatRef.current) return;
    setIsDragging(true);
    const rect = chatRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;
      // Clamp within viewport
      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 500;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatRef}
          className="fixed z-50 w-[380px] h-[520px] bg-[#111114] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            left: position.x || "calc(100vw - 420px)",
            top: position.y || "calc(100vh - 580px)",
            bottom: position.y ? "auto" : "20px",
            right: position.x ? "auto" : "20px",
          }}
        >
          {/* Header — draggable */}
          <div
            ref={dragRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-4 w-4 text-white/60" />
              <Bot className="h-5 w-5 text-white" />
              <span className="font-semibold text-white text-sm">JobSwipe Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white/[0.06] text-gray-200 border border-white/[0.06] rounded-bl-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-50 bottom-6 right-6 p-3.5 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-600 rotate-90"
            : "bg-blue-600 hover:bg-blue-500 hover:scale-110"
        }`}
        style={{
          bottom: position.y ? Math.max(20, position.y - 60) : undefined,
          right: position.x ? Math.max(20, position.x + 340) : undefined,
        }}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <MessageCircle className="h-5 w-5 text-white" />
        )}
      </button>
    </>
  );
}
