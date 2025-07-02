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
    const query = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || 'all'; // all, owned, shared, recent, archived
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query.trim()) {
      return NextResponse.json({ results: [], total: 0 });
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build search conditions based on filter
    let whereConditions: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { path: ['content'], string_contains: query } }
      ]
    };

    // Add filter-specific conditions
    switch (filter) {
      case 'owned':
        whereConditions.authorId = user.id;
        break;
      case 'shared':
        whereConditions = {
          ...whereConditions,
          authorId: { not: user.id },
          permissions: {
            some: {
              userId: user.id
            }
          }
        };
        break;
      case 'recent':
        // For recent, we'll get documents updated in the last 30 days
        whereConditions.updatedAt = {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        };
        // Also ensure user has access to these documents
        whereConditions = {
          ...whereConditions,
          OR: [
            { authorId: user.id },
            {
              permissions: {
                some: {
                  userId: user.id
                }
              }
            }
          ]
        };
        break;
      case 'archived':
        // For now, return empty since archive functionality isn't fully implemented
        return NextResponse.json({ results: [], total: 0 });
      default:
        // 'all' - include all documents user has access to
        whereConditions = {
          ...whereConditions,
          OR: [
            { authorId: user.id },
            {
              permissions: {
                some: {
                  userId: user.id
                }
              }
            }
          ]
        };
    }

    // Perform the search
    const documents = await prisma.document.findMany({
      where: whereConditions,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        permissions: {
          where: {
            userId: user.id
          },
          select: {
            level: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ],
      take: limit
    });

    // Transform results to include search relevance and ownership info
    const results = documents.map(doc => {
      const isOwner = doc.authorId === user.id;
      const permission = doc.permissions[0]?.level || (isOwner ? 'OWNER' : 'NONE');
      
      // Calculate simple relevance score based on title match
      const titleMatch = doc.title.toLowerCase().includes(query.toLowerCase());
      const relevanceScore = titleMatch ? 2 : 1;

      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
        visibility: doc.visibility,
        author: doc.author,
        isOwner,
        permission,
        relevanceScore,
        // Add search highlights
        titleHighlight: highlightText(doc.title, query),
        contentPreview: extractContentPreview(doc.content, query)
      };
    });

    // Sort by relevance score (title matches first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      results,
      total: results.length,
      query,
      filter
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to highlight search terms
function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Helper function to extract content preview
function extractContentPreview(content: any, query: string): string {
  if (!content || !content.content) return '';
  
  // Extract text from TipTap JSON content
  let text = '';
  if (Array.isArray(content.content)) {
    text = content.content
      .map((node: any) => {
        if (node.type === 'paragraph' && node.content) {
          return node.content
            .map((child: any) => child.text || '')
            .join(' ');
        }
        return '';
      })
      .join(' ');
  }

  // Find the position of the query in the text
  const queryIndex = text.toLowerCase().indexOf(query.toLowerCase());
  if (queryIndex === -1) {
    // If query not found, return first 150 characters
    return text.substring(0, 150) + (text.length > 150 ? '...' : '');
  }

  // Extract context around the query (75 characters before and after)
  const start = Math.max(0, queryIndex - 75);
  const end = Math.min(text.length, queryIndex + query.length + 75);
  let preview = text.substring(start, end);

  // Add ellipsis if we're not at the beginning/end
  if (start > 0) preview = '...' + preview;
  if (end < text.length) preview = preview + '...';

  // Highlight the query in the preview
  return highlightText(preview, query);
} 