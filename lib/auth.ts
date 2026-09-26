import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
}

// ข้อ 2.2: ฟังก์ชันตรวจสอบ Token (คืนค่า 401 Unauthorized ถ้าไม่มีหรือ Token ไม่ถูกต้อง)
export function verifyAuth(req: Request): JwtPayload | NextResponse {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: 'Unauthorized: Missing or invalid token format' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'my_secret_key_1234';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    return NextResponse.json(
      { message: 'Unauthorized: Invalid token' },
      { status: 401 }
    );
  }
}

// ข้อ 2.3: ฟังก์ชันเช็คสิทธิ์ (Role)
export function checkRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}