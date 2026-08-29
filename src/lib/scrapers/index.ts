import { chromium, Browser, Page } from 'playwright';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url: string;
  source: string;
  postedAt?: Date;
}

async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
}

// LinkedIn Job Scraper
export async function scrapeLinkedIn(keywords: string, location: string = ''): Promise<ScrapedJob[]> {
  const browser = await launchBrowser();
  const jobs: ScrapedJob[] = [];

  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&f_TPR=r604800&position=1&pageNum=0`;
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.base-card, .job-search-card, .jobs-search__result-card');
    
    for (const card of jobCards.slice(0, 20)) {
      try {
        const title = await card.$eval('.base-search-card__title, h3', el => el.textContent?.trim() || '');
        const company = await card.$eval('.base-search-card__subtitle, h4', el => el.textContent?.trim() || '');
        const locationEl = await card.$('.job-search-card__location, .job-result-card__location');
        const locationText = locationEl ? await locationEl.textContent() : '';
        const linkEl = await card.$('a.base-card__full-link, a');
        const url = linkEl ? await linkEl.getAttribute('href') : '';
        const description = await card.$eval('.base-search-card__snippet, p', el => el.textContent?.trim() || '').catch(() => '');

        if (title && company) {
          jobs.push({
            title,
            company,
            location: locationText?.trim() || location,
            description: description || `${title} position at ${company}`,
            url: url || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}`,
            source: 'linkedin',
            postedAt: new Date(),
          });
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('LinkedIn scraping error:', error);
  } finally {
    await browser.close();
  }

  return jobs;
}

// Indeed Scraper
export async function scrapeIndeed(keywords: string, location: string = ''): Promise<ScrapedJob[]> {
  const browser = await launchBrowser();
  const jobs: ScrapedJob[] = [];

  try {
    const page = await browser.newPage();
    const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}&sort=date`;
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.jobsearch-ResultsList .result, .job_seen_beacon');
    
    for (const card of jobCards.slice(0, 20)) {
      try {
        const title = await card.$eval('h2 a, .jobTitle a', el => el.textContent?.trim() || '');
        const company = await card.$eval('.companyName, .company_name', el => el.textContent?.trim() || '');
        const locationEl = await card.$('.companyLocation, .location');
        const locationText = locationEl ? await locationEl.textContent() : '';
        const linkEl = await card.$('h2 a, .jobTitle a');
        const href = linkEl ? await linkEl.getAttribute('href') : '';
        const description = await card.$eval('.job-snippet, .summary', el => el.textContent?.trim() || '').catch(() => '');

        if (title && company) {
          jobs.push({
            title,
            company,
            location: locationText?.trim() || location,
            description: description || `${title} position at ${company}`,
            url: href ? `https://www.indeed.com${href}` : `https://www.indeed.com/jobs?q=${encodeURIComponent(title)}`,
            source: 'indeed',
            postedAt: new Date(),
          });
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('Indeed scraping error:', error);
  } finally {
    await browser.close();
  }

  return jobs;
}

// Naukri Scraper
export async function scrapeNaukri(keywords: string, location: string = ''): Promise<ScrapedJob[]> {
  const browser = await launchBrowser();
  const jobs: ScrapedJob[] = [];

  try {
    const page = await browser.newPage();
    const searchUrl = `https://www.naukri.com/${keywords.replace(/\s+/g, '-')}-jobs-in-${location.replace(/\s+/g, '-') || 'india'}`;
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.srp-grid .tuple, .jobTuple, article');
    
    for (const card of jobCards.slice(0, 20)) {
      try {
        const title = await card.$eval('.title a, .title, h2 a', el => el.textContent?.trim() || '');
        const company = await card.$eval('.companyName a, .company, .companyName', el => el.textContent?.trim() || '');
        const locationEl = await card.$('.location, .area, .loc');
        const locationText = locationEl ? await locationEl.textContent() : '';
        const linkEl = await card.$('.title a, h2 a');
        const href = linkEl ? await linkEl.getAttribute('href') : '';
        const description = await card.$eval('.job-desc, .description', el => el.textContent?.trim() || '').catch(() => '');
        const salaryEl = await card.$('.salary, .salaryInfo');
        const salary = salaryEl ? await salaryEl.textContent() : '';

        if (title && company) {
          jobs.push({
            title,
            company,
            location: locationText?.trim() || location,
            salary: salary?.trim(),
            description: description || `${title} position at ${company}`,
            url: href || `https://www.naukri.com/${keywords.replace(/\s+/g, '-')}-jobs`,
            source: 'naukri',
            postedAt: new Date(),
          });
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('Naukri scraping error:', error);
  } finally {
    await browser.close();
  }

  return jobs;
}

// Glassdoor Scraper
export async function scrapeGlassdoor(keywords: string, location: string = ''): Promise<ScrapedJob[]> {
  const browser = await launchBrowser();
  const jobs: ScrapedJob[] = [];

  try {
    const page = await browser.newPage();
    const searchUrl = `https://www.glassdoor.com/Job/${location.replace(/\s+/g, '-')}-jobs-SRCH_IL.0,${location.length}_IC${location.replace(/\s+/g, '+')}.htm?keyword=${encodeURIComponent(keywords)}`;
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.JobsList_jobListItem__wjTHv, .job-listing, li.JobsList_jobListItem__bcqVj');
    
    for (const card of jobCards.slice(0, 20)) {
      try {
        const title = await card.$eval('.job-title, [data-test="job-link"], h3', el => el.textContent?.trim() || '');
        const company = await card.$eval('.company-name, [data-test="emp-name"], .employer-name', el => el.textContent?.trim() || '');
        const locationEl = await card.$('.job-location, [data-test="emp-location"], .location');
        const locationText = locationEl ? await locationEl.textContent() : '';
        const linkEl = await card.$('a');
        const href = linkEl ? await linkEl.getAttribute('href') : '';

        if (title && company) {
          jobs.push({
            title,
            company,
            location: locationText?.trim() || location,
            description: `${title} position at ${company}`,
            url: href ? `https://www.glassdoor.com${href}` : `https://www.glassdoor.com/Job/jobs.htm?keyword=${encodeURIComponent(title)}`,
            source: 'glassdoor',
            postedAt: new Date(),
          });
        }
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.error('Glassdoor scraping error:', error);
  } finally {
    await browser.close();
  }

  return jobs;
}

// Save scraped jobs to database
export async function saveJobsToDb(jobs: ScrapedJob[]): Promise<number> {
  let saved = 0;
  for (const job of jobs) {
    try {
      await prisma.job.create({
        data: {
          title: job.title,
          company: job.company,
          location: job.location || 'Remote',
          description: job.description,
          requirements: '[]',
          url: job.url,
          source: job.source,
          postedAt: job.postedAt,
        },
      });
      saved++;
    } catch (e) {
      // Duplicate or error, skip
    }
  }
  return saved;
}

// Main scrape function - searches all platforms
export async function scrapeAllJobs(keywords: string, location: string = ''): Promise<{ jobs: ScrapedJob[], saved: number, sources: string[] }> {
  const results = await Promise.allSettled([
    scrapeLinkedIn(keywords, location),
    scrapeIndeed(keywords, location),
    scrapeNaukri(keywords, location),
    scrapeGlassdoor(keywords, location),
  ]);

  const allJobs: ScrapedJob[] = [];
  const sources: string[] = [];

  results.forEach((result, index) => {
    const sourceNames = ['linkedin', 'indeed', 'naukri', 'glassdoor'];
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value);
      sources.push(sourceNames[index]);
    }
  });

  const saved = await saveJobsToDb(allJobs);

  return { jobs: allJobs, saved, sources };
}
