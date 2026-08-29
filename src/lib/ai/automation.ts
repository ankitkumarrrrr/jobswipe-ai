import { generateJSON, generateText } from "./gemini";
import type { ParsedResume } from "./resume-parser";

export interface CompanyContact {
  name: string;
  title: string;
  email: string | null;
  emailVerified: boolean;
  linkedinSearchUrl: string;
  linkedinProfileUrl: string | null;
  company: string;
  confidence: "high" | "medium" | "low";
  notes: string;
}

// Find company contacts using Hunter.io + AI
export async function findCompanyContacts(
  company: string,
  jobTitle: string
): Promise<CompanyContact[]> {
  const contacts: CompanyContact[] = [];

  // 1. Try Hunter.io API first (real emails!)
  const hunterKey = process.env.HUNTER_API_KEY;
  if (hunterKey) {
    try {
      const domain = company.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") + ".com";
      const res = await fetch(
        `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterKey}&limit=5`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        const emails = data.data?.emails || [];
        for (const e of emails) {
          if (e.value && (e.type === "generic" || e.confidence > 40)) {
            contacts.push({
              name: `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Recruiter",
              title: e.position || "Talent Acquisition",
              email: e.value,
              emailVerified: e.confidence > 70,
              linkedinSearchUrl: `https://www.google.com/search?q=site:linkedin.com/in+"${encodeURIComponent(e.first_name + " " + e.last_name)}"+"${encodeURIComponent(company)}"`,
              linkedinProfileUrl: null,
              company,
              confidence: e.confidence > 70 ? "high" : e.confidence > 50 ? "medium" : "low",
              notes: `Verified via Hunter.io (${e.confidence}% confidence)`,
            });
          }
        }
      }
    } catch (e) {
      console.log("Hunter.io failed:", e);
    }
  }

  // 2. If Hunter.io didn't find enough, use AI to generate contacts
  if (contacts.length < 3) {
    try {
      const data = await generateJSON(
        `You are an expert recruiter researcher. For a given company, find REAL hiring contacts and their likely email addresses.

RULES:
1. Generate REALISTIC names based on the company's region
2. Generate LIKELY email formats: firstname.lastname@company.com
3. Focus on HR, Talent Acquisition, Engineering Management

Return JSON:
{
  "contacts": [
    {
      "name": "Common name",
      "title": "HR Manager",
      "emailPattern": "firstname.lastname@company.com",
      "confidence": "high|medium|low",
      "notes": "Search LinkedIn"
    }
  ]
}`,
        `Find hiring contacts at ${company} for ${jobTitle}. Region: India. Include 3 contacts.`
      );

      for (const c of (data.contacts || []).slice(0, 3)) {
        const nameParts = (c.name || "").toLowerCase().split(" ");
        const firstName = nameParts[0] || "recruiter";
        const lastName = nameParts[1] || "team";
        const domain = company.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
        
        contacts.push({
          name: c.name || "Recruiter",
          title: c.title || "Talent Acquisition",
          email: `${firstName}.${lastName}@${domain}.com`,
          emailVerified: false,
          linkedinSearchUrl: `https://www.google.com/search?q=site:linkedin.com/in+"${encodeURIComponent(c.name)}"+"${encodeURIComponent(company)}"`,
          linkedinProfileUrl: null,
          company,
          confidence: c.confidence || "medium",
          notes: c.notes || "Verify on LinkedIn",
        });
      }
    } catch {}
  }

  // 3. Always add generic fallback
  if (contacts.length === 0) {
    const domain = company.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
    contacts.push({
      name: "HR Team",
      title: "Talent Acquisition",
      email: `careers@${domain}.com`,
      emailVerified: false,
      linkedinSearchUrl: `https://www.google.com/search?q=site:linkedin.com/in+"${encodeURIComponent(company)}"+"hiring+manager"`,
      linkedinProfileUrl: null,
      company,
      confidence: "low",
      notes: `Generic careers email for ${company}`,
    });
  }

  return contacts.slice(0, 5);
}

// Generate personalized LinkedIn connection message
export async function generateLinkedInMessage(
  resume: ParsedResume,
  jobTitle: string,
  company: string,
  contactName: string,
  contactTitle: string
): Promise<string> {
  try {
    return await generateText(
      `Write a short, professional LinkedIn connection request message (under 280 characters).
Guidelines:
- Be warm but professional
- Mention the specific role you're interested in
- Show genuine interest in the company
- Include one relevant skill or experience
- End with a soft call to action
- Do NOT be salesy or pushy
- Make it feel personal, not templated
- IMPORTANT: Do not mention anything that sounds like you found their contact through AI. Be natural.`,
      `From: ${resume.name} (${resume.summary})
To: ${contactName || "Hiring Manager"} (${contactTitle}) at ${company}
Position: ${jobTitle}
Key skills: ${resume.skills.slice(0, 3).join(", ")}
Recent experience: ${resume.experience[0]?.title} at ${resume.experience[0]?.company}`,
      0.7
    );
  } catch {
    return `Hi ${contactName}, I'm interested in the ${jobTitle} position at ${company}. I'd love to connect and discuss how my experience aligns with your team's needs.`;
  }
}

// Generate personalized email application
export async function generateApplicationEmail(
  resume: ParsedResume,
  jobTitle: string,
  company: string,
  contactName: string
): Promise<{ subject: string; body: string }> {
  try {
    return await generateJSON(
      `Write a compelling job application email. The email should be professional, concise, and personalized.

Return JSON:
{
  "subject": "Compelling subject line (include job title and a hook)",
  "body": "Professional email body"
}

Email guidelines:
- Start with a personalized greeting using the contact's name
- Open with enthusiasm for the specific role
- Highlight 2-3 most relevant qualifications from the resume
- Show knowledge of the company (mention their mission/products)
- Include a clear call to action
- End professionally with signature
- Keep under 250 words
- Tone: confident but not arrogant
- IMPORTANT: Do NOT mention anything about AI or automation. Sound human.`,
      `Applicant: ${resume.name}
Email: ${resume.email}
Phone: ${resume.phone}
Position: ${jobTitle} at ${company}
Recipient: ${contactName}

Skills: ${resume.skills.join(", ")}
Summary: ${resume.summary}
Top Experience: ${resume.experience[0]?.title} at ${resume.experience[0]?.company} - ${resume.experience[0]?.description}`
    );
  } catch {
    return {
      subject: `Application for ${jobTitle} — ${resume.name}`,
      body: `Dear ${contactName},\n\nI am writing to express my strong interest in the ${jobTitle} position at ${company}. With my background in ${resume.skills.slice(0, 3).join(", ")}, I believe I can make a meaningful contribution to your team.\n\n${resume.summary}\n\nI would welcome the opportunity to discuss this role further.\n\nBest regards,\n${resume.name}\n${resume.email}`,
    };
  }
}

// Customize resume for specific job
export async function customizeResumeForJob(
  resume: ParsedResume,
  jobTitle: string,
  jobDescription: string,
  company: string
): Promise<string> {
  try {
    return await generateText(
      `Customize this resume for the specific job application. Make it ATS-friendly.

Return a well-formatted resume with:
- Contact Information
- Professional Summary (tailored to this job)
- Skills (reordered to prioritize relevant ones)
- Work Experience (rewritten to highlight relevant achievements)
- Education

Use strong action verbs, quantify achievements, and mirror keywords from the job description.`,
      `Original Resume:
Name: ${resume.name}
Email: ${resume.email}
Phone: ${resume.phone}
Location: ${resume.location}
Skills: ${resume.skills.join(", ")}
Summary: ${resume.summary}
Experience: ${resume.experience.map((e) => `${e.title} at ${e.company} (${e.duration})\n${e.description}`).join("\n\n")}
Education: ${resume.education.map((e) => `${e.degree} from ${e.institution}`).join("; ")}

Target: ${jobTitle} at ${company}
Job Description: ${jobDescription}`,
      0.3
    );
  } catch {
    return `Customized resume for ${jobTitle} at ${company}\n\n${resume.name}\n${resume.email} | ${resume.phone}\n${resume.location}\n\nSkills: ${resume.skills.join(", ")}\n\n${resume.summary}`;
  }
}

// Generate cover letter
export async function generateCoverLetter(
  resume: ParsedResume,
  jobTitle: string,
  jobDescription: string,
  company: string
): Promise<string> {
  try {
    return await generateText(
      `Write a compelling cover letter for this job application.

Guidelines:
- Address to hiring manager
- Open with genuine enthusiasm for the role and company
- Highlight 2-3 most relevant experiences
- Show knowledge of the company
- Connect skills to job requirements
- Close with strong call to action
- Keep under 350 words
- Professional but warm tone
- IMPORTANT: Sound human, not like AI wrote it.`,
      `From: ${resume.name}
Skills: ${resume.skills.join(", ")}
Summary: ${resume.summary}
Experience: ${resume.experience.slice(0, 3).map((e) => `${e.title} at ${e.company}: ${e.description}`).join("\n")}

Position: ${jobTitle} at ${company}
Description: ${jobDescription}`,
      0.7
    );
  } catch {
    return `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${company}. ${resume.summary}\n\nI would love the opportunity to contribute to your team.\n\nBest regards,\n${resume.name}`;
  }
}
