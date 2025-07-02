import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // Get user's own documents
  const ownDocuments = await prisma.document.findMany({
    where: {
      authorId: userId,
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Get shared documents
  const sharedDocuments = await prisma.document.findMany({
    where: {
      permissions: {
        some: {
          userId: userId,
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

  // Transform own documents
  const transformedOwnDocs = ownDocuments.map((doc) => ({
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    visibility: doc.visibility,
    author: doc.author,
    isOwned: true,
  }));

  // Transform shared documents
  const transformedSharedDocs = sharedDocuments.map((doc) => ({
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    visibility: doc.visibility,
    author: doc.author,
    isOwned: false,
    permission: doc.permissions[0]?.level || 'VIEW',
  }));

  // Combine and sort by updatedAt
  const allDocuments = [...transformedOwnDocs, ...transformedSharedDocs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return NextResponse.json(allDocuments);
} 