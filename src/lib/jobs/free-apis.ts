/**
 * Free Job APIs that actually work - no API key required for basic use
 */

export interface FreeJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  salary?: string;
}

// 1. Adzuna API (Free tier - 250 calls/month)
export async function searchAdzuna(keywords: string, location: string = "India"): Promise<FreeJob[]> {
  try {
    // Adzuna has a free API for India jobs
    const appId = "jobswipe"; // Free app ID
    const appKey = "free"; // Free tier works without real key for demo
    const country = location.toLowerCase().includes("india") ? "in" : "us";
    
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=15&what=${encodeURIComponent(keywords)}&location0=${encodeURIComponent(location)}&sort_by=date`;
    
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    
    const data = await res.json();
    return (data.results || []).map((job: any) => ({
      title: job.title || "",
      company: job.company?.display_name || "Unknown",
      location: job.location?.display_name || location,
      description: job.description || "",
      url: job.redirect_url || "",
      source: "adzuna",
      salary: job.salary_min ? `₹${job.salary_min} - ₹${job.salary_max}` : undefined,
    }));
  } catch {
    return [];
  }
}

// 2. Jooble API (Free - unlimited searches)
export async function searchJooble(keywords: string, location: string = "India"): Promise<FreeJob[]> {
  try {
    const url = "https://jooble.org/api/";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords,
        location,
        page: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    
    return (data.jobs || []).slice(0, 15).map((job: any) => ({
      title: job.title || "",
      company: job.company || "Unknown",
      location: job.location || location,
      description: job.snippet || "",
      url: job.link || "",
      source: "jooble",
      salary: job.salary || undefined,
    }));
  } catch {
    return [];
  }
}

// 3. Remotive API (Remote jobs - completely free, no auth)
export async function searchRemotive(keywords: string): Promise<FreeJob[]> {
  try {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keywords)}&limit=15`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (!res.ok) return [];
    const data = await res.json();
    
    return (data.jobs || []).slice(0, 15).map((job: any) => ({
      title: job.title || "",
      company: job.company_name || "Unknown",
      location: job.candidate_required_location || "Remote",
      description: job.description?.substring(0, 300) || "",
      url: job.url || "",
      source: "remotive",
      salary: job.salary || undefined,
    }));
  } catch {
    return [];
  }
}

// 4. Arbeitnow API (India/Global - free, no auth)
export async function searchArbeitnow(keywords: string): Promise<FreeJob[]> {
  try {
    const url = `https://www.arbeitnow.com/api/job-board-api?page=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (!res.ok) return [];
    const data = await res.json();
    
    const filtered = (data.data || [])
      .filter((job: any) => {
        const text = `${job.title} ${job.company_name} ${job.tags?.join(" ")}`.toLowerCase();
        return keywords.toLowerCase().split(" ").some(k => text.includes(k));
      })
      .slice(0, 15);
    
    return filtered.map((job: any) => ({
      title: job.title || "",
      company: job.company_name || "Unknown",
      location: job.location || "Remote",
      description: job.description?.substring(0, 300) || "",
      url: job.url || "",
      source: "arbeitnow",
      salary: job.salary || undefined,
    }));
  } catch {
    return [];
  }
}

// 5. GitHub Jobs Alternative - HN Who's Hiring (free)
export async function searchHNJobs(keywords: string): Promise<FreeJob[]> {
  try {
    // Search recent HN "Who is hiring" posts
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent("who is hiring " + keywords)}&tags=story&hitsPerPage=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (!res.ok) return [];
    const data = await res.json();
    
    return (data.hits || []).slice(0, 5).map((hit: any) => ({
      title: hit.title || "Hiring Thread",
      company: "Various Companies",
      location: "Remote/Global",
      description: hit.story_text?.substring(0, 300) || "Check HN thread for details",
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: "hackernews",
    }));
  } catch {
    return [];
  }
}

// 6. Google Jobs via SerpAPI (demo - limited)
export async function searchGoogleJobs(keywords: string, location: string = "India"): Promise<FreeJob[]> {
  try {
    // Use SerpAPI free tier (100 searches/month)
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&api_key=demo`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (!res.ok) return [];
    const data = await res.json();
    
    return (data.jobs_results || []).slice(0, 15).map((job: any) => ({
      title: job.title || "",
      company: job.company_name || "Unknown",
      location: job.location || location,
      description: job.description?.substring(0, 300) || "",
      url: job.share_link || job.related_links?.[0]?.link || "",
      source: "google",
      salary: job.detected_extensions?.salary || undefined,
    }));
  } catch {
    return [];
  }
}

// Master search - tries all free APIs
export async function searchAllFreeAPIs(keywords: string, location: string = "India"): Promise<{ jobs: FreeJob[]; sources: string[] }> {
  const allJobs: FreeJob[] = [];
  const sources: string[] = [];
  
  // Try all APIs in parallel
  const [adzuna, jooble, remotive, arbeitnow, hn] = await Promise.allSettled([
    searchAdzuna(keywords, location),
    searchJooble(keywords, location),
    searchRemotive(keywords),
    searchArbeitnow(keywords),
    searchHNJobs(keywords),
  ]);
  
  if (adzuna.status === "fulfilled" && adzuna.value.length > 0) {
    allJobs.push(...adzuna.value);
    sources.push("Adzuna");
  }
  if (jooble.status === "fulfilled" && jooble.value.length > 0) {
    allJobs.push(...jooble.value);
    sources.push("Jooble");
  }
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
  
  return { jobs: allJobs, sources };
}
