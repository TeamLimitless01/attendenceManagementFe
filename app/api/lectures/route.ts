import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const teacherUserId = searchParams.get('filters[teacher][user][id][$eq]') || searchParams.get('teacherUserId');
    const studentUserId = searchParams.get('filters[students][user][id][$eq]');
    const studentId = searchParams.get('filters[students][id][$eq]') || searchParams.get('studentId');
    const dayOfWeek = searchParams.get('filters[day_of_week][$eq]');
    const isActive = searchParams.get('filters[isSessionActive][$eq]');

    const where: any = {};

    if (teacherUserId) {
      where.teacher = {
        userId: teacherUserId,
      };
    }

    if (studentUserId) {
      where.OR = [
        { students: { some: { userId: studentUserId } } },
        { class: { students: { some: { userId: studentUserId } } } },
      ];
    } else if (studentId) {
      where.OR = [
        { students: { some: { id: studentId } } },
        { class: { students: { some: { id: studentId } } } },
      ];
    }

    if (dayOfWeek) {
      where.day_of_week = parseInt(dayOfWeek, 10);
    }

    if (isActive !== null && isActive !== undefined) {
      where.isSessionActive = isActive === 'true';
    }

    const lectures = await prisma.lecture.findMany({
      where,
      include: {
        class: {
          include: {
            students: {
              include: { user: true },
            },
          },
        },
        subject: true,
        classroom: true,
        teacher: {
          include: { user: true },
        },
        students: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return formatResponse(lectures);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = body.data || body;

    const resolveId = (val: any) => {
      if (!val) return undefined;
      if (typeof val === 'object') return val.id || val.documentId || val.data?.id || val.data?.documentId || undefined;
      return typeof val === 'string' && val.trim().length > 0 ? val.trim() : undefined;
    };

    const parseDate = (val: any) => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    const lecture = await prisma.lecture.create({
      data: {
        name: data.name,
        slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 100000),
        classId: resolveId(data.class !== undefined ? data.class : data.classId),
        subjectId: resolveId(data.subject !== undefined ? data.subject : data.subjectId),
        teacherId: resolveId(data.teacher !== undefined ? data.teacher : data.teacherId),
        classroomId: resolveId(data.classroom !== undefined ? data.classroom : data.classroomId),
        start_time: data.start_time,
        end_time: data.end_time,
        start_date: parseDate(data.start_date),
        end_date: parseDate(data.end_date),
        day_of_week: data.day_of_week ? parseInt(data.day_of_week, 10) : undefined,
        isSessionActive: data.isSessionActive ?? false,
      },
      include: {
        class: true,
        subject: true,
        classroom: true,
        teacher: true,
        students: true,
      },
    });

    return formatResponse(lecture);
  } catch (error: any) {
    console.error('POST /api/lectures error:', error);
    return NextResponse.json({ error: { message: error.message || 'Failed to create lecture' } }, { status: 500 });
  }
}
