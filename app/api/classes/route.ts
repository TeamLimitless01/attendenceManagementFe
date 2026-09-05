import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        students: {
          include: { user: true },
        },
        lectures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return formatResponse(classes);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = body.data || body;

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        department: data.department,
        semester: data.semester ? parseInt(data.semester, 10) : undefined,
        batch_year: data.batch_year ? parseInt(data.batch_year, 10) : undefined,
      },
    });

    return formatResponse(newClass);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
