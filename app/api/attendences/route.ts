import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';
import { pusherServer } from '@/lib/pusher';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lectureId = searchParams.get('filters[lecture][id][$eq]') || searchParams.get('filters[lecture][documentId][$eq]') || searchParams.get('lecture');
    const studentId = searchParams.get('filters[student][id][$eq]') || searchParams.get('filters[student][documentId][$eq]') || searchParams.get('student');
    const studentUserId = searchParams.get('filters[student][user][id][$eq]');
    const typeStr = searchParams.get('filters[type][$eq]') || searchParams.get('type');
    const currentStatus = searchParams.get('filters[currentStatus][$eq]') || searchParams.get('currentStatus');
    const dateStr = searchParams.get('filters[date][$eq]') || searchParams.get('date');

    const where: any = {};

    if (lectureId) where.lectureId = lectureId;
    if (studentId) where.studentId = studentId;
    if (studentUserId) {
      where.student = {
        userId: studentUserId,
      };
    }
    if (typeStr) where.type = typeStr;
    if (currentStatus) where.currentStatus = currentStatus;
    if (dateStr) {
      const startOfDay = new Date(dateStr);
      if (!isNaN(startOfDay.getTime())) {
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);
        where.date = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    const attendences = await prisma.attendence.findMany({
      where,
      include: {
        student: {
          include: { user: true },
        },
        lecture: {
          include: {
            subject: true,
            class: true,
            classroom: true,
            teacher: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return formatResponse(attendences);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = body.data || body;

    const studentId = data.studentId || data.student;
    const lectureId = data.lectureId || data.lecture;

    if (!studentId || !lectureId) {
      return NextResponse.json(
        { error: { message: 'student and lecture are required' } },
        { status: 400 }
      );
    }

    let finalStudentId = typeof studentId === 'object' ? (studentId.id || studentId.documentId) : studentId;
    let finalLectureId = typeof lectureId === 'object' ? (lectureId.id || lectureId.documentId) : lectureId;

    // Check if studentId is a Student ID or User ID
    const foundStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { id: finalStudentId },
          { userId: finalStudentId },
        ],
      },
    });

    if (foundStudent) {
      finalStudentId = foundStudent.id;
    }

    const attendence = await prisma.attendence.create({
      data: {
        studentId: finalStudentId,
        lectureId: finalLectureId,
        date: data.date ? new Date(data.date) : new Date(),
        type: data.type || 'auto',
        currentStatus: data.currentStatus || 'present',
      },
      include: {
        student: { include: { user: true } },
        lecture: true,
      },
    });

    try {
      await pusherServer.trigger('attendance-channel', 'attendance-marked', {
        message: `${attendence.student.user.username || 'A student'} was marked ${attendence.currentStatus}`,
        lectureId: attendence.lectureId,
        studentId: attendence.studentId
      });
    } catch (e) {
      console.error('Pusher event error:', e);
    }

    return formatResponse(attendence);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
