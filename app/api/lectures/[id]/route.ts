import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: { message: 'Invalid lecture ID' } }, { status: 400 });
    }

    const lecture = await prisma.lecture.findUnique({
      where: { id },
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
    });

    if (!lecture) {
      return NextResponse.json({ error: { message: 'Lecture not found' } }, { status: 404 });
    }

    return formatResponse(lecture);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: { message: 'Invalid lecture ID' } }, { status: 400 });
    }

    const body = await req.json();
    const data = body.data || body;

    const resolveId = (val: any) => {
      if (!val) return null;
      if (typeof val === 'object') return val.id || val.documentId || val.data?.id || val.data?.documentId || null;
      return typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;
    };

    const parseDate = (val: any) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.isSessionActive !== undefined) updateData.isSessionActive = Boolean(data.isSessionActive);
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.start_date !== undefined) updateData.start_date = parseDate(data.start_date);
    if (data.end_date !== undefined) updateData.end_date = parseDate(data.end_date);
    if (data.day_of_week !== undefined) {
      const parsedDay = parseInt(data.day_of_week, 10);
      updateData.day_of_week = isNaN(parsedDay) ? null : parsedDay;
    }

    if (data.class !== undefined || data.classId !== undefined) {
      updateData.classId = resolveId(data.class !== undefined ? data.class : data.classId);
    }
    if (data.subject !== undefined || data.subjectId !== undefined) {
      updateData.subjectId = resolveId(data.subject !== undefined ? data.subject : data.subjectId);
    }
    if (data.teacher !== undefined || data.teacherId !== undefined) {
      updateData.teacherId = resolveId(data.teacher !== undefined ? data.teacher : data.teacherId);
    }
    if (data.classroom !== undefined || data.classroomId !== undefined) {
      updateData.classroomId = resolveId(data.classroom !== undefined ? data.classroom : data.classroomId);
    }

    if (data.students && Array.isArray(data.students)) {
      const validStudentIds = data.students
        .map((s: any) => {
          if (!s) return null;
          if (typeof s === 'object') return s.id || s.documentId || s.data?.id || s.data?.documentId || null;
          return typeof s === 'string' && s.trim().length > 0 ? s.trim() : null;
        })
        .filter(Boolean);

      updateData.students = {
        set: validStudentIds.map((sid: string) => ({ id: sid })),
      };
    }

    const updated = await prisma.lecture.update({
      where: { id },
      data: updateData,
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
    });

    return formatResponse(updated);
  } catch (error: any) {
    console.error('PUT /api/lectures/[id] error:', error);
    return NextResponse.json({ error: { message: error.message || 'Failed to update lecture' } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: { message: 'Invalid lecture ID' } }, { status: 400 });
    }

    await prisma.lecture.delete({ where: { id } });
    return NextResponse.json({ message: 'Lecture deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
