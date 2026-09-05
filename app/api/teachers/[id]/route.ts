import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        lectures: {
          include: {
            class: true,
            subject: true,
            classroom: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: { message: 'Teacher not found' } }, { status: 404 });
    }

    return formatResponse(teacher);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = body.data || body;

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        name: data.name,
        employee_id: data.employee_id,
        department: data.department,
      },
      include: {
        user: true,
      },
    });

    return formatResponse(teacher);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.teacher.delete({ where: { id } });
    return NextResponse.json({ message: 'Teacher deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
