import { generateText, generateJSON } from "./gemini";
import type { ParsedResume } from "./resume-parser";

export async function generateCoverLetter(
  resume: ParsedResume,
  jobTitle: string,
  jobDescription: string,
  company: string
): Promise<string> {
  return await generateText(
    `You are an expert cover letter writer. Write a compelling, personalized cover letter for a job application.

Guidelines:
- Address the hiring manager professionally
- Open with enthusiasm for the specific role and company
- Highlight 2-3 most relevant experiences from the resume
- Show knowledge of the company
- Connect the candidate's skills to the job requirements
- Close with a strong call to action
- Keep it under 400 words
- Use a professional but warm tone`,
    `Write a cover letter for this application:

Candidate: ${resume.name}
Skills: ${resume.skills.join(", ")}
Summary: ${resume.summary}
Key Experience: ${resume.experience.slice(0, 3).map((e) => `${e.title} at ${e.company}: ${e.description}`).join("\n")}

Job: ${jobTitle} at ${company}
Description: ${jobDescription}`,
    0.7
  );
}

export async function customizeResume(
  resume: ParsedResume,
  jobTitle: string,
  jobDescription: string,
  company: string
): Promise<string> {
  return await generateText(
    `You are an expert resume writer. Customize a resume for a specific job application.

Return the customized resume as well-formatted text with:
- Contact information
- Professional summary (tailored to the job)
- Skills (reordered to prioritize relevant ones)
- Experience (reworded to highlight relevant achievements)
- Education

Make it ATS-friendly. Use strong action verbs and quantify achievements where possible.`,
    `Original Resume:
Name: ${resume.name}
Email: ${resume.email}
Phone: ${resume.phone}
Location: ${resume.location}
Skills: ${resume.skills.join(", ")}
Summary: ${resume.summary}
Experience: ${resume.experience.map((e) => `${e.title} at ${e.company} (${e.duration})\n${e.description}`).join("\n\n")}
Education: ${resume.education.map((e) => `${e.degree} from ${e.institution} (${e.year})`).join("; ")}

Target Job: ${jobTitle} at ${company}
Job Description: ${jobDescription}`,
    0.3
  );
}

export async function generateLinkedInMessage(
  resume: ParsedResume,
  jobTitle: string,
  company: string,
  hiringManagerName?: string
): Promise<string> {
  return await generateText(
    `Write a short, professional LinkedIn connection request message (under 300 characters).

Guidelines:
- Be concise and personalized
- Mention the specific role
- Show genuine interest in the company
- Don't be salesy or pushy
- End with a soft call to action`,
    `Write a LinkedIn connection request for:
From: ${resume.name} (${resume.summary})
To: ${hiringManagerName || "Hiring Manager"} at ${company}
Regarding: ${jobTitle} position`,
    0.7
  );
}

export async function generateEmailApplication(
  resume: ParsedResume,
  jobTitle: string,
  company: string
): Promise<{ subject: string; body: string }> {
  return await generateJSON(
    `Generate a professional job application email.

Return JSON:
{
  "subject": "Compelling email subject line",
  "body": "Professional email body (under 200 words)"
}

The email should be concise, mention the specific role, highlight 1-2 key qualifications, and express enthusiasm.`,
    `From: ${resume.name} (${resume.email})
Applying for: ${jobTitle} at ${company}
Key skills: ${resume.skills.slice(0, 5).join(", ")}
Experience: ${resume.experience[0]?.title} at ${resume.experience[0]?.company}`
  );
}
