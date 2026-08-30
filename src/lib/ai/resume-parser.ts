import { generateJSON } from "./gemini";

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
    skills: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    field: string;
  }[];
  goals: string;
  languages: string[];
  certifications: string[];
}

// Local fallback parser - works without any API key
function parseResumeLocally(rawText: string): ParsedResume {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Extract email
  const emailMatch = rawText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract phone
  const phoneMatch = rawText.match(/[\+]?[\d\s-()]{7,15}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';
  
  // First non-empty line is likely the name
  const name = lines[0] || 'Unknown';
  
  // Common skills keywords
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node', 'angular', 'vue',
    'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'gcp',
    'docker', 'kubernetes', 'git', 'linux', 'redis', 'graphql', 'rest', 'api',
    'next.js', 'nextjs', 'express', 'django', 'flask', 'spring', 'rails',
    'machine learning', 'ai', 'tensorflow', 'pytorch', 'data science',
    'figma', 'sketch', 'photoshop', 'illustrator',
    'agile', 'scrum', 'jira', 'confluence',
    'communication', 'leadership', 'teamwork', 'problem solving',
  ];
  
  const lowerText = rawText.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => lowerText.includes(skill));
  
  // Extract experience sections
  const experience: ParsedResume['experience'] = [];
  const expKeywords = ['experience', 'work history', 'employment', 'worked at', 'engineer', 'developer', 'manager'];
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    if (expKeywords.some(k => lower.includes(k)) && i < lines.length - 1) {
      experience.push({
        title: line,
        company: lines[i + 1] || '',
        duration: '',
        description: lines.slice(i + 2, i + 5).join(' '),
        skills: foundSkills.slice(0, 3),
      });
    }
  });
  
  // Extract education
  const education: ParsedResume['education'] = [];
  const eduKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'b.tech', 'm.tech', 'b.s.', 'm.s.', 'mba', 'bca', 'mca'];
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    if (eduKeywords.some(k => lower.includes(k))) {
      education.push({ degree: line, institution: lines[i + 1] || '', year: '', field: '' });
    }
  });
  
  return {
    name,
    email,
    phone,
    location: '',
    summary: lines.slice(0, 3).join(' ').substring(0, 300),
    skills: foundSkills.length > 0 ? foundSkills : ['General skills'],
    experience: experience.length > 0 ? experience : [{ title: 'Professional', company: '', duration: '', description: rawText.substring(0, 200), skills: foundSkills.slice(0, 5) }],
    education: education.length > 0 ? education : [{ degree: 'Education', institution: '', year: '', field: '' }],
    goals: 'Seeking a challenging role to leverage skills and experience',
    languages: ['English'],
    certifications: [],
  };
}

export async function parseResumeWithAI(rawText: string): Promise<ParsedResume> {
  try {
    // Try AI parsing first
    return await generateJSON(
      `You are an expert resume parser. Extract structured data from the resume text provided.
Return a JSON object with this exact structure:
{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, Country",
  "summary": "Professional summary or objective (2-3 sentences)",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "duration": "Start - End",
      "description": "Brief description of role and achievements",
      "skills": ["skills used in this role"]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School name",
      "year": "Graduation year",
      "field": "Field of study"
    }
  ],
  "goals": "Inferred career goals based on experience and education",
  "languages": ["language1", "language2"],
  "certifications": ["cert1", "cert2"]
}

If a field is not found, use an empty string for strings, empty array for arrays.`,
      `Parse this resume:\n\n${rawText}`
    );
  } catch (aiError) {
    console.warn('AI parsing failed, using local parser:', aiError);
    // Fallback to local parser
    return parseResumeLocally(rawText);
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfFn = pdfParseModule.default || pdfParseModule;
    const result = await pdfFn(new Uint8Array(buffer));
    return typeof result === "string" ? result : result?.text || "";
  } catch {
    return buffer.toString("utf-8").replace(/[^ -~\n]/g, " ");
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
