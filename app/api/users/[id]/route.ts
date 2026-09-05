import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/api-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        admin: true,
        teacher: true,
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: { message: 'User not found' } }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.username) updateData.username = body.username;
    if (body.email) updateData.email = body.email;
    if (body.type || body.role) updateData.type = body.type || body.role;
    if (body.password) updateData.password = await hashPassword(body.password);
    if (body.confirmed !== undefined) updateData.confirmed = body.confirmed;
    if (body.blocked !== undefined) updateData.blocked = body.blocked;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        admin: true,
        teacher: true,
        student: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
