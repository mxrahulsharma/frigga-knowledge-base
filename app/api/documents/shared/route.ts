import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // Find documents where the user has VIEW permissions but is not the author
  const sharedDocuments = await prisma.document.findMany({
    where: {
      permissions: {
        some: {
          userId: userId,
          level: 'VIEW', // Only VIEW permissions
        },
      },
      authorId: {
        not: userId, // Exclude documents where user is the author
      },
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      permissions: {
        where: {
          userId: userId,
          level: 'VIEW',
        },
        select: {
          level: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Transform the data to include permission level
  const documents = sharedDocuments.map((doc) => ({
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    visibility: doc.visibility,
    author: doc.author,
    permission: 'VIEW', // All documents in this list are VIEW only
  }));

  return NextResponse.json(documents);
} 