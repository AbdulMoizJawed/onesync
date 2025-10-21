import { NextResponse } from 'next/server'

const API_KEY = 'jgdRcPw42mGxmcgFb2icOopo4HCRbNkwfiefxeLCbc2f9fe8'
const BASE_URL = 'https://www.spotontrack.com/api/v1'

export async function POST(request: Request) {
  try {
    const { isrc } = await request.json()
    
    if (!isrc) {
      return NextResponse.json({ error: 'ISRC parameter is required' }, { status: 400 })
    }

    const [currentCharts, peakCharts] = await Promise.all([
      fetch(`${BASE_URL}/tracks/${isrc}/spotify/charts/current`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${BASE_URL}/tracks/${isrc}/spotify/charts/peak`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      })
    ])

    const current = currentCharts.ok ? await currentCharts.json() : []
    const peak = peakCharts.ok ? await peakCharts.json() : []

    return NextResponse.json({ current, peak })
  } catch (error) {
    console.error('Spotify charts error:', error)
    return NextResponse.json({ error: 'Failed to fetch Spotify charts' }, { status: 500 })
  }
}
