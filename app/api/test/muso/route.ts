import { NextRequest, NextResponse } from 'next/server';
import { musoApi } from '@/lib/muso-api';

export async function GET() {
  try {
    console.log('Testing MUSO API...');
    
    // Test with the roles endpoint first (might have different rate limits)
    const rolesResult = await musoApi.getRoles({
      limit: 5,
    });

    console.log('MUSO API Roles Response:', rolesResult);

    return NextResponse.json({
      success: true,
      message: 'MUSO API is working!',
      data: rolesResult,
      test: 'roles_endpoint'
    });
  } catch (error) {
    console.error('MUSO API Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'MUSO API test failed'
    }, { status: 500 });
  }
}
