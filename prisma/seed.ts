import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';



const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Create or update Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      type: 'admin',
      admin: {
        create: {
          employee_id: 'EMP-001',
          department: 'Administration',
        },
      },
    },
    include: { admin: true },
  });
  console.log('Admin user ready:', adminUser.email);

  // 2. Create or update Teacher User
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@gmail.com' },
    update: {},
    create: {
      username: 'teacher',
      email: 'teacher@gmail.com',
      password: await bcrypt.hash('teacher123', 10),
      type: 'teacher',
      teacher: {
        create: {
          name: 'Prof. John Doe',
          employee_id: 'EMP-002',
          department: 'Computer Science',
        },
      },
    },
    include: { teacher: true },
  });
  console.log('Teacher user ready:', teacherUser.email);

  // 3. Create or update Student User
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@gmail.com' },
    update: {},
    create: {
      username: 'student',
      email: 'student@gmail.com',
      password: await bcrypt.hash('student123', 10),
      type: 'student',
      student: {
        create: {
          name: 'Jane Smith',
          roll_number: 'CS2026-001',
        },
      },
    },
    include: { student: true },
  });
  console.log('Student user ready:', studentUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
