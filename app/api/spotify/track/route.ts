import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('id')
    
    if (!trackId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Track ID is required' 
      }, { status: 400 })
    }

    // This would normally call the Spotify API, but for simplicity we'll return mock data
    const mockData = {
      id: trackId,
      name: "Track Name", // This would come from the actual API
      popularity: Math.floor(Math.random() * 100),
      duration_ms: 210000 + Math.floor(Math.random() * 60000),
      explicit: Math.random() > 0.5,
      release_date: "2023-01-01",
      audio_features: {
        danceability: Math.random().toFixed(2),
        energy: Math.random().toFixed(2),
        key: Math.floor(Math.random() * 12),
        loudness: -6 - Math.random() * 10,
        mode: Math.round(Math.random()),
        speechiness: (Math.random() * 0.2).toFixed(2),
        acousticness: Math.random().toFixed(2),
        instrumentalness: (Math.random() * 0.4).toFixed(2),
        liveness: (Math.random() * 0.3).toFixed(2),
        valence: Math.random().toFixed(2),
        tempo: 90 + Math.random() * 50
      },
      artists: [
        {
          id: "artist_" + Math.random().toString(36).substring(7),
          name: "Artist Name",
          type: "artist"
        }
      ],
      external_urls: {
        spotify: `https://open.spotify.com/track/${trackId}`
      }
    }
    
    return NextResponse.json(mockData)
  } catch (error: any) {
    console.error('Error fetching Spotify track data:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch Spotify track data'
    }, { status: 500 })
  }
}
