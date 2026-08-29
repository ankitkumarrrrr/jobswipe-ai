import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getGeminiModel } from '@/lib/ai/gemini';

const prisma = new PrismaClient();

// POST - Find referrals at a company
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { company, role } = await req.json();

    const model = getGeminiModel();
    

    const prompt = `Find 5-8 people at ${company} who could provide a referral for a ${role || 'software engineering'} role. For each person, suggest:

1. Name (a realistic name for someone in a relevant role)
2. Title (e.g., Senior Engineer, Engineering Manager, etc.)
3. Which department they likely work in
4. LinkedIn search URL format: https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent('name ' + company)}
5. What angle to approach them (e.g., shared university, mutual connection, same tech stack)
6. A connection request message template (under 280 characters)

Return as JSON: { "referrals": [{ "name": "...", "title": "...", "department": "...", "searchUrl": "...", "approach": "...", "message": "..." }] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let referrals;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      referrals = jsonMatch ? JSON.parse(jsonMatch[0]).referrals : [];
    } catch {
      referrals = [];
    }

    // Save to database
    for (const ref of referrals) {
      await prisma.referral.create({
        data: {
          userId: sessionToken,
          name: ref.name,
          company,
          title: ref.title,
          linkedinUrl: ref.searchUrl,
          notes: `${ref.approach} | ${ref.message}`,
          status: 'FOUND',
        },
      }).catch(() => {});
    }

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Referral finder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get saved referrals
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const referrals = await prisma.referral.findMany({
      where: { userId: sessionToken },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
