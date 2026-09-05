import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, formatAuthResponse } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body.identifier || body.email || body.username;
    const password = body.password;
    console.log('Login attempt for identifier:', identifier);


    if (!identifier || !password) {
      return NextResponse.json(
        {
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Identifier and password are required',
            details: {},
          },
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
      include: {
        admin: true,
        teacher: true,
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Invalid identifier or password',
            details: {},
          },
        },
        { status: 400 }
      );
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        {
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'Invalid identifier or password',
            details: {},
          },
        },
        { status: 400 }
      );
    }

    return formatAuthResponse(user);
  } catch (error: any) {
    return NextResponse.json(
      {
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: error.message || 'Authentication failed',
          details: {},
        },
      },
      { status: 500 }
    );
  }
}

