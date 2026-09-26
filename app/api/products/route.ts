import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

// ข้อ 3.2: Validate ข้อมูลด้วย Zod Schema
const productSchema = z.object({
  code: z.string().min(3, { message: 'code ต้องมีอย่างน้อย 3 ตัวอักษร' }),
  name: z.string().min(3, { message: 'name ต้องมีอย่างน้อย 3 ตัวอักษร' }),
  price: z.number().gt(0, { message: 'price ต้องมากกว่า 0' }),
  stock: z.number().int({ message: 'stock ต้องเป็นจำนวนเต็ม' }).min(0, { message: 'stock ต้องไม่น้อยกว่า 0' }),
});

// ข้อ 3.1: GET /api/products รองรับ ?search=notebook
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const products = await prisma.product.findMany({
      where: search
        ? {
            name: {
              contains: search,
            },
          }
        : {},
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ข้อ 3.2 & 3.3: POST /api/products
export async function POST(req: Request) {
  try {
    // เรียกใช้ verifyAuth(req) เพื่อตรวจสอบ Token และ Role
    const userOrResponse = verifyAuth(req);
    if ('status' in userOrResponse) return userOrResponse;

    if (!['ADMIN', 'STAFF'].includes(userOrResponse.role)) {
      return NextResponse.json({ message: 'Forbidden: Access denied' }, { status: 403 });
    }

    const body = await req.json();

    // ข้อ 3.3: Security - Client ห้ามส่ง id หรือ createdAt มาเอง
    if (body.id !== undefined || body.createdAt !== undefined) {
      return NextResponse.json(
        { message: 'Bad Request: Client ห้ามส่ง id หรือ createdAt เอง' },
        { status: 400 }
      );
    }

    // ข้อ 3.2: Validate ข้อมูลด้วย Zod
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: 'Bad Request: ข้อมูลไม่ถูกต้อง',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: validation.data,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}