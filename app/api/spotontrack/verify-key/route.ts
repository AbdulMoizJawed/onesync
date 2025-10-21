import { NextRequest, NextResponse } from 'next/server'
import { spotontrackApi } from '@/lib/spotontrack-api'

/**
 * EMERGENCY: Direct API Key Verification Endpoint
 * This endpoint bypasses all middleware and verifies the API key directly
 */
export async function GET(request: NextRequest) {
  console.log('🚨 EMERGENCY API KEY VERIFICATION ENDPOINT');
  
  try {
    // Get the API key directly from environment 
    const apiKey = process.env.SPOTONTRACK_API_KEY;
    console.log('🔑 API key from process.env:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 5)}` : 'NOT SET');
    
    // Verify API key using both our API client and a direct fetch
    const clientVerification = await spotontrackApi.verifyApiKey();
    
    // Make a direct fetch request as well
    let directFetchSuccess = false;
    let directResponseSample = '';
    try {
      const directResponse = await fetch('https://www.spotontrack.com/api/v1/tracks?query=test', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        directFetchSuccess = true;
        directResponseSample = JSON.stringify(data.slice(0, 1));
      } else {
        directResponseSample = await directResponse.text();
      }
    } catch (error) {
      directResponseSample = error instanceof Error ? error.message : String(error);
    }
    
    return NextResponse.json({
      success: true,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 4) : 'none',
      apiKeySuffix: apiKey ? apiKey.substring(apiKey.length - 4) : 'none',
      clientVerification,
      directFetchSuccess,
      directResponseSample
    });
  } catch (error) {
    console.error('API verification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
