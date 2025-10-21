import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { combinedMusicApi } from '@/lib/combined-music-api'

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all artists for this user that don't have images
    const { data: artists, error: fetchError } = await supabase
      .from('artists')
      .select('*')
      .eq('user_id', user_id)
      .or('image.is.null,image.eq.,avatar_url.is.null,avatar_url.eq.')

    if (fetchError) {
      console.error('Error fetching artists:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch artists' },
        { status: 500 }
      )
    }

    if (!artists || artists.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No artists need image updates',
        updated: 0
      })
    }

    console.log(`🎨 Updating images for ${artists.length} artists...`)

    let updatedCount = 0
    const results = []

    // Process artists one by one to avoid rate limiting
    for (const artist of artists) {
      try {
        console.log(`🔍 Searching for image for: ${artist.name}`)
        
        // Get enriched artist data from Spotify
        const enrichedData = await combinedMusicApi.getEnrichedArtistData(artist.name)
        
        if (enrichedData.combined.imageUrl) {
          // Update the artist with the new image
          const { error: updateError } = await supabase
            .from('artists')
            .update({ 
              image: enrichedData.combined.imageUrl,
              avatar_url: enrichedData.combined.imageUrl, // Keep both columns in sync
              // Also update Spotify URL if we have it
              spotify_url: enrichedData.combined.socialLinks?.spotify || artist.spotify_url || artist.spotify,
              spotify: enrichedData.combined.socialLinks?.spotify || artist.spotify_url || artist.spotify
            })
            .eq('id', artist.id)
            .eq('user_id', user_id)

          if (updateError) {
            console.error(`❌ Failed to update ${artist.name}:`, updateError)
            results.push({
              name: artist.name,
              success: false,
              error: updateError.message
            })
          } else {
            console.log(`✅ Updated image for: ${artist.name}`)
            updatedCount++
            results.push({
              name: artist.name,
              success: true,
              imageUrl: enrichedData.combined.imageUrl
            })
          }
        } else {
          console.log(`⚠️ No image found for: ${artist.name}`)
          results.push({
            name: artist.name,
            success: false,
            error: 'No image found on Spotify'
          })
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Error processing ${artist.name}:`, error)
        results.push({
          name: artist.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`🎉 Image update complete! Updated ${updatedCount}/${artists.length} artists`)

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} artist images`,
      updated: updatedCount,
      total: artists.length,
      results
    })

  } catch (error) {
    console.error('Error updating artist images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
