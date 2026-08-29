import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get team info
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const memberships = await prisma.teamMember.findMany({
      where: { userId: sessionToken },
      include: { team: { include: { members: { include: { user: { select: { id: true, name: true, email: true, createdAt: true } } } } } } },
    });

    return NextResponse.json({ teams: memberships.map(m => ({ ...m.team, role: m.role })) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create team or invite member
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { action, teamName, email, teamId } = await req.json();

    if (action === 'create') {
      const team = await prisma.team.create({
        data: {
          name: teamName || 'My Team',
          ownerId: sessionToken,
        },
      });

      await prisma.teamMember.create({
        data: { teamId: team.id, userId: sessionToken, role: 'owner' },
      });

      return NextResponse.json({ team });
    }

    if (action === 'invite') {
      if (!teamId || !email) return NextResponse.json({ error: 'Missing teamId or email' }, { status: 400 });

      const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
      if (!team || team.ownerId !== sessionToken) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      if (team.members.length >= team.memberLimit) {
        return NextResponse.json({ error: 'Team member limit reached' }, { status: 403 });
      }

      const invitee = await prisma.user.findFirst({ where: { email } });
      if (!invitee) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const existing = await prisma.teamMember.findFirst({ where: { teamId, userId: invitee.id } });
      if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 400 });

      await prisma.teamMember.create({
        data: { teamId, userId: invitee.id, role: 'member' },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove member or disband team
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const sessionToken = session.user.id;

    const { teamId, userId } = await req.json();

    if (userId) {
      // Remove a member
      await prisma.teamMember.deleteMany({ where: { teamId, userId } });
    } else {
      // Disband team
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (team && team.ownerId === sessionToken) {
        await prisma.teamMember.deleteMany({ where: { teamId } });
        await prisma.team.delete({ where: { id: teamId } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
