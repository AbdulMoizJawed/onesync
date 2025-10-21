import { NextRequest, NextResponse } from 'next/server';
import { musoApi } from '@/lib/muso-api';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'profile';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const result = await musoApi.search({
      keyword: query,
      type: [type as any],
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Muso API search error:', error);
    const message = error instanceof Error ? error.message : 'Search failed';
    const isRateLimited = typeof message === 'string' && message.includes('429');
    const isForbidden = typeof message === 'string' && message.includes('403');
    const isTimeout = typeof message === 'string' && (message.includes('504') || message.toLowerCase().includes('timeout'));

    let status = 500;
    if (isRateLimited) status = 429;
    else if (isForbidden) status = 403;
    else if (isTimeout) status = 504;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, type = ['profile'], limit = 20, offset = 0, ...otherParams } = body;

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const result = await musoApi.search({
      keyword,
      type,
      limit,
      offset,
      ...otherParams,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Muso API search error:', error);
    const message = error instanceof Error ? error.message : 'Search failed';
    const isRateLimited = typeof message === 'string' && message.includes('429');
    const isForbidden = typeof message === 'string' && message.includes('403');

    let status = 500;
    if (isRateLimited) status = 429;
    else if (isForbidden) status = 403;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
