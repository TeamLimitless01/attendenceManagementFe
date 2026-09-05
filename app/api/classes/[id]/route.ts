import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.class.findUnique({
      where: { id },
      include: {
        students: { include: { user: true } },
        lectures: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: { message: 'Class not found' } }, { status: 404 });
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

    const updated = await prisma.class.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        department: data.department,
        semester: data.semester !== undefined ? parseInt(data.semester, 10) : undefined,
        batch_year: data.batch_year !== undefined ? parseInt(data.batch_year, 10) : undefined,
      },
      include: {
        students: { include: { user: true } },
        lectures: true,
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
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
