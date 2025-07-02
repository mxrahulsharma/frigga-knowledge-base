import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  // For now, return empty array since archive functionality needs schema update
  // This will be implemented once we add isArchived and archivedAt fields to the Document model
  return NextResponse.json([]);
} 