import { NextRequest, NextResponse } from 'next/server';
import { musoApiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper function to get client identifier
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return `muso_search_${ip}`;
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientId(request);
    const status = musoApiRateLimiter.status(clientId);
    
    return NextResponse.json({
      success: true,
      rateLimit: {
        limit: 30,
        remaining: status.remaining,
        used: status.count,
        resetTime: status.resetTime,
        resetIn: Math.max(0, Math.ceil((status.resetTime - Date.now()) / 1000))
      }
    });
  } catch (error) {
    console.error('Rate limit status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get rate limit status' },
      { status: 500 }
    );
  }
}
