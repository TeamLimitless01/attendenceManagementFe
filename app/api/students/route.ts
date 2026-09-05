import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdFilter = searchParams.get('filters[user][id][$eq]') || searchParams.get('userId');
    const rollFilter = searchParams.get('filters[roll_number][$eq]') || searchParams.get('roll_number');

    const where: any = {};
    if (userIdFilter) where.userId = userIdFilter;
    if (rollFilter) where.roll_number = rollFilter;

    const students = await prisma.student.findMany({
      where,
      include: {
        user: true,
        class: {
          include: {
            students: {
              include: { user: true }
            }
          }
        },
        lecture: true,
        attendences: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return formatResponse(students);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = body.data || body;

    const userVal = data.userId || data.user;
    const classVal = data.classId || data.class;

    const userId = typeof userVal === 'object' ? (userVal?.id || userVal?.documentId) : userVal;
    const classId = typeof classVal === 'object' ? (classVal?.id || classVal?.documentId) : classVal;

    if (!userId) {
      return NextResponse.json({ error: { message: 'userId is required for student' } }, { status: 400 });
    }

    // Check if student profile already exists for this userId or roll_number
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: userId },
          ...(data.roll_number ? [{ roll_number: data.roll_number }] : []),
        ],
      },
    });

    let student;
    if (existingStudent) {
      student = await prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          name: data.name || existingStudent.name,
          roll_number: data.roll_number || existingStudent.roll_number,
          device_id: data.device_id || existingStudent.device_id,
          photo: data.photo || existingStudent.photo,
          faceEmbedding: data.faceEmbedding || existingStudent.faceEmbedding,
          isFaceRegistered: data.isFaceRegistered ?? existingStudent.isFaceRegistered,
          classId: classId || existingStudent.classId,
        },
        include: {
          user: true,
          class: true,
        },
      });
    } else {
      student = await prisma.student.create({
        data: {
          name: data.name,
          roll_number: data.roll_number || `ROLL-${Date.now()}`,
          device_id: data.device_id,
          photo: data.photo,
          faceEmbedding: data.faceEmbedding,
          isFaceRegistered: data.isFaceRegistered ?? false,
          userId: userId,
          classId: classId || undefined,
        },
        include: {
          user: true,
          class: true,
        },
      });
    }

    return formatResponse(student);
  } catch (error: any) {
    console.error('POST /api/students error:', error);
    return NextResponse.json({ error: { message: error.message || 'Failed to create/update student' } }, { status: 500 });
  }
}
