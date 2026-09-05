import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: { lectures: true },
      orderBy: { createdAt: 'desc' },
    });
    return formatResponse(subjects);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = body.data || body;

    const subject = await prisma.subject.create({
      data: {
        name: data.name,
        slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'),
        code: data.code || `SUB-${Date.now()}`,
      },
    });

    return formatResponse(subject);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
