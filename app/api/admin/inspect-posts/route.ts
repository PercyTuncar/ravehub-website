import { NextResponse } from 'next/server';
import { getAllPostsForAdmin } from '@/lib/firebase/blog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await getAllPostsForAdmin();
    return NextResponse.json(posts, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching posts for inspection:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch posts', details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
