import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdFilter = searchParams.get('filters[user][id][$eq]') || searchParams.get('userId');

    const where: any = {};
    if (userIdFilter) where.userId = userIdFilter;

    const teachers = await prisma.teacher.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return formatResponse(teachers);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = body.data || body;

    const userVal = data.userId || data.user;
    const userId = typeof userVal === 'object' ? (userVal?.id || userVal?.documentId) : userVal;

    if (!userId) {
      return NextResponse.json({ error: { message: 'userId is required for teacher' } }, { status: 400 });
    }

    const existingTeacher = await prisma.teacher.findFirst({
      where: { userId: userId },
    });

    let teacher;
    if (existingTeacher) {
      teacher = await prisma.teacher.update({
        where: { id: existingTeacher.id },
        data: {
          name: data.name || existingTeacher.name,
          employee_id: data.employee_id || existingTeacher.employee_id,
          department: data.department || existingTeacher.department,
        },
        include: { user: true },
      });
    } else {
      teacher = await prisma.teacher.create({
        data: {
          name: data.name,
          employee_id: data.employee_id,
          department: data.department,
          userId: userId,
        },
        include: { user: true },
      });
    }

    return formatResponse(teacher);
  } catch (error: any) {
    console.error('POST /api/teachers error:', error);
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
