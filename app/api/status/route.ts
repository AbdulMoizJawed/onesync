import { NextResponse } from 'next/server';
import { spotontrackApi } from '@/lib/spotontrack-api';

export async function GET() {
  try {
    // Check SpotonTrack API using our health check method
    const spotontrackCheck = await spotontrackApi.healthCheck()
      .catch(() => false);

    const apiStatus = {
      spotontrack: spotontrackCheck
    };

    return NextResponse.json(apiStatus, { status: 200 });
  } catch (error) {
    console.error('API status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check API status' },
      { status: 500 }
    );
  }
}
