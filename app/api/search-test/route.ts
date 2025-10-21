import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const term = searchParams.get('q') || searchParams.get('term')
  const type = searchParams.get('type') || 'artist'

  console.log('Test search endpoint called with:', { term, type })

  if (!term) {
    console.log('No search term provided')
    return NextResponse.json({ 
      success: false, 
      message: 'Search term is required' 
    }, { status: 400 })
  }

  // Return mock data for now to test the flow
  const mockResults = [
    {
      id: '1',
      name: 'Test Artist',
      type: 'artist',
      imageUrl: 'https://via.placeholder.com/300',
      genres: ['pop'],
      popularityScore: 80,
      followers: 1000000
    }
  ]

  console.log('Returning mock results:', mockResults)
  
  return NextResponse.json({ 
    success: true, 
    results: mockResults
  })
}
