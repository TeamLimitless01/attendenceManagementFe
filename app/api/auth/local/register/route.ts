import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, formatAuthResponse } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, role, type, name, roll_number, employee_id, department } = body;

    console.log('Register request received:', { username, email, role: type || role });

    if (!username || !email || !password) {
      console.warn('Registration missing required fields:', { username, email, hasPassword: !!password });
      return NextResponse.json(
        {
          data: null,
          error: {
            status: 400,
            name: 'ApplicationError',
            message: 'Username, email, and password are required',
            details: {},
          },
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      const isEmail = existingUser.email === email;
      const message = isEmail ? 'Email is already taken' : 'Username is already taken';
      console.warn('Registration conflict:', { message, email, username, existingEmail: existingUser.email, existingUsername: existingUser.username });
      return NextResponse.json(
        {
          data: null,
          error: {
            status: 400,
            name: 'ApplicationError',
            message,
            details: {},
          },
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userRole = type || role || 'student';

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        type: userRole,
      },
    });

    if (userRole === 'admin') {
      await prisma.admin.create({
        data: {
          userId: user.id,
          employee_id: employee_id || '',
          department: department || '',
        },
      });
    } else if (userRole === 'teacher') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          name: name || username,
          employee_id: employee_id || '',
          department: department || '',
        },
      });
    } else if (userRole === 'student') {
      await prisma.student.create({
        data: {
          userId: user.id,
          name: name || username,
          roll_number: roll_number || `ROLL-${Date.now()}`,
        },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        admin: true,
        teacher: true,
        student: true,
      },
    });

    return formatAuthResponse(fullUser);
  } catch (error: any) {
    console.error('Registration exception:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: error.message || 'Registration failed',
          details: {},
        },
      },
      { status: 500 }
    );
  }
}
