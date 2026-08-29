import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getGeminiModel } from '@/lib/ai/gemini';

const prisma = new PrismaClient();

// POST - Optimize LinkedIn profile
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { targetRole, currentHeadline, currentSummary, skills, experience } = await req.json();

    const user = await prisma.user.findFirst({
      where: { id: sessionToken },
      include: { profile: true, resume: true },
    });

    const model = getGeminiModel();
    

    const prompt = `Optimize a LinkedIn profile for someone targeting ${targetRole || 'software engineering'} roles.

Current headline: ${currentHeadline || 'Not set'}
Current summary: ${currentSummary || 'Not set'}
Skills: ${skills || user?.profile?.skills || ''}
Experience: ${experience || user?.profile?.experience || ''}

Provide optimized versions of:
1. Headline (under 220 characters, keyword-rich)
2. Summary/About section (compelling, 3-4 paragraphs)
3. Skills to add (5 relevant skills for the target role)
4. Experience bullets (3-4 action-oriented bullets per role)
5. 3 recommendations to ask for

Return as JSON: {
  "headline": "...",
  "summary": "...",
  "skillsToAdd": ["..."],
  "experienceBullets": [{ "role": "...", "bullets": ["..."] }],
  "recommendations": ["..."]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let optimization;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      optimization = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      optimization = { headline: '', summary: '', skillsToAdd: [], experienceBullets: [], recommendations: [] };
    }

    // Save to database
    await prisma.linkedInOptimization.upsert({
      where: { userId: sessionToken },
      update: {
        headline: optimization.headline,
        summary: optimization.summary,
        experience: JSON.stringify(optimization.experienceBullets),
        skills: JSON.stringify(optimization.skillsToAdd),
        recommendations: JSON.stringify(optimization.recommendations),
        optimizedAt: new Date(),
      },
      create: {
        userId: sessionToken,
        headline: optimization.headline,
        summary: optimization.summary,
        experience: JSON.stringify(optimization.experienceBullets),
        skills: JSON.stringify(optimization.skillsToAdd),
        recommendations: JSON.stringify(optimization.recommendations),
      },
    });

    return NextResponse.json({ optimization });
  } catch (error) {
    console.error('LinkedIn optimization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get saved optimization
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const optimization = await prisma.linkedInOptimization.findFirst({ where: { userId: sessionToken } });
    return NextResponse.json({ optimization });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
