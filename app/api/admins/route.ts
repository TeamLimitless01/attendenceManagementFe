import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdFilter = searchParams.get('filters[user][id][$eq]') || searchParams.get('userId');

    const where: any = {};
    if (userIdFilter) where.userId = userIdFilter;

    const admins = await prisma.admin.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return formatResponse(admins);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = body.data || body;

    const admin = await prisma.admin.create({
      data: {
        employee_id: data.employee_id,
        department: data.department,
        userId: data.userId || data.user,
      },
      include: { user: true },
    });

    return formatResponse(admin);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
