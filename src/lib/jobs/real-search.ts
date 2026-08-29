/**
 * Real-time Job Search Service
 * Uses Gemini AI to search the web and compile real job listings
 */
import { getGeminiModel } from '../ai/gemini';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RealJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  salary?: string;
  postedAt?: Date;
  employmentType?: string;
}

// Search for real jobs using Gemini AI (searches the web for current job listings)
export async function searchJobsFromWeb(keywords: string, location: string = 'India'): Promise<RealJob[]> {
  const jobs: RealJob[] = [];

  try {
    const model = getGeminiModel();
    
    const prompt = `Search the web for current real job listings for "${keywords}" in "${location}". 
Find actual job postings from real companies that are currently hiring.

For each job found, provide:
- Job title
- Company name (REAL company, not made up)
- Location
- Job description (brief summary)
- URL to the actual job posting
- Source (which job board it's from)
- Salary range if available
- Employment type (full-time, contract, etc.)

Find at least 10-15 real job listings. Focus on:
- Major job boards: LinkedIn, Indeed, Naukri, Glassdoor, AngelList
- Direct company career pages
- Startup job boards

Return JSON format:
{
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "description": "Brief job description",
      "url": "https://actual-url-to-job-posting",
      "source": "linkedin|indeed|naukri|company_website",
      "salary": "₹X - ₹Y per year" or null,
      "employmentType": "Full-time|Contract|Part-time"
    }
  ]
}

IMPORTANT: 
- Only include REAL job listings you can find on the web
- URLs must be actual working links to job postings
- Company names must be real companies
- Do NOT fabricate or make up job listings`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    if (data.jobs && Array.isArray(data.jobs)) {
      for (const job of data.jobs) {
        if (job.title && job.company) {
          jobs.push({
            title: job.title,
            company: job.company,
            location: job.location || location,
            description: job.description || `${job.title} at ${job.company}`,
            url: job.url || `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' job')}`,
            source: job.source || 'web',
            salary: job.salary,
            employmentType: job.employmentType,
          });
        }
      }
    }
  } catch (error) {
    console.error('Gemini job search failed:', error);
  }

  // If Gemini search fails, use Playwright to scrape Indeed
  if (jobs.length === 0) {
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();

      // Try Indeed India
      await page.goto(`https://in.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}&sort=date`, {
        waitUntil: 'domcontentloaded', timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const cards = await page.$$('.jobsearch-ResultsList .result, .job_seen_beacon');
      for (const card of cards.slice(0, 15)) {
        try {
          const title = await card.$eval('h2 a, .jobTitle a', el => el.textContent?.trim() || '');
          const company = await card.$eval('.companyName, .company_name', el => el.textContent?.trim() || '');
          const locEl = await card.$('.companyLocation, .location');
          const loc = locEl ? await locEl.textContent() : '';
          const linkEl = await card.$('h2 a, .jobTitle a');
          const href = linkEl ? await linkEl.getAttribute('href') : '';

          if (title && company) {
            jobs.push({
              title,
              company,
              location: loc?.trim() || location,
              description: `${title} at ${company}`,
              url: href ? `https://in.indeed.com${href}` : '',
              source: 'indeed',
            });
          }
        } catch { continue; }
      }
      await browser.close();
    } catch (e) {
      console.log('Indeed scraping failed:', (e as Error).message);
    }
  }

  // Save to database
  if (jobs.length > 0) {
    let saved = 0;
    for (const job of jobs) {
      try {
        await prisma.job.create({
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            requirements: '[]',
            url: job.url,
            source: job.source,
            salaryMin: job.salary || null,
          },
        });
        saved++;
      } catch { /* duplicate */ }
    }
    console.log(`Saved ${saved} new jobs to database`);
  }

  return jobs;
}

// Get jobs from database
export async function getJobsFromDb(keywords?: string, source?: string, limit: number = 50) {
  const where: any = { isActive: true };
  if (keywords) {
    where.OR = [
      { title: { contains: keywords } },
      { company: { contains: keywords } },
      { description: { contains: keywords } },
    ];
  }
  if (source) where.source = source;

  return prisma.job.findMany({
    where,
    orderBy: { scrapedAt: 'desc' },
    take: limit,
  });
}
