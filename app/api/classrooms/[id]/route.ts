import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.classroom.findUnique({
      where: { id },
      include: { lectures: true },
    });

    if (!item) {
      return NextResponse.json({ error: { message: 'Classroom not found' } }, { status: 404 });
    }

    return formatResponse(item);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = body.data || body;

    const updated = await prisma.classroom.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        radius: data.radius !== undefined ? parseInt(data.radius, 10) : undefined,
        latitude: data.latitude !== undefined ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude !== undefined ? parseFloat(data.longitude) : undefined,
      },
    });

    return formatResponse(updated);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.classroom.delete({ where: { id } });
    return NextResponse.json({ message: 'Classroom deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
