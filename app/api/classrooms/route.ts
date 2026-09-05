import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      include: { lectures: true },
      orderBy: { createdAt: 'desc' },
    });
    return formatResponse(classrooms);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = body.data || body;

    const classroom = await prisma.classroom.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        radius: data.radius ? parseInt(data.radius, 10) : undefined,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      },
    });

    return formatResponse(classroom);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
