import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.admin.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!item) {
      return NextResponse.json({ error: { message: 'Admin record not found' } }, { status: 404 });
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

    const updated = await prisma.admin.update({
      where: { id },
      data: {
        employee_id: data.employee_id,
        department: data.department,
      },
      include: { user: true },
    });

    return formatResponse(updated);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.admin.delete({ where: { id } });
    return NextResponse.json({ message: 'Admin record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
