import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get all resume versions
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const versions = await prisma.resumeVersion.findMany({
      where: { userId: sessionToken },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ versions: versions.map(v => ({ ...v, skills: JSON.parse(v.skills || '[]') })) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create resume version
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { name, customizedFor, skills, experience, education, goals, fileName, fileUrl } = await req.json();

    const version = await prisma.resumeVersion.create({
      data: {
        userId: sessionToken,
        name: name || 'Untitled Version',
        customizedFor,
        skills: JSON.stringify(skills || []),
        experience,
        education,
        goals,
        fileName,
        fileUrl,
      },
    });

    return NextResponse.json({ version });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete resume version
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { versionId } = await req.json();
    await prisma.resumeVersion.deleteMany({ where: { id: versionId, userId: sessionToken } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
