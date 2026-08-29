/**
 * Auto Job Scraper - Fetches jobs from multiple free sources
 * Runs automatically and saves to database
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  salary?: string;
  postedAt?: Date;
  employmentType?: string;
  contactEmail?: string;
}

// ============ FREE API SOURCES ============

// 1. Remotive (Remote tech jobs - 100% free, no auth)
async function scrapeRemotive(keywords: string): Promise<ScrapedJob[]> {
  try {
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keywords)}&limit=25`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || "Remote",
      description: j.description?.substring(0, 500) || "",
      url: j.url,
      source: "remotive",
      salary: j.salary || undefined,
      postedAt: j.publication_date ? new Date(j.publication_date) : undefined,
      employmentType: j.job_type,
    }));
  } catch { return []; }
}

// 2. Arbeitnow (Tech jobs - free, no auth)
async function scrapeArbeitnow(keywords: string): Promise<ScrapedJob[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api?page=1", {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .filter((j: any) => {
        const text = `${j.title} ${j.company_name} ${j.tags?.join(" ")}`.toLowerCase();
        return keywords.toLowerCase().split(" ").some((k) => text.includes(k));
      })
      .slice(0, 25)
      .map((j: any) => ({
        title: j.title,
        company: j.company_name,
        location: j.location || "Remote",
        description: j.description?.substring(0, 500) || "",
        url: j.url,
        source: "arbeitnow",
        remote: j.remote,
      }));
  } catch { return []; }
}

// 3. HN Who's Hiring (Free, no auth)
async function scrapeHNJobs(keywords: string): Promise<ScrapedJob[]> {
  try {
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent("who is hiring " + keywords)}&tags=story&hitsPerPage=3`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: ScrapedJob[] = [];
    
    for (const hit of data.hits || []) {
      // Fetch comments from the HN thread to find job posts
      const commentsRes = await fetch(
        `https://hn.algolia.com/api/v1/items/${hit.objectID}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!commentsRes.ok) continue;
      const comments = await commentsRes.json();
      
      for (const child of (comments.children || []).slice(0, 10)) {
        const text = child.text || "";
        if (text.length > 50 && text.length < 2000) {
          // Extract company name from first line
          const firstLine = text.split("|")[0].replace(/<[^>]*>/g, "").trim();
          const company = firstLine.split(/[*•]/)[0].trim() || "Various";
          
          jobs.push({
            title: `${keywords} at ${company}`,
            company: company.substring(0, 100),
            location: "Remote",
            description: text.replace(/<[^>]*>/g, "").substring(0, 500),
            url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: "hackernews",
          });
        }
      }
    }
    return jobs.slice(0, 15);
  } catch { return []; }
}

// 4. Gemini AI Search (Uses your API key)
async function scrapeGemini(keywords: string, location: string): Promise<ScrapedJob[]> {
  try {
    const { getGeminiModel } = await import("@/lib/ai/gemini");
    const model = getGeminiModel();
    
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Find 15 current real job listings for "${keywords}" in "${location}".
For each job provide EXACTLY this JSON:
{"title":"Job Title","company":"Real Company Name","location":"City, Country","description":"2-3 sentence description","url":"https://actual-url-to-job","salary":"₹X - ₹Y per year or null"}

Return: {"jobs":[...]}

RULES:
- Only REAL companies (Google, Amazon, TCS, Infosys, Wipro, Flipkart, etc.)
- Only jobs that actually exist right now
- URLs must be real career page links
- Salary in INR format`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);
    return (data.jobs || []).map((j: any) => ({
      title: j.title,
      company: j.company,
      location: j.location || location,
      description: j.description || "",
      url: j.url || `https://www.google.com/search?q=${encodeURIComponent(j.title + " " + j.company + " career")}`,
      source: "gemini",
      salary: j.salary || undefined,
    }));
  } catch { return []; }
}

// 5. Jooble API (Free - needs API key from jooble.org/api)
async function scrapeJooble(keywords: string, location: string, apiKey?: string): Promise<ScrapedJob[]> {
  if (!apiKey) return [];
  try {
    const res = await fetch("https://jooble.org/api/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location, page: 1 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).slice(0, 20).map((j: any) => ({
      title: j.title,
      company: j.company || "Unknown",
      location: j.location || location,
      description: j.snippet || "",
      url: j.link || "",
      source: "jooble",
      salary: j.salary || undefined,
    }));
  } catch { return []; }
}

// ============ RECRUITMENT CONTACT FINDER ============

async function findRecruiterEmails(company: string): Promise<string[]> {
  const emails: string[] = [];
  
  // Try Hunter.io API first (free tier: 25 searches/month)
  const hunterKey = process.env.HUNTER_API_KEY;
  if (hunterKey) {
    try {
      const domain = company.toLowerCase().replace(/\s+/g, "") + ".com";
      const res = await fetch(
        `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterKey}&limit=5`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        const hunterEmails = data.data?.emails || [];
        for (const e of hunterEmails) {
          if (e.value && (e.type === "generic" || e.confidence > 50)) {
            emails.push(e.value);
          }
        }
      }
    } catch {}
  }
  
  // Try Gemini AI web search
  if (emails.length === 0) {
    try {
      const { getGeminiModel } = await import("@/lib/ai/gemini");
      const model = getGeminiModel();
      
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Find the HR/recruitment email address for ${company}. 
Return ONLY the email addresses you find, one per line.
If you can't find any, return "NOT_FOUND"
Do not make up emails.`
          }]
        }],
        generationConfig: { temperature: 0.1 },
      });

      const text = result.response.text();
      const foundEmails = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g);
      if (foundEmails) emails.push(...foundEmails);
    } catch {}
  }
  
  // Add common patterns as fallback
  if (emails.length === 0) {
    const patterns = [
      `careers@${company.toLowerCase().replace(/\s+/g, "")}.com`,
      `hr@${company.toLowerCase().replace(/\s+/g, "")}.com`,
      `jobs@${company.toLowerCase().replace(/\s+/g, "")}.com`,
    ];
    emails.push(...patterns);
  }
  
  return [...new Set(emails)].slice(0, 5);
}

async function findRecruiterLinkedIn(company: string): Promise<string> {
  return `https://www.google.com/search?q=site:linkedin.com/in+%22Recruiter%22+%22${encodeURIComponent(company)}%22`;
}

// ============ MAIN SCRAPING ENGINE ============

export async function scrapeAllSources(
  keywords: string,
  location: string = "India"
): Promise<{ jobs: ScrapedJob[]; sources: string[]; totalSaved: number }> {
  console.log(`🔍 Starting job scrape: "${keywords}" in "${location}"`);
  
  const allJobs: ScrapedJob[] = [];
  const sources: string[] = [];

  // Run all scrapers in parallel
  const [remotive, arbeitnow, hn, gemini] = await Promise.allSettled([
    scrapeRemotive(keywords),
    scrapeArbeitnow(keywords),
    scrapeHNJobs(keywords),
    scrapeGemini(keywords, location),
  ]);

  if (remotive.status === "fulfilled" && remotive.value.length > 0) {
    allJobs.push(...remotive.value);
    sources.push("Remotive");
  }
  if (arbeitnow.status === "fulfilled" && arbeitnow.value.length > 0) {
    allJobs.push(...arbeitnow.value);
    sources.push("Arbeitnow");
  }
  if (hn.status === "fulfilled" && hn.value.length > 0) {
    allJobs.push(...hn.value);
    sources.push("HackerNews");
  }
  if (gemini.status === "fulfilled" && gemini.value.length > 0) {
    allJobs.push(...gemini.value);
    sources.push("Gemini AI");
  }

  console.log(`📊 Found ${allJobs.length} jobs from: ${sources.join(", ")}`);

  // Save to database
  let savedCount = 0;
  for (const job of allJobs) {
    try {
      // Find recruiter contact info
      let contactEmails: string[] = [];
      if (job.company && job.company !== "Various" && job.company !== "Unknown") {
        contactEmails = await findRecruiterEmails(job.company);
      }

      await prisma.job.create({
        data: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          requirements: "[]",
          url: job.url,
          source: job.source,
          salaryMin: job.salary || null,
          postedAt: job.postedAt || new Date(),
        },
      });
      savedCount++;
    } catch (e) {
      // Duplicate or error, skip silently
    }
  }

  console.log(`✅ Saved ${savedCount} new jobs to database`);

  return { jobs: allJobs, sources, totalSaved: savedCount };
}

// ============ AUTO-APPLY ENGINE ============

export async function autoApplyToJob(
  jobId: string,
  userId: string
): Promise<{
  success: boolean;
  contacts: any[];
  customizedResume: string;
  coverLetter: string;
  emailBody: string;
  linkedinMessage: string;
}> {
  // Get job details
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  // Get user profile and resume
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, resume: true },
  });
  if (!user) throw new Error("User not found");

  const resumeData = user.resume?.parsedData ? JSON.parse(user.resume.parsedData as string) : null;
  const skills = resumeData?.skills?.join(", ") || "";
  const experience = resumeData?.experience?.map((e: any) => `${e.title} at ${e.company}`).join(", ") || "";

  // Find recruiter contacts
  const contactEmails = await findRecruiterEmails(job.company);
  const linkedinSearch = await findRecruiterLinkedIn(job.company);

  // Generate AI content
  let customizedResume = "";
  let coverLetter = "";
  let emailBody = "";
  let linkedinMessage = "";

  try {
    const { getGeminiModel } = await import("@/lib/ai/gemini");
    const model = getGeminiModel();

    // Generate all outreach materials
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `Generate job application materials for:
Position: ${job.title} at ${job.company}
Candidate: ${user.name}
Skills: ${skills}
Experience: ${experience}
Location: ${job.location}
Job Description: ${job.description?.substring(0, 500)}

Generate:
1. Customized resume summary (emphasizing relevant skills)
2. Cover letter (3 paragraphs, personalized to company)
3. Email body (professional, 2-3 sentences)
4. LinkedIn connection message (under 280 characters)

Return JSON:
{"resumeSummary":"...","coverLetter":"...","emailBody":"...","linkedinMessage":"..."}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);
    customizedResume = data.resumeSummary || "";
    coverLetter = data.coverLetter || "";
    emailBody = data.emailBody || "";
    linkedinMessage = data.linkedinMessage || "";
  } catch (e) {
    console.error("AI generation failed:", e);
    // Fallback templates
    customizedResume = `Experienced professional with skills in ${skills}. ${experience}`;
    coverLetter = `Dear Hiring Manager,\n\nI am writing to express my interest in the ${job.title} position at ${job.company}. With my background in ${skills}, I believe I would be a valuable addition to your team.\n\n${experience}\n\nI would welcome the opportunity to discuss how my skills align with your needs.\n\nBest regards,\n${user.name}`;
    emailBody = `I am interested in the ${job.title} position at ${job.company}. I have experience in ${skills} and would love to contribute to your team.`;
    linkedinMessage = `Hi! I'm interested in the ${job.title} role at ${job.company}. I have experience in ${skills} and would love to connect.`;
  }

  // Build contacts list
  const contacts = contactEmails.map((email, i) => ({
    email,
    title: i === 0 ? "HR Team" : i === 1 ? "Recruiting Team" : "Talent Acquisition",
    company: job.company,
    linkedinSearch,
  }));

  // Send emails automatically
  let emailsSent = 0;
  for (const contact of contacts) {
    try {
      // Import email service
      const { sendEmail } = await import("@/lib/email");
      await sendEmail({
        to: contact.email,
        subject: `Application for ${job.title} - ${user.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Dear ${contact.title},</p>
            <p>${emailBody}</p>
            <p>${coverLetter}</p>
            <br/>
            <p>Best regards,<br/>
            <strong>${user.name}</strong><br/>
            ${user.email}<br/>
            ${user.profile?.phone || ""}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
            <p style="font-size: 11px; color: #999;">Sent via JobSwipe AI</p>
          </div>
        `,
      });
      emailsSent++;
    } catch (e) {
      console.error(`Failed to send email to ${contact.email}:`, e);
    }
  }

  // Update job posting application count if it's a posted job
  try {
    await prisma.jobPosting.updateMany({
      where: { id: jobId },
      data: { applications: { increment: 1 } },
    });
  } catch {}

  // Save application to database
  await prisma.application.create({
    data: {
      userId,
      jobId,
      status: emailsSent > 0 ? "SENT" : "DRAFT",
      customizedResume,
      coverLetter,
      emailBody,
      linkedinMessage,
      sentAt: emailsSent > 0 ? new Date() : null,
    },
  });

  // Update job view count (applications is a relation, not a number field)
  // The application is already saved above, count is tracked via Application table

  return {
    success: true,
    contacts,
    customizedResume,
    coverLetter,
    emailBody,
    linkedinMessage,
  };
}

// ============ SCHEDULED SCRAPING ============

export async function runScheduledScrape() {
  const searchTerms = [
    "software engineer",
    "react developer",
    "full stack developer",
    "frontend developer",
    "backend developer",
    "data scientist",
    "product manager",
    "marketing manager",
    "ui ux designer",
    "devops engineer",
  ];

  for (const term of searchTerms) {
    await scrapeAllSources(term, "India");
    // Rate limiting: wait 2 seconds between searches
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("✅ Scheduled scrape complete!");
}
