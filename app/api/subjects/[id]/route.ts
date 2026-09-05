import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.subject.findUnique({
      where: { id },
      include: { lectures: true },
    });

    if (!item) {
      return NextResponse.json({ error: { message: 'Subject not found' } }, { status: 404 });
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

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        code: data.code,
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
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
