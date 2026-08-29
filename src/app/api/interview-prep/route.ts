import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getGeminiModel } from '@/lib/ai/gemini';

const prisma = new PrismaClient();

// POST - Generate interview prep
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { jobTitle, company, jobDescription } = await req.json();

    const user = await prisma.user.findFirst({
      where: { id: sessionToken },
      include: { profile: true, resume: true },
    });

    const skills = user?.profile?.skills || '';
    const experience = user?.profile?.experience || '';

    const model = getGeminiModel();
    

    const prompt = `Generate 10 interview questions and detailed answers for a ${jobTitle} position at ${company}.

Job description: ${jobDescription || 'Not provided'}
Candidate skills: ${skills}
Candidate experience: ${experience}

For each question, provide:
1. The question
2. A detailed sample answer (3-4 sentences)
3. A "why this matters" tip

Return as JSON: { "questions": [{ "question": "...", "answer": "...", "tip": "..." }], "tips": ["general tip 1", "general tip 2", "general tip 3"] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let prep;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      prep = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [], tips: [] };
    } catch {
      prep = { questions: [], tips: ['Practice common behavioral questions', 'Research the company thoroughly', 'Prepare specific examples from your experience'] };
    }

    // Save to database
    await prisma.interviewPrep.create({
      data: {
        userId: sessionToken,
        jobTitle,
        company,
        questions: JSON.stringify(prep.questions),
        tips: JSON.stringify(prep.tips),
      },
    });

    return NextResponse.json({ prep });
  } catch (error) {
    console.error('Interview prep error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get saved interview preps
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const preps = await prisma.interviewPrep.findMany({
      where: { userId: sessionToken },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ preps: preps.map(p => ({ ...p, questions: JSON.parse(p.questions || '[]') })) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
