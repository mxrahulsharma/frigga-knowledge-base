import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

// Helper function to extract mentioned user IDs from TipTap content
function extractMentionedUserIds(content: any): string[] {
  const mentions: string[] = [];

  function walk(node: any) {
    if (!node) return;
    
    // Check for mention nodes
    if (node.type === 'mention' && node.attrs?.id) {
      mentions.push(node.attrs.id);
    }
    
    // Also check for customMention nodes (if using custom extension)
    if (node.type === 'customMention' && node.attrs?.id) {
      mentions.push(node.attrs.id);
    }
    
    // Recursively walk through content
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  }

  walk(content);
  return Array.from(new Set(mentions)); // Remove duplicates
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        OR: [
          { author: { email: session.user.email } },
          {
            permissions: {
              some: {
                user: { email: session.user.email }
              }
            }
          }
        ]
      },
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

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user is the owner
    const isOwner = document.author.email === session.user.email;

    return NextResponse.json({
      ...document,
      isOwner
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, visibility } = body;

    // Check if user is the document owner
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        author: { email: session.user.email }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Only document owners can edit documents' },
        { status: 403 }
      );
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Extract mentioned user IDs from content
    const mentionedUserIds = extractMentionedUserIds(content);

    // Update the document
    const updated = await prisma.document.update({
      where: { id: params.id },
      data: {
        title,
        content,
        visibility,
      },
    });

    // Save version
    await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        content,
        authorId: user.id,
      },
    });

    // Auto-assign permissions to mentioned users
    if (mentionedUserIds.length > 0) {
      await Promise.all(mentionedUserIds.map((userId) =>
        prisma.documentPermission.upsert({
          where: {
            documentId_userId: {
              documentId: params.id,
              userId,
            },
          },
          update: { level: 'VIEW' }, // Update existing permissions to VIEW
          create: {
            documentId: params.id,
            userId,
            level: 'VIEW',
          },
        })
      ));

      // Create notifications for mentioned users
      await prisma.notification.createMany({
        data: mentionedUserIds.map((userId) => ({
          userId,
          documentId: params.id,
          message: `${user.name || user.email} mentioned you in "${title}"`,
        })),
        skipDuplicates: true, // Skip if notification already exists
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
