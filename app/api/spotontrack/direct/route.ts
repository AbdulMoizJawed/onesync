/**
 * Verified SpotOnTrack API Endpoint Wrapper
 * This file provides direct access to the SpotOnTrack API
 * to ensure that the real API key is used properly.
 */

import { NextRequest, NextResponse } from 'next/server'

// The direct API key approach ensures we're using the real key from .env.local
const API_KEY = process.env.SPOTONTRACK_API_KEY

export async function GET(request: NextRequest) {
  if (!API_KEY || API_KEY === 'dev_fallback_key' || API_KEY === 'your_spotontrack_api_key_here') {
    return NextResponse.json({ 
      success: false, 
      message: 'API key not configured properly' 
    }, { status: 500 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  
  if (!query) {
    return NextResponse.json({ 
      success: false, 
      message: 'Query parameter is required' 
    }, { status: 400 })
  }

  try {
    console.log('🎯 SpotOnTrack Direct API: Searching for', query)
    console.log('🎯 Using API key:', `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 5)}`)
    
    // Make a direct request to the SpotOnTrack API
    const response = await fetch(`https://www.spotontrack.com/api/v1/tracks?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('🎯 SpotOnTrack Direct API: Found', data.length, 'results')
    
    return NextResponse.json({ 
      success: true, 
      results: data 
    })
  } catch (error) {
    console.error('SpotOnTrack Direct API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
