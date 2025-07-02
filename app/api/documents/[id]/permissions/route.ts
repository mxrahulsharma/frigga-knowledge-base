import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = id;

    // Check if user has access to this document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
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
        author: { select: { id: true, email: true, name: true } },
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get all permissions for this document
    const permissions = await prisma.documentPermission.findMany({
      where: {
        documentId: documentId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;
    const { email, level } = await request.json();

    if (!email || !level) {
      return NextResponse.json(
        { error: 'Email and permission level are required' },
        { status: 400 }
      );
    }

    if (!['VIEW', 'EDIT'].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid permission level' },
        { status: 400 }
      );
    }

    // Check if user is the document owner
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        author: { email: session.user.email }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Only document owners can manage permissions' },
        { status: 403 }
      );
    }

    // Find the user to grant permission to
    const targetUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if permission already exists
    const existingPermission = await prisma.documentPermission.findFirst({
      where: {
        documentId: documentId,
        userId: targetUser.id
      }
    });

    if (existingPermission) {
      // Update existing permission
      const updatedPermission = await prisma.documentPermission.update({
        where: { id: existingPermission.id },
        data: { level },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
      return NextResponse.json(updatedPermission);
    }

    // Create new permission
    const newPermission = await prisma.documentPermission.create({
      data: {
        documentId: documentId,
        userId: targetUser.id,
        level
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(newPermission, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user is the document owner
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        author: { email: session.user.email }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Only document owners can manage permissions' },
        { status: 403 }
      );
    }

    // Find and delete the permission
    const permission = await prisma.documentPermission.findFirst({
      where: {
        documentId: documentId,
        userId: userId
      }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    await prisma.documentPermission.delete({
      where: { id: permission.id }
    });

    return NextResponse.json({ message: 'Permission removed successfully' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;
    const body = await request.json();

    if (!body.title || !body.content || !body.visibility) {
      return NextResponse.json(
        { error: 'Title, content, and visibility are required' },
        { status: 400 }
      );
    }

    // Check if user is the document owner
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        author: { email: session.user.email }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Only document owners can update documents' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: {
        title: body.title,
        content: body.content,
        visibility: body.visibility,
      }
    });

    return NextResponse.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 