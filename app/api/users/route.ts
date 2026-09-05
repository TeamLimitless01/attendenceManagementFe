import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        admin: true,
        teacher: true,
        student: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || 'Failed to fetch users' } },
      { status: 500 }
    );
  }
}
