"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  User, GraduationCap, Code, FolderGit2, Award, Sparkles,
  ArrowRight, ArrowLeft, Download, Plus, Trash2, Loader2, Check,
  Briefcase, FileText, Target,
} from "lucide-react";
import { toast } from "sonner";

interface ResumeData {
  personal: { name: string; email: string; phone: string; location: string; linkedin: string; github: string };
  education: { degree: string; institution: string; year: string; cgpa: string; stream: string }[];
  skills: string[];
  projects: { name: string; description: string; techStack: string; link: string }[];
  certifications: { name: string; issuer: string; year: string }[];
  summary: string;
  targetRole: string;
}

const STEPS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Code },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "summary", label: "AI Summary", icon: Sparkles },
];

const SUGGESTED_SKILLS: Record<string, string[]> = {
  "Software Engineer": ["JavaScript", "TypeScript", "Python", "React", "Node.js", "SQL", "Git", "AWS", "Docker", "REST APIs"],
  "Data Analyst": ["Python", "SQL", "Excel", "Tableau", "Power BI", "Statistics", "Pandas", "NumPy", "Machine Learning", "Data Visualization"],
  "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Next.js", "Tailwind CSS", "Node.js", "MongoDB", "REST APIs", "Git"],
  "ML Engineer": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "SQL", "Docker", "AWS", "MLOps"],
  "DevOps Engineer": ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Ansible", "Git", "Python", "Bash"],
  "Mobile Developer": ["React Native", "Flutter", "Dart", "Swift", "Kotlin", "Firebase", "REST APIs", "Git", "UI/UX", "TypeScript"],
};

export default function FresherResumePage() {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>({
    personal: { name: "", email: "", phone: "", location: "", linkedin: "", github: "" },
    education: [{ degree: "B.Tech", institution: "", year: "", cgpa: "", stream: "Computer Science" }],
    skills: [],
    projects: [{ name: "", description: "", techStack: "", link: "" }],
    certifications: [],
    summary: "",
    targetRole: "",
  });

  const updatePersonal = (field: string, value: string) => {
    setResumeData(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setResumeData(prev => {
      const edu = [...prev.education];
      edu[index] = { ...edu[index], [field]: value };
      return { ...prev, education: edu };
    });
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "", cgpa: "", stream: "" }],
    }));
  };

  const removeEducation = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const toggleSkill = (skill: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const addCustomSkill = (skill: string) => {
    if (skill.trim() && !resumeData.skills.includes(skill.trim())) {
      setResumeData(prev => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
    }
  };

  const updateProject = (index: number, field: string, value: string) => {
    setResumeData(prev => {
      const proj = [...prev.projects];
      proj[index] = { ...proj[index], [field]: value };
      return { ...prev, projects: proj };
    });
  };

  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, { name: "", description: "", techStack: "", link: "" }],
    }));
  };

  const removeProject = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const addCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", issuer: "", year: "" }],
    }));
  };

  const updateCertification = (index: number, field: string, value: string) => {
    setResumeData(prev => {
      const certs = [...prev.certifications];
      certs[index] = { ...certs[index], [field]: value };
      return { ...prev, certifications: certs };
    });
  };

  const removeCertification = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const generateAISummary = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/fresher-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResumeData(prev => ({ ...prev, summary: data.summary }));
      toast.success("AI summary generated!", { description: "Professional summary tailored to your target role" });
    } catch (error: any) {
      toast.error("Generation failed", { description: error.message });
    }
    setGenerating(false);
  };

  const generateFullResume = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/fresher-resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGenerated(true);
      toast.success("Resume generated!", { description: "Your professional resume is ready" });
    } catch (error: any) {
      toast.error("Generation failed", { description: error.message });
    }
    setGenerating(false);
  };

  const currentSuggestions = resumeData.targetRole ? SUGGESTED_SKILLS[resumeData.targetRole] || SUGGESTED_SKILLS["Software Engineer"] : SUGGESTED_SKILLS["Software Engineer"];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fresher Resume Builder</h1>
          <p className="text-gray-500 mt-1">Build a professional resume from scratch — no experience needed</p>
        </div>
        <Badge className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white">
          <Sparkles className="h-3 w-3 mr-1" /> AI Powered
        </Badge>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    i === step
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
                      : i < step
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-violet-500" /> Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input value={resumeData.personal.name} onChange={e => updatePersonal("name", e.target.value)} placeholder="Ankit Kumar" /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={resumeData.personal.email} onChange={e => updatePersonal("email", e.target.value)} placeholder="ankit@gmail.com" /></div>
              <div className="space-y-2"><Label>Phone *</Label><Input value={resumeData.personal.phone} onChange={e => updatePersonal("phone", e.target.value)} placeholder="+91 98765 43210" /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={resumeData.personal.location} onChange={e => updatePersonal("location", e.target.value)} placeholder="Bangalore, India" /></div>
              <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={resumeData.personal.linkedin} onChange={e => updatePersonal("linkedin", e.target.value)} placeholder="https://linkedin.com/in/your-profile" /></div>
              <div className="space-y-2"><Label>GitHub URL</Label><Input value={resumeData.personal.github} onChange={e => updatePersonal("github", e.target.value)} placeholder="https://github.com/yourusername" /></div>
            </div>
            <div className="space-y-2"><Label>Target Role *</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(SUGGESTED_SKILLS).map(role => (
                  <Badge key={role} onClick={() => setResumeData(prev => ({ ...prev, targetRole: role }))} className={`cursor-pointer transition-all ${resumeData.targetRole === role ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-violet-100 dark:bg-gray-800 dark:text-gray-400"}`}>{role}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-violet-500" /> Education</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {resumeData.education.map((edu, i) => (
              <div key={i} className="p-4 border rounded-xl space-y-4 relative">
                {resumeData.education.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => removeEducation(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Degree *</Label><Input value={edu.degree} onChange={e => updateEducation(i, "degree", e.target.value)} placeholder="B.Tech in Computer Science" /></div>
                  <div className="space-y-2"><Label>Institution *</Label><Input value={edu.institution} onChange={e => updateEducation(i, "institution", e.target.value)} placeholder="IIT Delhi" /></div>
                  <div className="space-y-2"><Label>Year of Graduation</Label><Input value={edu.year} onChange={e => updateEducation(i, "year", e.target.value)} placeholder="2026" /></div>
                  <div className="space-y-2"><Label>CGPA / Percentage</Label><Input value={edu.cgpa} onChange={e => updateEducation(i, "cgpa", e.target.value)} placeholder="8.5 / 10 or 85%" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Stream / Branch</Label><Input value={edu.stream} onChange={e => updateEducation(i, "stream", e.target.value)} placeholder="Computer Science & Engineering" /></div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addEducation} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add Another Education</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4 text-violet-500" /> Skills</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {resumeData.targetRole && (
              <div className="p-3 bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/20 rounded-xl">
                <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-2">💡 AI Suggested Skills for {resumeData.targetRole}:</p>
                <div className="flex flex-wrap gap-2">
                  {currentSuggestions.map(skill => (
                    <Badge key={skill} onClick={() => toggleSkill(skill)} className={`cursor-pointer transition-all ${resumeData.skills.includes(skill) ? "bg-violet-500 text-white" : "bg-white text-gray-600 border hover:bg-violet-100 dark:bg-gray-800 dark:text-gray-400"}`}>{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-2">Selected Skills ({resumeData.skills.length})</p>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-xl">
                {resumeData.skills.length === 0 && <span className="text-sm text-gray-400">Click skills above or add custom ones below</span>}
                {resumeData.skills.map(skill => (
                  <Badge key={skill} className="bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 cursor-pointer" onClick={() => toggleSkill(skill)}>
                    {skill} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add a custom skill..." id="custom-skill" onKeyDown={e => {
                if (e.key === "Enter") { addCustomSkill((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }
              }} />
              <Button variant="outline" onClick={() => {
                const input = document.getElementById("custom-skill") as HTMLInputElement;
                if (input) { addCustomSkill(input.value); input.value = ""; }
              }}>Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FolderGit2 className="h-4 w-4 text-violet-500" /> Projects</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {resumeData.projects.map((proj, i) => (
              <div key={i} className="p-4 border rounded-xl space-y-4 relative">
                {resumeData.projects.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => removeProject(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2"><Label>Project Name *</Label><Input value={proj.name} onChange={e => updateProject(i, "name", e.target.value)} placeholder="E-commerce Platform / Weather App / Chat App" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Description *</Label><Textarea value={proj.description} onChange={e => updateProject(i, "description", e.target.value)} placeholder="Built a full-stack e-commerce platform with user authentication, product catalog, and payment integration. Handles 1000+ concurrent users." rows={3} /></div>
                  <div className="space-y-2"><Label>Tech Stack</Label><Input value={proj.techStack} onChange={e => updateProject(i, "techStack", e.target.value)} placeholder="React, Node.js, MongoDB, Stripe" /></div>
                  <div className="space-y-2"><Label>Project Link</Label><Input value={proj.link} onChange={e => updateProject(i, "link", e.target.value)} placeholder="https://github.com/you/project" /></div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addProject} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add Another Project</Button>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">💡 Pro Tip: Include 2-3 projects. Use action verbs (Built, Developed, Implemented) and mention impact metrics (reduced load time by 40%, handles 1000+ users).</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-violet-500" /> Certifications</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {resumeData.certifications.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Award className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No certifications added yet</p>
                <p className="text-xs mt-1">This section is optional — skip if you don&apos;t have any</p>
              </div>
            )}
            {resumeData.certifications.map((cert, i) => (
              <div key={i} className="p-4 border rounded-xl space-y-4 relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => removeCertification(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Certification Name</Label><Input value={cert.name} onChange={e => updateCertification(i, "name", e.target.value)} placeholder="AWS Cloud Practitioner" /></div>
                  <div className="space-y-2"><Label>Issuer</Label><Input value={cert.issuer} onChange={e => updateCertification(i, "issuer", e.target.value)} placeholder="Amazon Web Services" /></div>
                  <div className="space-y-2"><Label>Year</Label><Input value={cert.year} onChange={e => updateCertification(i, "year", e.target.value)} placeholder="2025" /></div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addCertification} className="w-full"><Plus className="h-4 w-4 mr-2" /> Add Certification</Button>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">💡 Great certifications for freshers: AWS Cloud Practitioner, Google Data Analytics, Meta Front-End Developer, HackerRank certificates, Cisco CCNA.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" /> AI Professional Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">AI will generate a professional summary based on your education, skills, and projects.</p>
            {resumeData.summary ? (
              <div className="p-4 bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 rounded-xl">
                <p className="text-sm text-green-700 dark:text-green-400 whitespace-pre-wrap">{resumeData.summary}</p>
              </div>
            ) : (
              <Button onClick={generateAISummary} disabled={generating} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {generating ? "Generating..." : "Generate AI Summary"}
              </Button>
            )}
            <div className="space-y-2"><Label>Or write your own</Label>
              <Textarea value={resumeData.summary} onChange={e => setResumeData(prev => ({ ...prev, summary: e.target.value }))} placeholder="Motivated Computer Science student with strong fundamentals in..." rows={4} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={generateFullResume} disabled={generating} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            {generating ? "Building Resume..." : "Generate Resume"}
          </Button>
        )}
      </div>

      {/* Generated Resume Preview */}
      {generated && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-500/20 dark:bg-green-500/5">
          <CardContent className="p-6 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-2">Resume Generated!</h3>
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">Your professional fresher resume is ready. You can find it in Resume Versions.</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => window.location.href = "/resume-versions"} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="h-4 w-4 mr-2" /> View Resume
              </Button>
              <Button onClick={() => window.location.href = "/jobs"} variant="outline">
                <Briefcase className="h-4 w-4 mr-2" /> Start Applying
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
