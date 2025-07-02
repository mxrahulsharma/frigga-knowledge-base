import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password || !name)
    return NextResponse.json({ message: 'Missing fields' }, { status: 400 });

  const userExists = await prisma.user.findUnique({ where: { email } });

  if (userExists)
    return NextResponse.json({ message: 'Email already in use' }, { status: 400 });

  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return NextResponse.json({ message: 'User created' }, { status: 201 });
}
