"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Send, ArrowRight, ArrowLeft, Building2, Code, Brain,
  Loader2, Check, X, RotateCcw, Trophy, MessageSquare, Clock, Target,
} from "lucide-react";
import { toast } from "sonner";

const COMPANIES = [
  { id: "tcs", name: "TCS", logo: "T", color: "bg-blue-500", difficulty: "Easy-Medium", focus: "Aptitude, Core CS, Verbal" },
  { id: "infosys", name: "Infosys", logo: "I", color: "bg-purple-500", difficulty: "Easy-Medium", focus: "Puzzle, Logic, Programming" },
  { id: "wipro", name: "Wipro", logo: "W", color: "bg-cyan-500", difficulty: "Easy", focus: "Basic CS, Communication" },
  { id: "hcl", name: "HCL", logo: "H", color: "bg-red-500", difficulty: "Easy", focus: "Technical Basics, Aptitude" },
  { id: "cognizant", name: "Cognizant", logo: "C", color: "bg-indigo-500", difficulty: "Medium", focus: "OOPs, DBMS, Programming" },
  { id: "accenture", name: "Accenture", logo: "A", color: "bg-violet-500", difficulty: "Medium", focus: "Behavioral, Technical, Case Study" },
  { id: "amazon", name: "Amazon", logo: "A", color: "bg-orange-500", difficulty: "Hard", focus: "Leadership Principles, DSA, System Design" },
  { id: "google", name: "Google", logo: "G", color: "bg-green-500", difficulty: "Very Hard", focus: "DSA, Algorithms, Problem Solving" },
  { id: "microsoft", name: "Microsoft", logo: "M", color: "bg-blue-600", difficulty: "Hard", focus: "DSA, OOPs, System Design" },
  { id: "flipkart", name: "Flipkart", logo: "F", color: "bg-yellow-500", difficulty: "Hard", focus: "DSA, CS Fundamentals, Puzzles" },
];

const ROLES = [
  { id: "sde", name: "Software Development Engineer", icon: Code },
  { id: "data", name: "Data Analyst / Scientist", icon: Target },
  { id: "fullstack", name: "Full Stack Developer", icon: Code },
  { id: "ml", name: "ML Engineer", icon: Brain },
  { id: "devops", name: "DevOps Engineer", icon: Code },
  { id: "frontend", name: "Frontend Developer", icon: Code },
];

interface Message {
  role: "ai" | "user";
  content: string;
  feedback?: string;
  score?: number;
}

export default function MockInterviewPage() {
  const [phase, setPhase] = useState<"select" | "interview" | "results">("select");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [scores, setScores] = useState<{ question: string; score: number; feedback: string }[]>([]);
  const [timer, setTimer] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const maxQuestions = 5;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "interview") {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const startInterview = async () => {
    if (!selectedCompany || !selectedRole) {
      toast.error("Please select both company and role");
      return;
    }
    setPhase("interview");
    setMessages([]);
    setQuestionCount(0);
    setTotalScore(0);
    setScores([]);
    setTimer(0);

    const company = COMPANIES.find(c => c.id === selectedCompany);
    const role = ROLES.find(r => r.id === selectedRole);

    setLoading(true);
    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          company: company?.name,
          role: role?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      setMessages([{ role: "ai", content: data.question }]);
      setQuestionCount(1);
    } catch (error: any) {
      toast.error("Failed to start interview", { description: error.message });
      setPhase("select");
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error("Please type an answer");
      return;
    }

    const userMessage = currentAnswer.trim();
    setCurrentAnswer("");
    setLoading(true);

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const company = COMPANIES.find(c => c.id === selectedCompany);
      const role = ROLES.find(r => r.id === selectedRole);

      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          company: company?.name,
          role: role?.name,
          question: messages[messages.length - 1]?.content,
          answer: userMessage,
          questionNumber: questionCount,
          totalQuestions: maxQuestions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate");

      const score = data.score || 5;
      setTotalScore(prev => prev + score);
      setScores(prev => [...prev, {
        question: messages[messages.length - 1]?.content,
        score,
        feedback: data.feedback,
      }]);

      setMessages(prev => [...prev, {
        role: "ai",
        content: data.nextQuestion || "Interview complete!",
        feedback: data.feedback,
        score,
      }]);

      if (data.nextQuestion) {
        setQuestionCount(prev => prev + 1);
      } else {
        // Interview finished
        setTimeout(() => setPhase("results"), 1000);
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    }
    setLoading(false);
  };

  const resetInterview = () => {
    setPhase("select");
    setSelectedCompany(null);
    setSelectedRole(null);
    setMessages([]);
    setScores([]);
    setTotalScore(0);
    setQuestionCount(0);
    setTimer(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const avgScore = scores.length > 0 ? (totalScore / scores.length).toFixed(1) : "0";
  const grade = totalScore / Math.max(scores.length, 1) >= 8 ? "Excellent" :
    totalScore / Math.max(scores.length, 1) >= 6 ? "Good" :
    totalScore / Math.max(scores.length, 1) >= 4 ? "Average" : "Needs Improvement";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mock Interview</h1>
          <p className="text-gray-500 mt-1">Practice with AI — company-specific questions with real-time feedback</p>
        </div>
        <Badge className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white">
          <Brain className="h-3 w-3 mr-1" /> AI Interviewer
        </Badge>
      </div>

      {/* Select Phase */}
      {phase === "select" && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-violet-500" /> Select Company</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {COMPANIES.map(company => (
                  <button key={company.id} onClick={() => setSelectedCompany(company.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${selectedCompany === company.id
                      ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-300"
                      : "border-gray-200 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-500/30"
                    }`}>
                    <div className={`h-10 w-10 rounded-lg ${company.color} flex items-center justify-center text-white font-bold mx-auto mb-2`}>{company.logo}</div>
                    <p className="text-sm font-medium">{company.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{company.difficulty}</p>
                  </button>
                ))}
              </div>
              {selectedCompany && (
                <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/20 rounded-xl">
                  <p className="text-xs text-violet-700 dark:text-violet-400">Focus areas: {COMPANIES.find(c => c.id === selectedCompany)?.focus}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4 text-violet-500" /> Select Role</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLES.map(role => (
                  <button key={role.id} onClick={() => setSelectedRole(role.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${selectedRole === role.id
                      ? "border-violet-400 bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-300"
                      : "border-gray-200 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-500/30"
                    }`}>
                    <role.icon className="h-6 w-6 text-violet-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">{role.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={startInterview} disabled={!selectedCompany || !selectedRole}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white h-12">
            <Sparkles className="h-4 w-4 mr-2" /> Start Mock Interview ({maxQuestions} Questions)
          </Button>
        </>
      )}

      {/* Interview Phase */}
      {phase === "interview" && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${COMPANIES.find(c => c.id === selectedCompany)?.color} flex items-center justify-center text-white font-bold`}>
                    {COMPANIES.find(c => c.id === selectedCompany)?.logo}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{COMPANIES.find(c => c.id === selectedCompany)?.name} Interview</p>
                    <p className="text-xs text-gray-500">{ROLES.find(r => r.id === selectedRole)?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {questionCount}/{maxQuestions}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatTime(timer)}</span>
                  <span className="flex items-center gap-1"><Trophy className="h-4 w-4" /> {totalScore}/{questionCount * 10}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="space-y-4 min-h-[300px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 border rounded-bl-md"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.feedback && (
                    <div className={`mt-3 pt-3 border-t ${msg.role === "user" ? "border-violet-400" : "border-gray-200 dark:border-gray-700"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">Feedback:</span>
                        <Badge className={`text-xs ${msg.score && msg.score >= 7 ? "bg-green-100 text-green-700" : msg.score && msg.score >= 4 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {msg.score}/10
                        </Badge>
                      </div>
                      <p className="text-xs opacity-80">{msg.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-bl-md p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Answer Input */}
          {questionCount <= maxQuestions && !loading && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Textarea value={currentAnswer} onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here... Be detailed and structured."
                  rows={4}
                  onKeyDown={e => { if (e.key === "Enter" && e.metaKey) submitAnswer(); }} />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Press ⌘+Enter to submit</p>
                  <Button onClick={submitAnswer} disabled={!currentAnswer.trim()}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                    <Send className="h-4 w-4 mr-2" /> Submit Answer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Results Phase */}
      {phase === "results" && (
        <>
          <Card className="border-green-200 bg-green-50/50 dark:border-green-500/20 dark:bg-green-500/5">
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Interview Complete!</h2>
              <p className="text-gray-500 mb-6">
                {COMPANIES.find(c => c.id === selectedCompany)?.name} — {ROLES.find(r => r.id === selectedRole)?.name}
              </p>

              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-8">
                <div>
                  <p className="text-3xl font-bold text-violet-600">{avgScore}</p>
                  <p className="text-xs text-gray-500">Avg Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{totalScore}</p>
                  <p className="text-xs text-gray-500">Total Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-amber-600">{formatTime(timer)}</p>
                  <p className="text-xs text-gray-500">Duration</p>
                </div>
              </div>

              <Badge className={`text-sm px-4 py-1 ${
                grade === "Excellent" ? "bg-green-100 text-green-700" :
                grade === "Good" ? "bg-blue-100 text-blue-700" :
                grade === "Average" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {grade}
              </Badge>
            </CardContent>
          </Card>

          {/* Question-wise Breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Question-wise Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {scores.map((s, i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Q{i + 1}</p>
                      <p className="text-sm mt-1">{s.question}</p>
                    </div>
                    <Badge className={`shrink-0 ${s.score >= 7 ? "bg-green-100 text-green-700" : s.score >= 4 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {s.score}/10
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{s.feedback}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={resetInterview}>
              <RotateCcw className="h-4 w-4 mr-2" /> New Interview
            </Button>
            <Button onClick={() => window.location.href = "/jobs"} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <ArrowRight className="h-4 w-4 mr-2" /> Practice More
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
