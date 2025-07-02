import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const authorId = searchParams.get('authorId');

    const where = authorId ? { authorId } : {};

    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // Mark which documents the current user owns
    const documentsWithOwnership = documents.map(doc => ({
      ...doc,
      isOwner: doc.author.email === session.user.email
    }));

    return NextResponse.json(documentsWithOwnership);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { title, authorId } = await req.json();

  if (!title || !authorId) {
    return NextResponse.json({ error: 'Title and authorId are required' }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      title,
      authorId,
    },
  });

  return NextResponse.json(document);
}
  