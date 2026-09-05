import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: { message: 'Invalid student ID' } }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id },
          { roll_number: id },
          { userId: id },
        ],
      },
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
    });

    if (!student) {
      return NextResponse.json({ error: { message: 'Student not found' } }, { status: 404 });
    }

    return formatResponse(student);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: { message: 'Invalid student ID' } }, { status: 400 });
    }

    const body = await req.json();
    const data = body.data || body;

    const targetStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { id },
          { roll_number: id },
          { userId: id },
        ],
      },
    });

    if (!targetStudent) {
      return NextResponse.json({ error: { message: 'Student not found' } }, { status: 404 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.roll_number !== undefined) updateData.roll_number = data.roll_number;
    if (data.device_id !== undefined) updateData.device_id = data.device_id;
    if (data.photo !== undefined) updateData.photo = data.photo;
    if (data.faceEmbedding !== undefined) updateData.faceEmbedding = data.faceEmbedding;
    if (data.isFaceRegistered !== undefined) updateData.isFaceRegistered = data.isFaceRegistered;
    if (data.classId || data.class) updateData.classId = data.classId || data.class;

    const student = await prisma.student.update({
      where: { id: targetStudent.id },
      data: updateData,
      include: {
        user: true,
        class: true,
      },
    });

    return formatResponse(student);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: { message: 'Invalid student ID' } }, { status: 400 });
    }

    const targetStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { id },
          { roll_number: id },
          { userId: id },
        ],
      },
    });

    if (!targetStudent) {
      return NextResponse.json({ error: { message: 'Student not found' } }, { status: 404 });
    }

    await prisma.student.delete({ where: { id: targetStudent.id } });
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
