export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  goals: string | null;
  location: string | null;
  phone: string | null;
  linkedinUrl: string | null;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
  skills: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  field: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  description: string;
  requirements: string[];
  url: string;
  source: string;
  postedAt: string | null;
  matchScore?: number;
}

export interface Application {
  id: string;
  job: Job;
  status: ApplicationStatus;
  customizedResume: string | null;
  coverLetter: string | null;
  emailBody: string | null;
  linkedinMessage: string | null;
  sentAt: string | null;
  responseAt: string | null;
  createdAt: string;
}

export type ApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "SENT"
  | "VIEWED"
  | "RESPONDED"
  | "INTERVIEW"
  | "REJECTED";

export type Plan = "FREE" | "BASIC" | "PREMIUM";

export interface Subscription {
  plan: Plan;
  applicationsUsed: number;
  applicationsLimit: number;
  startDate: string;
  endDate: string | null;
}

export interface DashboardStats {
  totalApplications: number;
  applicationsToday: number;
  applicationsThisMonth: number;
  responseRate: number;
  interviewRequests: number;
  matchScore: number;
}

export interface ResumeData {
  rawText: string;
  parsedData: {
    skills: string[];
    experience: ExperienceItem[];
    education: EducationItem[];
    goals: string;
    summary: string;
  };
}

export interface SwipeAction {
  jobId: string;
  action: "LIKE" | "DISLIKE";
}
