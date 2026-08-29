import { generateJSON } from "./gemini";
import type { ParsedResume } from "./resume-parser";

export interface MatchResult {
  score: number;
  reasoning: string;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export async function matchJobToProfile(
  resume: ParsedResume,
  jobTitle: string,
  jobDescription: string,
  company: string
): Promise<MatchResult> {
  return await generateJSON(
    `You are an expert job matching algorithm. Analyze how well a candidate matches a job posting.

Return a JSON object:
{
  "score": 85,
  "reasoning": "Detailed explanation of why this score was given",
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"],
  "recommendations": ["Suggestion to improve match"]
}

Score should be 0-100 based on:
- Skills match (40% weight)
- Experience relevance (30% weight)
- Education fit (15% weight)
- Location/salary alignment (15% weight)`,
    `Candidate Profile:
Name: ${resume.name}
Skills: ${resume.skills.join(", ")}
Summary: ${resume.summary}
Experience: ${resume.experience.map((e) => `${e.title} at ${e.company} (${e.duration})`).join("; ")}
Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}
Goals: ${resume.goals}

Job Posting:
Company: ${company}
Title: ${jobTitle}
Description: ${jobDescription}`
  );
}
