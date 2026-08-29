"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Video, VideoOff, Mic, MicOff, Monitor, AlertTriangle,
  CheckCircle, Clock, Loader2, Volume2, ChevronRight,
  Shield, EyeOff, Trophy, Phone, FileText, Settings,
} from "lucide-react";
import { toast } from "sonner";

type Phase = "setup" | "active" | "completed";
type SetupStep = "camera" | "mic" | "screen" | "ready";

interface Question { question: string; category: string; }
interface Answer { questionIndex: number; question: string; userAnswer: string; score: number; feedback: string; timeSpent: number; }
interface Violation { type: string; timestamp: Date; description: string; }

export default function AIInterviewPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [setupStep, setSetupStep] = useState<SetupStep>("camera");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [resumeData, setResumeData] = useState<any>(null);
  const [loadingResume, setLoadingResume] = useState(true);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [screenShared, setScreenShared] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(14 * 60);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(120);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load voices for speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voices.length > 0) {
        setVoicesLoaded(true);
        // Find best English voice
        const bestVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) ||
                         voices.find(v => v.lang.startsWith("en") && v.name.includes("Samantha")) ||
                         voices.find(v => v.lang.startsWith("en") && v.name.includes("Alex")) ||
                         voices.find(v => v.lang.startsWith("en")) ||
                         voices[0];
        if (bestVoice) setSelectedVoice(bestVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Load user's resume on mount
  useEffect(() => {
    fetch("/api/resume").then(r => r.json()).then(data => {
      if (data.resume?.parsedData) {
        setResumeData(data.resume.parsedData);
      }
      setLoadingResume(false);
    }).catch(() => setLoadingResume(false));
  }, []);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, [cameraStream]);

  // Anti-cheating
  useEffect(() => {
    if (phase !== "active") return;
    const handleVisibility = () => {
      if (document.hidden) {
        setViolations(prev => [...prev, { type: "tab_switch", timestamp: new Date(), description: "Switched to another tab" }]);
        toast.warning("⚠️ Tab switch detected!");
      }
    };
    const handleBlur = () => {
      setViolations(prev => [...prev, { type: "window_blur", timestamp: new Date(), description: "Left the interview window" }]);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    return () => { document.removeEventListener("visibilitychange", handleVisibility); window.removeEventListener("blur", handleBlur); };
  }, [phase]);

  // Main timer
  useEffect(() => {
    if (phase !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { finishInterview(); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Question timer
  useEffect(() => {
    if (phase !== "active") return;
    setQuestionTimeLeft(120);
    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft(prev => { if (prev <= 1) { moveToNext(); return 0; } return prev - 1; });
    }, 1000);
    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
  }, [currentQuestion, phase]);

  // --- SETUP ---
  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream); setCameraOn(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
      toast.success("Camera enabled!");
      setTimeout(() => setSetupStep("mic"), 1200);
    } catch { toast.error("Camera access denied. Please allow camera in Safari settings."); }
  };

  const enableMic = async () => {
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); setMicOn(true); toast.success("Microphone enabled!"); setTimeout(() => setSetupStep("screen"), 1200); }
    catch { toast.error("Microphone access denied. Please allow mic in Safari settings."); }
  };

  const requestScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getVideoTracks()[0].onended = () => { setScreenShared(false); if (phase === "active") { setViolations(prev => [...prev, { type: "screen_stop", timestamp: new Date(), description: "Stopped screen sharing" }]); } };
      setScreenShared(true); toast.success("Screen sharing enabled!"); setTimeout(() => setSetupStep("ready"), 1200);
    } catch { toast.error("Screen share denied."); }
  };

  // --- LOUD VOICE FUNCTION (Safari compatible) ---
  const speakQuestion = (text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const u = new SpeechSynthesisUtterance(text);
    
    // Maximum volume and clear settings
    u.volume = 1.0;  // MAX volume (0.0 to 1.0)
    u.rate = 0.9;    // Slightly slower for clarity (0.1 to 10)
    u.pitch = 1.0;   // Normal pitch (0 to 2)
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Find the best voice - prefer Google voices for clarity
    let bestVoice = null;
    
    // Priority order for best English voices
    const preferredVoices = [
      "Google UK English Female",
      "Google UK English Male", 
      "Google US English",
      "Samantha",  // macOS
      "Alex",      // macOS
      "Daniel",    // macOS
    ];
    
    // Try to find a preferred voice
    for (const name of preferredVoices) {
      const found = voices.find(v => v.name === name);
      if (found) { bestVoice = found; break; }
    }
    
    // Fallback to any English voice
    if (!bestVoice) {
      bestVoice = voices.find(v => v.lang.startsWith("en"));
    }
    
    // Final fallback to first voice
    if (!bestVoice && voices.length > 0) {
      bestVoice = voices[0];
    }
    
    if (bestVoice) {
      u.voice = bestVoice;
      console.log("Using voice:", bestVoice.name, bestVoice.lang);
    }
    
    u.onstart = () => setAiSpeaking(true);
    u.onend = () => { setAiSpeaking(false); startListening(); };
    u.onerror = (e) => { 
      console.error("Speech error:", e);
      setAiSpeaking(false); 
      startListening(); 
    };
    
    // Workaround for Safari speech synthesis bug
    if (typeof window !== 'undefined') {
      window.speechSynthesis.speak(u);
    }
  };

  // --- START INTERVIEW ---
  const startInterview = async () => {
    if (!jobTitle || !company) { toast.error("Enter job title and company"); return; }
    setGenerating(true);

    try {
      // Generate resume-based questions via Gemini
      const { getGeminiModel } = await import("@/lib/ai/gemini");
      const model = getGeminiModel();

      const resumeContext = resumeData ? `
CANDIDATE RESUME DATA:
Name: ${resumeData.name}
Skills: ${(resumeData.skills || []).join(", ")}
Summary: ${resumeData.summary}
Experience: ${(resumeData.experience || []).map((e: any) => `${e.title} at ${e.company}: ${e.description}`).join("; ")}
Education: ${(resumeData.education || []).map((e: any) => `${e.degree} from ${e.institution}`).join("; ")}
Goals: ${resumeData.goals}
` : "No resume uploaded.";

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `You are an expert technical interviewer for a ${jobTitle} position at ${company}.

${resumeContext}

Generate exactly 7 interview questions based on THIS SPECIFIC CANDIDATE's resume, skills, and experience. Mix these types:
- 2 questions about their specific past projects/experience (from resume)
- 2 technical questions about their listed skills
- 1 behavioral question
- 1 question about why they want this role
- 1 question about career goals

Questions should be natural, conversational, and directly related to what's on their resume.

Return JSON: { "questions": [{ "question": "the question text", "category": "Technical|Behavioral|Experience|Company" }] }

Make questions sound like a real human interviewer speaking naturally.` }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
      });

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let qs: Question[] = [];

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        qs = (parsed.questions || []).slice(0, 7);
      }

      if (qs.length === 0) {
        // Fallback: generate basic questions
        const skills = resumeData?.skills?.slice(0, 3).join(" and ") || "your technology stack";
        qs = [
          { question: `Tell me about yourself and your experience with ${skills}.`, category: "Experience" },
          { question: `Describe a challenging project from your resume and how you handled it.`, category: "Experience" },
          { question: `I see you have experience with ${skills}. Can you walk me through how you've used these in production?`, category: "Technical" },
          { question: `How do you approach debugging complex technical issues?`, category: "Technical" },
          { question: `Why are you interested in the ${jobTitle} role at ${company}?`, category: "Company" },
          { question: `Tell me about a time you worked effectively in a team.`, category: "Behavioral" },
          { question: `Where do you see your career heading in the next few years?`, category: "Experience" },
        ];
      }

      setQuestions(qs);
      setPhase("active");
      setCurrentQuestion(0);
      setAnswers([]);
      setTimeLeft(14 * 60);
      initSpeechRecognition();

      // Speak first question after a short delay
      setTimeout(() => speakQuestion(qs[0].question), 1500);
    } catch (e) {
      console.error("Interview start error:", e);
      toast.error("Failed to generate questions. Using defaults.");
      const fallback = [
        { question: "Tell me about yourself and your background.", category: "Experience" },
        { question: `What interests you about the ${jobTitle} role at ${company}?`, category: "Company" },
        { question: "Describe a challenging project you've worked on.", category: "Experience" },
        { question: "What are your strongest technical skills?", category: "Technical" },
        { question: "How do you handle tight deadlines?", category: "Behavioral" },
        { question: `Why do you want to work at ${company}?`, category: "Company" },
        { question: "Where do you see yourself in 5 years?", category: "Experience" },
      ];
      setQuestions(fallback);
      setPhase("active");
      setCurrentQuestion(0);
      setTimeLeft(14 * 60);
      initSpeechRecognition();
      setTimeout(() => speakQuestion(fallback[0].question), 1500);
    }
    setGenerating(false);
  };

  // --- SPEECH RECOGNITION ---
  const initSpeechRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported. Use Chrome or Edge."); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) setTranscript(prev => prev + " " + final);
    };
    r.onerror = () => {};
    recognitionRef.current = r;
  };

  const startListening = () => {
    if (recognitionRef.current) { try { recognitionRef.current.start(); setIsListening(true); setTranscript(""); } catch {} }
  };

  const stopListening = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} setIsListening(false); }
  };

  // --- SUBMIT & NEXT ---
  const submitAnswer = async () => {
    stopListening();
    const userAnswer = transcript.trim();

    let score = 50; let feedback = "Answer recorded.";
    try {
      const { getGeminiModel } = await import("@/lib/ai/gemini");
      const model = getGeminiModel();
      const r = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Rate this interview answer 0-100. Give brief feedback.\nQuestion: ${questions[currentQuestion]?.question}\nAnswer: ${userAnswer || "No answer"}\nReturn JSON: {"score":0-100,"feedback":"brief"}` }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      });
      const t = r.response.text();
      const m = t.match(/\{[\s\S]*\}/);
      if (m) { const p = JSON.parse(m[0]); score = p.score || 50; feedback = p.feedback || "Recorded."; }
    } catch {
      score = userAnswer.length > 50 ? 70 : userAnswer.length > 20 ? 50 : 30;
      feedback = userAnswer ? "Recorded and scored." : "No answer provided.";
    }

    setAnswers(prev => [...prev, { questionIndex: currentQuestion, question: questions[currentQuestion]?.question || "", userAnswer, score, feedback, timeSpent: 120 - questionTimeLeft }]);
    moveToNext();
  };

  const moveToNext = () => {
    if (currentQuestion < questions.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next); setTranscript(""); setQuestionTimeLeft(120);
      setTimeout(() => speakQuestion(questions[next].question), 500);
    } else { finishInterview(); }
  };

  const finishInterview = () => {
    stopListening(); window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    setPhase("completed");
    cameraStream?.getTracks().forEach(t => t.stop());
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const getScore = () => answers.length === 0 ? 0 : Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length);
  const getGrade = (s: number) => s >= 90 ? { g: "A+", c: "text-green-500", l: "Excellent" } : s >= 80 ? { g: "A", c: "text-green-400", l: "Very Good" } : s >= 70 ? { g: "B+", c: "text-blue-500", l: "Good" } : s >= 60 ? { g: "B", c: "text-blue-400", l: "Above Average" } : s >= 50 ? { g: "C", c: "text-yellow-500", l: "Average" } : { g: "D", c: "text-red-500", l: "Needs Work" };

  // --- SETUP ---
  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">AI Interview Practice</h1>
          <p className="text-gray-500 mt-2">14-minute AI interview — questions based on YOUR resume</p>
        </div>

        {resumeData && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm text-green-700">Resume Loaded</p>
                <p className="text-xs text-green-600">{resumeData.name} — {resumeData.skills?.length || 0} skills, {resumeData.experience?.length || 0} experiences</p>
              </div>
            </CardContent>
          </Card>
        )}
        {!resumeData && !loadingResume && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-semibold text-sm text-amber-700">No Resume Found</p>
                <p className="text-xs text-amber-600">Upload your resume first for personalized questions. <a href="/resume" className="underline">Go to Resume →</a></p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Job Title (e.g., Senior Software Engineer)" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            <Input placeholder="Company (e.g., Google)" value={company} onChange={e => setCompany(e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-orange-500" />Setup Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { step: "camera" as const, label: "Camera", icon: Video, desc: "Enable camera for proctoring" },
              { step: "mic" as const, label: "Microphone", icon: Mic, desc: "Enable mic to speak answers" },
              { step: "screen" as const, label: "Screen Share", icon: Monitor, desc: "Share screen for anti-cheating" },
            ].map(item => (
              <div key={item.step} className={`flex items-center gap-4 p-3 rounded-lg border ${setupStep === item.step ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}>
                <div className={`p-2 rounded-lg ${setupStep === item.step ? "bg-orange-500 text-white" : "bg-gray-100"}`}><item.icon className="w-5 h-5" /></div>
                <div className="flex-1"><p className="font-medium text-sm">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                {setupStep === item.step && <Button size="sm" onClick={() => item.step === "camera" ? enableCamera() : item.step === "mic" ? enableMic() : requestScreen()} className="bg-orange-500 hover:bg-orange-600">Enable</Button>}
                {((item.step === "camera" && cameraOn) || (item.step === "mic" && micOn) || (item.step === "screen" && screenShared)) && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Voice Test */}
        {setupStep === "ready" && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Volume2 className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-sm text-blue-700">Test AI Voice</p>
              </div>
              <p className="text-xs text-blue-600 mb-3">Click below to hear how the AI interviewer will sound:</p>
              <Button size="sm" variant="outline" onClick={() => speakQuestion("Hello! I'm your AI interviewer. I'll be asking you questions based on your resume. Are you ready to begin?")}>
                <Volume2 className="w-4 h-4 mr-2" /> Test Voice
              </Button>
              {selectedVoice && (
                <p className="text-xs text-gray-500 mt-2">Voice: {selectedVoice}</p>
              )}
            </CardContent>
          </Card>
        )}

        {setupStep === "ready" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">All Set!</h3>
              <p className="text-sm text-gray-600 mb-4">Camera, mic, and screen share ready. AI will ask questions based on your resume.</p>
              <Button onClick={startInterview} disabled={generating || !jobTitle || !company} className="bg-orange-500 hover:bg-orange-600 px-8">
                {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Questions...</> : <><Phone className="w-4 h-4 mr-2" />Start Interview</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {cameraOn && (
          <div className="fixed bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-orange-500 shadow-lg z-50">
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">REC</div>
          </div>
        )}
      </div>
    );
  }

  // --- ACTIVE ---
  if (phase === "active") {
    const sc = getScore(); const gr = getGrade(sc);
    return (
      <div className="min-h-screen bg-gray-950 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-500 text-white">AI Interview</Badge>
            <span className="text-sm text-gray-400">{jobTitle} at {company}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /><span className={timeLeft < 120 ? "text-red-400 font-bold" : "text-gray-300"}>{fmt(timeLeft)}</span></div>
            <div className="flex gap-1">{cameraOn ? <Video className="w-4 h-4 text-green-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}{micOn ? <Mic className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400" />}{screenShared ? <Monitor className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}</div>
            {violations.length > 0 && <Badge className="bg-red-500/20 text-red-400"><AlertTriangle className="w-3 h-3 mr-1" />{violations.length}</Badge>}
          </div>
        </div>

        <div className="flex gap-1 mb-4">{questions.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < currentQuestion ? "bg-green-500" : i === currentQuestion ? "bg-orange-500" : "bg-gray-700"}`} />)}</div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-blue-500/20 text-blue-400">Q{currentQuestion + 1}/{questions.length}</Badge>
                  <Badge className="bg-gray-700 text-gray-300">{questions[currentQuestion]?.category}</Badge>
                  <div className="ml-auto text-sm text-gray-400"><Clock className="w-4 h-4 inline mr-1" />{fmt(questionTimeLeft)}</div>
                </div>
                <h2 className="text-xl font-semibold mb-4">{questions[currentQuestion]?.question}</h2>

                {aiSpeaking && (
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg mb-4">
                    <Volume2 className="w-5 h-5 text-blue-400 animate-pulse" />
                    <span className="text-sm text-blue-400">AI is asking...</span>
                    <div className="flex gap-1">{[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: `${8+Math.random()*16}px`, animationDelay: `${i*0.1}s` }} />)}</div>
                  </div>
                )}

                {isListening && !aiSpeaking && (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg mb-4">
                    <Mic className="w-5 h-5 text-green-400 animate-pulse" />
                    <span className="text-sm text-green-400">Listening... Speak your answer</span>
                    <div className="flex gap-1">{[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-green-400 rounded-full animate-pulse" style={{ height: `${8+Math.random()*16}px`, animationDelay: `${i*0.1}s` }} />)}</div>
                  </div>
                )}

                {transcript && <div className="p-3 bg-gray-800 rounded-lg mt-4"><p className="text-xs text-gray-400 mb-1">Your answer:</p><p className="text-sm">{transcript}</p></div>}

                <div className="flex gap-3 mt-4">
                  <Button onClick={submitAnswer} className="bg-orange-500 hover:bg-orange-600">Submit Answer <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  <Button variant="outline" onClick={() => speakQuestion(questions[currentQuestion]?.question || "")} className="border-gray-700"><Volume2 className="w-4 h-4 mr-1" /> Repeat</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800"><CardContent className="p-2">
              <div className="relative rounded-lg overflow-hidden aspect-video bg-gray-800">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE</div>
              </div>
            </CardContent></Card>

            <Card className="bg-gray-900 border-gray-800"><CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Answered</span><span>{answers.length}/{questions.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Score</span><span className={gr.c}>{sc}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Violations</span><span className={violations.length > 0 ? "text-red-400" : "text-green-400"}>{violations.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Time Left</span><span className={timeLeft < 120 ? "text-red-400" : ""}>{fmt(timeLeft)}</span></div>
            </CardContent></Card>

            <Button variant="outline" onClick={finishInterview} className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10">End Interview</Button>
          </div>
        </div>
      </div>
    );
  }

  // --- COMPLETED ---
  if (phase === "completed") {
    const sc = getScore(); const gr = getGrade(sc);
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${gr.c}`} />
          <h1 className="text-3xl font-bold">Interview Complete!</h1>
          <p className="text-gray-500 mt-2">{jobTitle} at {company}</p>
        </div>
        <Card className="border-2 border-orange-200"><CardContent className="p-8 text-center">
          <div className={`text-6xl font-bold ${gr.c}`}>{sc}%</div>
          <div className={`text-2xl font-semibold mt-2 ${gr.c}`}>{gr.g} — {gr.l}</div>
          <p className="text-gray-500 mt-2">{answers.length} questions • {violations.length} violations</p>
        </CardContent></Card>

        {violations.length > 0 && (
          <Card className="border-red-200 bg-red-50"><CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div><p className="font-semibold text-red-700">{violations.length} Violation{violations.length > 1 ? "s" : ""}</p>
            <ul className="text-sm text-red-600">{violations.map((v, i) => <li key={i}>• {v.description} at {v.timestamp.toLocaleTimeString()}</li>)}</ul></div>
          </CardContent></Card>
        )}

        <Card><CardHeader><CardTitle>Question Breakdown</CardTitle></CardHeader><CardContent className="space-y-4">
          {answers.map((a, i) => { const g = getGrade(a.score); return (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-2"><p className="font-medium text-sm flex-1">Q{i+1}: {a.question}</p><Badge className={`${g.c} bg-gray-100`}>{a.score}%</Badge></div>
              <p className="text-sm text-gray-600 mb-1"><strong>Answer:</strong> {a.userAnswer || "(No answer)"}</p>
              <p className="text-sm text-gray-500"><strong>Feedback:</strong> {a.feedback}</p>
              <p className="text-xs text-gray-400 mt-1">Time: {a.timeSpent}s</p>
            </div>
          );})}
        </CardContent></Card>

        <div className="flex gap-3">
          <Button onClick={() => { setPhase("setup"); setSetupStep("camera"); setAnswers([]); setViolations([]); setTimeLeft(14*60); }} className="flex-1 bg-orange-500 hover:bg-orange-600">Practice Again</Button>
          <Button onClick={() => window.location.href = "/jobs"} variant="outline" className="flex-1">Browse Jobs</Button>
        </div>
      </div>
    );
  }

  return null;
}
