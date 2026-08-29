"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, ChevronRight, Upload, Sparkles, Send, BarChart3 } from "lucide-react";

const steps = [
  {
    title: "1. Upload Your Resume",
    description: "Drag & drop your PDF or DOCX resume. AI extracts all your skills, experience, and education in seconds.",
    icon: Upload,
    color: "from-violet-500 to-purple-500",
    animation: "upload",
  },
  {
    title: "2. AI Analyzes Your Profile",
    description: "Our AI reads your resume, identifies key skills, and builds a professional profile automatically.",
    icon: Sparkles,
    color: "from-purple-500 to-indigo-500",
    animation: "analyze",
  },
  {
    title: "3. Swipe on Matching Jobs",
    description: "See AI-scored job matches from Google, Amazon, Microsoft and more. Swipe right to apply!",
    icon: ChevronRight,
    color: "from-indigo-500 to-blue-500",
    animation: "swipe",
  },
  {
    title: "4. AI Sends Applications",
    description: "AI customizes your resume, writes a cover letter, finds recruiters, and sends personalized outreach.",
    icon: Send,
    color: "from-blue-500 to-cyan-500",
    animation: "send",
  },
  {
    title: "5. Track Everything",
    description: "Monitor applications, response rates, and interview requests in your analytics dashboard.",
    icon: BarChart3,
    color: "from-cyan-500 to-teal-500",
    animation: "track",
  },
];

function AnimatedDemo({ currentStep, isPlaying }: { currentStep: number; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const draw = () => {
      if (isPlaying) timeRef.current += 0.02;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#0f0524");
      bgGrad.addColorStop(1, "#1a0a3e");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw floating particles
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(t * 0.3 + i * 1.7) * 0.5 + 0.5) * w;
        const y = (Math.cos(t * 0.2 + i * 2.1) * 0.5 + 0.5) * h;
        const size = 1 + Math.sin(t + i) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${0.3 + Math.sin(t + i) * 0.2})`;
        ctx.fill();
      }

      // Draw phone mockup
      const phoneW = 180;
      const phoneH = 320;
      const phoneX = w / 2 - phoneW / 2;
      const phoneY = h / 2 - phoneH / 2 + 20;

      // Phone shadow
      ctx.shadowColor = "rgba(139, 92, 246, 0.3)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;

      // Phone body
      ctx.beginPath();
      ctx.roundRect(phoneX, phoneY, phoneW, phoneH, 20);
      ctx.fillStyle = "#1e1040";
      ctx.fill();
      ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Phone screen
      ctx.beginPath();
      ctx.roundRect(phoneX + 8, phoneY + 8, phoneW - 16, phoneH - 16, 14);
      ctx.fillStyle = "#0a0118";
      ctx.fill();

      // Status bar
      ctx.fillStyle = "#1e1040";
      ctx.fillRect(phoneX + 8, phoneY + 8, phoneW - 16, 24);

      // Draw content based on step
      const contentY = phoneY + 40;
      const contentX = phoneX + 16;
      const contentW = phoneW - 32;

      if (currentStep === 0) {
        // Upload step - show upload area
        ctx.strokeStyle = "rgba(139, 92, 246, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.roundRect(contentX, contentY + 20, contentW, 100, 8);
        ctx.stroke();
        ctx.setLineDash([]);

        // Upload icon
        const iconX = w / 2;
        const iconY = contentY + 55;
        ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
        ctx.beginPath();
        ctx.arc(iconX, iconY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Arrow
        ctx.fillStyle = "#8b5cf6";
        ctx.beginPath();
        ctx.moveTo(iconX, iconY - 8);
        ctx.lineTo(iconX + 6, iconY);
        ctx.lineTo(iconX - 6, iconY);
        ctx.closePath();
        ctx.fill();

        // File name sliding in
        const fileX = contentX + Math.min(t * 40, contentW - 60);
        if (t > 0.5) {
          ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
          ctx.beginPath();
          ctx.roundRect(fileX, contentY + 130, 100, 24, 4);
          ctx.fill();
          ctx.fillStyle = "#c4b5fd";
          ctx.font = "10px sans-serif";
          ctx.fillText("Resume.pdf", fileX + 10, contentY + 146);
        }

        ctx.fillStyle = "#6b7280";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Drop your resume here", w / 2, contentY + 90);
        ctx.textAlign = "left";
      }

      if (currentStep === 1) {
        // AI Analysis - show scanning lines
        const scanY = contentY + 20 + (Math.sin(t * 3) * 0.5 + 0.5) * 180;

        ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(contentX, scanY);
        ctx.lineTo(contentX + contentW, scanY);
        ctx.stroke();

        // Glow effect
        const glowGrad = ctx.createLinearGradient(contentX, scanY - 10, contentX, scanY + 10);
        glowGrad.addColorStop(0, "rgba(139, 92, 246, 0)");
        glowGrad.addColorStop(0.5, "rgba(139, 92, 246, 0.3)");
        glowGrad.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(contentX, scanY - 10, contentW, 20);

        // Extracted items appearing
        const items = ["Skills: React, Node.js", "Experience: 5 years", "Education: B.Tech"];
        items.forEach((item, i) => {
          if (t > i * 0.8) {
            const alpha = Math.min((t - i * 0.8) * 2, 1);
            ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.2})`;
            ctx.beginPath();
            ctx.roundRect(contentX, contentY + 40 + i * 35, contentW, 28, 4);
            ctx.fill();
            ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.font = "9px sans-serif";
            ctx.fillText("✓ " + item, contentX + 8, contentY + 58 + i * 35);
          }
        });
      }

      if (currentStep === 2) {
        // Swipe cards
        const cards = [
          { company: "Google", role: "Frontend Engineer", match: "92%" },
          { company: "Amazon", role: "Full Stack Dev", match: "87%" },
          { company: "Microsoft", role: "React Developer", match: "85%" },
        ];

        cards.forEach((card, i) => {
          const offset = i * 6;
          const swipeOffset = currentStep === 2 && t > 2 ? Math.sin(t * 2) * 20 : 0;
          const cardX = contentX + offset + swipeOffset;
          const cardY = contentY + 20 + offset;

          ctx.fillStyle = `rgba(30, 16, 64, ${1 - i * 0.2})`;
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, contentW - offset * 2, 140 - offset * 10, 8);
          ctx.fill();
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.3 - i * 0.1})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#fff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(card.company, cardX + 12, cardY + 25);
          ctx.fillStyle = "#9ca3af";
          ctx.font = "9px sans-serif";
          ctx.fillText(card.role, cardX + 12, cardY + 42);

          // Match badge
          ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
          ctx.beginPath();
          ctx.roundRect(cardX + 12, cardY + 55, 40, 18, 4);
          ctx.fill();
          ctx.fillStyle = "#22c55e";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText(card.match, cardX + 20, cardY + 67);
        });
      }

      if (currentStep === 3) {
        // Sending animations
        const dots = [];
        for (let i = 0; i < 5; i++) {
          const angle = (t * 2 + i * 1.2) % (Math.PI * 2);
          const radius = 40 + Math.sin(t + i) * 10;
          dots.push({
            x: w / 2 + Math.cos(angle) * radius,
            y: contentY + 80 + Math.sin(angle) * 20,
            alpha: 0.5 + Math.sin(t * 3 + i) * 0.3,
          });
        }

        // Center circle
        ctx.beginPath();
        ctx.arc(w / 2, contentY + 80, 20, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
        ctx.fill();
        ctx.fillStyle = "#8b5cf6";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AI", w / 2, contentY + 85);

        // Orbiting dots
        dots.forEach((dot, i) => {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99, 102, 241, ${dot.alpha})`;
          ctx.fill();

          // Line to center
          ctx.strokeStyle = `rgba(139, 92, 246, ${dot.alpha * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(w / 2, contentY + 80);
          ctx.lineTo(dot.x, dot.y);
          ctx.stroke();
        });

        ctx.textAlign = "left";

        // Status messages
        const msgs = ["Finding recruiters...", "Generating cover letter...", "Customizing resume...", "Sending emails..."];
        const msgIdx = Math.floor(t * 0.5) % msgs.length;
        ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
        ctx.beginPath();
        ctx.roundRect(contentX, contentY + 140, contentW, 24, 4);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.font = "9px sans-serif";
        ctx.fillText("✓ " + msgs[msgIdx], contentX + 8, contentY + 156);
      }

      if (currentStep === 4) {
        // Analytics
        const barHeights = [60, 80, 45, 90, 70, 55, 85];
        const barW = contentW / barHeights.length - 4;

        barHeights.forEach((bh, i) => {
          const animatedH = Math.min(bh, (t - i * 0.3) * 30);
          if (animatedH > 0) {
            const barGrad = ctx.createLinearGradient(0, contentY + 160 - animatedH, 0, contentY + 160);
            barGrad.addColorStop(0, "#8b5cf6");
            barGrad.addColorStop(1, "#6366f1");
            ctx.fillStyle = barGrad;
            ctx.beginPath();
            ctx.roundRect(contentX + i * (barW + 4), contentY + 160 - animatedH, barW, animatedH, [3, 3, 0, 0]);
            ctx.fill();
          }
        });

        // Stats
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("24", w / 2 - 30, contentY + 50);
        ctx.font = "8px sans-serif";
        ctx.fillStyle = "#9ca3af";
        ctx.fillText("Applications", w / 2 - 30, contentY + 62);

        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("12%", w / 2 + 30, contentY + 50);
        ctx.font = "8px sans-serif";
        ctx.fillStyle = "#9ca3af";
        ctx.fillText("Response Rate", w / 2 + 30, contentY + 62);

        ctx.textAlign = "left";
      }

      // App name at top of phone
      ctx.fillStyle = "#8b5cf6";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("JobSwipe AI", w / 2, phoneY + 22);
      ctx.textAlign = "left";

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentStep, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-2xl"
      style={{ minHeight: "360px" }}
    />
  );
}

export default function DemoVideo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev + 1;
      });
    }, 4000);
  };

  const stopAutoPlay = () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetDemo = () => {
    stopAutoPlay();
    setCurrentStep(0);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <section id="demo" className="relative z-10 py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            See How It Works
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Watch an interactive demo of how JobSwipe AI automates your entire job search.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Demo Canvas */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0a0118] shadow-2xl shadow-violet-500/10">
              <AnimatedDemo currentStep={currentStep} isPlaying={isPlaying} />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={isPlaying ? stopAutoPlay : startAutoPlay}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full text-sm font-medium transition-all"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? "Pause" : "Play Demo"}
              </button>
              <button
                onClick={resetDemo}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Step Info */}
          <div className="space-y-6">
            {/* Step indicators */}
            <div className="flex gap-2">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { stopAutoPlay(); setCurrentStep(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? "w-8 bg-violet-500" : "w-4 bg-white/20 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>

            {/* Current step */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
            </div>

            {/* Step list */}
            <div className="space-y-2">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { stopAutoPlay(); setCurrentStep(i); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    i === currentStep
                      ? "bg-violet-500/10 border border-violet-500/30"
                      : "bg-white/5 border border-transparent hover:bg-white/10"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === currentStep ? "bg-violet-500 text-white" : "bg-white/10 text-gray-400"
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm ${i === currentStep ? "text-white font-medium" : "text-gray-400"}`}>
                    {s.title.replace(/^\d+\.\s/, "")}
                  </span>
                  {i === currentStep && (
                    <ChevronRight className="h-4 w-4 text-violet-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
