"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  FileText,
  Send,
  BarChart3,
  Shield,
  Sparkles,
  Check,
  Star,
  Menu,
  X,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";
import { useState } from "react";



const DemoVideo = dynamic(() => import("@/components/demo-video"), {
  ssr: false,
});

const features = [
  {
    icon: FileText,
    title: "AI Resume Parsing",
    description:
      "Upload your resume and our AI instantly extracts your skills, experience, and career goals.",
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    description:
      "AI scores every job against your profile so you only see the most relevant opportunities.",
  },
  {
    icon: Zap,
    title: "One-Swipe Apply",
    description:
      "Swipe right to apply — AI customizes your resume, writes a cover letter, and sends it.",
  },
  {
    icon: Send,
    title: "Auto Outreach",
    description:
      "AI finds hiring managers on LinkedIn and sends personalized connection requests.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track applications, response rates, and interview requests in real-time.",
  },
  {
    icon: Shield,
    title: "Safe & Compliant",
    description:
      "Rate-limited automation that respects platform limits. GDPR-compliant data storage.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload Resume",
    description: "Drop your PDF or DOCX resume. AI extracts everything automatically.",
  },
  {
    step: "02",
    title: "Review Matches",
    description: "See AI-scored job matches in a swipeable card stack.",
  },
  {
    step: "03",
    title: "Swipe to Apply",
    description: "Right = Apply. AI handles the rest — resume, cover letter, outreach.",
  },
  {
    step: "04",
    title: "Track Results",
    description: "Monitor responses, interviews, and your application pipeline.",
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for trying out JobSwipe",
    features: [
      "5 applications per month",
      "AI resume customization",
      "AI cover letter generation",
      "Basic job matching",
      "Email support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Basic",
    price: "₹299",
    period: "/month",
    description: "For active job seekers",
    features: [
      "100 applications per month",
      "AI resume customization",
      "AI cover letter generation",
      "Smart job matching",
      "LinkedIn outreach (10/day)",
      "Email automation",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start Basic Plan",
    popular: true,
  },
  {
    name: "Premium",
    price: "₹499",
    period: "/month",
    description: "For serious job hunters",
    features: [
      "Unlimited applications",
      "Everything in Basic",
      "Priority job matching",
      "Advanced AI personalization",
      "LinkedIn outreach (15/day)",
      "Multi-board scraping",
      "Dedicated support",
      "API access",
    ],
    cta: "Go Premium",
    popular: false,
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero Background — Lamp Image */}
      <div className="fixed inset-0 -z-10">
        <img
          src="/lamp-hero.webp"
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/60 via-[#030712]/40 to-[#030712]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/80 via-transparent to-[#030712]/80" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#demo" className="text-sm text-gray-300 hover:text-white transition-colors">Demo</a>
              <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</a>
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white">Log In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white">Sign Up Free</Button>
              </Link>
            </div>
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-xl border-b border-white/10">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-300 hover:text-white">
                Features
              </a>
              <a href="#how-it-works" className="block text-gray-300 hover:text-white">
                How It Works
              </a>
              <a href="#demo" className="block text-gray-300 hover:text-white">
                Demo
              </a>
              <a href="#pricing" className="block text-gray-300 hover:text-white">
                Pricing
              </a>
              <hr className="border-white/10" />
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full text-gray-300">
                  Log In
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/20">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Job Applications
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Swipe Your Way to{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Dream Job
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Upload your resume once. AI finds matching jobs, customizes your
            applications, and sends them — all with a single swipe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 h-12 text-base"
              >
                Start Applying with AI
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#demo">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 h-12 text-base"
              >
                <Play className="mr-2 h-4 w-4" /> Watch Demo
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            No credit card required · Free forever plan · Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Land the Job
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our AI handles the tedious parts of job hunting so you can focus on
              what matters — preparing for interviews.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-4 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 transition-all">
                    <feature.icon className="h-6 w-6 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <DemoVideo />

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Four Steps to Your Next Job
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-violet-500/20 mb-2">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm">{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <Card
                key={i}
                className={`relative ${
                  plan.popular
                    ? "bg-gradient-to-b from-violet-500/10 to-indigo-500/10 border-violet-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="block">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-violet-500/30">
            <CardContent className="p-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Job Search?
              </h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Join thousands of job seekers who are landing interviews faster
                with AI-powered applications.
              </p>
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-violet-700 hover:bg-gray-100 px-8 h-12 text-base"
                >
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 JobSwipe AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
