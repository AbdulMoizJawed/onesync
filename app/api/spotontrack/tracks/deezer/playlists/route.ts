import { NextResponse } from 'next/server'

const API_KEY = 'jgdRcPw42mGxmcgFb2icOopo4HCRbNkwfiefxeLCbc2f9fe8'
const BASE_URL = 'https://www.spotontrack.com/api/v1'

export async function POST(request: Request) {
  try {
    const { isrc } = await request.json()
    
    if (!isrc) {
      return NextResponse.json({ error: 'ISRC parameter is required' }, { status: 400 })
    }

    const response = await fetch(`${BASE_URL}/tracks/${isrc}/deezer/playlists/current`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Deezer playlists error:', error)
    return NextResponse.json({ error: 'Failed to fetch Deezer playlists' }, { status: 500 })
  }
}
