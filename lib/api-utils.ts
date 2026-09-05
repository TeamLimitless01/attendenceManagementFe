import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'KWNIOG33iK1lyekkp3t0qA==';

export function formatResponse(data: any, meta = {}) {
  const normalize = (item: any): any => {
    if (!item || typeof item !== 'object') return item;
    if (item instanceof Date) return item;

    if (Array.isArray(item)) {
      return item.map(normalize);
    }

    const newItem: any = { ...item };
    if (newItem.id && !newItem.documentId) {
      newItem.documentId = newItem.id;
    }

    for (const key of Object.keys(newItem)) {
      if (newItem[key] && typeof newItem[key] === 'object') {
        newItem[key] = normalize(newItem[key]);
      }
    }

    return newItem;
  };

  const normalizedData = normalize(data);

  return NextResponse.json({
    data: normalizedData,
    meta: meta,
    ...(typeof normalizedData === 'object' && !Array.isArray(normalizedData) ? normalizedData : {}),
  });
}

export function formatAuthResponse(user: any) {
  const tokenPayload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.type || 'student',
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  const normalizeObj = (obj: any) => {
    if (obj && obj.id && !obj.documentId) {
      return { ...obj, documentId: obj.id };
    }
    return obj;
  };

  return NextResponse.json({
    jwt: token,
    user: {
      id: user.id,
      documentId: user.id,
      username: user.username,
      email: user.email,
      type: user.type,
      confirmed: user.confirmed,
      blocked: user.blocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      admin: normalizeObj(user.admin),
      teacher: normalizeObj(user.teacher),
      student: normalizeObj(user.student),
    },
  });
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashed: string) {
  return await bcrypt.compare(password, hashed);
}

export function verifyToken(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '');
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}
