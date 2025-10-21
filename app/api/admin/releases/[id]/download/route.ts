// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const releaseId = params.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch release data with tracks
    const { data: release, error: releaseError } = await supabase
      .from('releases')
      .select(`
        *,
        tracks(*),
        profiles:user_id(id, full_name, email)
      `)
      .eq('id', releaseId)
      .single()

    if (releaseError || !release) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      )
    }

    // Create a new ZIP file
    const zip = new JSZip()

    // 1. Create CSV with release metadata
    const csvData = generateReleaseCSV(release)
    zip.file(`${sanitizeFilename(release.title)}_metadata.csv`, csvData)

    // 2. Download and add cover art
    if (release.cover_art_url) {
      try {
        const artworkResponse = await fetch(release.cover_art_url)
        if (artworkResponse.ok) {
          const artworkBlob = await artworkResponse.blob()
          const artworkBuffer = await artworkBlob.arrayBuffer()
          const extension = getFileExtension(release.cover_art_url) || 'jpg'
          zip.file(`${sanitizeFilename(release.title)}_artwork.${extension}`, artworkBuffer)
        }
      } catch (error) {
        console.error('Error downloading artwork:', error)
        // Continue even if artwork fails
      }
    }

    // 3. Download and add audio files (from tracks)
    if (release.tracks && release.tracks.length > 0) {
      for (const track of release.tracks) {
        if (track.file_url) {
          try {
            const audioResponse = await fetch(track.file_url)
            if (audioResponse.ok) {
              const audioBlob = await audioResponse.blob()
              const audioBuffer = await audioBlob.arrayBuffer()
              const extension = getFileExtension(track.file_url) || 'wav'
              const trackNumber = track.track_number ? `${track.track_number.toString().padStart(2, '0')}_` : ''
              zip.file(`${trackNumber}${sanitizeFilename(track.title)}.${extension}`, audioBuffer)
            }
          } catch (error) {
            console.error(`Error downloading track ${track.title}:`, error)
            // Continue even if a track fails
          }
        }
      }
    }

    // 4. Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    // 5. Return the ZIP file
    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(release.title)}_complete.zip"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to create download package' },
      { status: 500 }
    )
  }
}

// Helper function to generate CSV from release data
function generateReleaseCSV(release: any): string {
  const headers = [
    'Field', 'Value'
  ]

  const rows = [
    ['Release ID', release.id],
    ['Title', release.title],
    ['Artist Name', release.artist_name],
    ['Genre', release.genre],
    ['Release Date', release.release_date || 'N/A'],
    ['Status', release.status],
    ['Created At', new Date(release.created_at).toLocaleString()],
    ['User ID', release.user_id],
    ['User Name', release.profiles?.full_name || 'N/A'],
    ['User Email', release.profiles?.email || 'N/A'],
    ['Cover Art URL', release.cover_art_url || 'N/A'],
    ['Audio URL', release.audio_url || 'N/A'],
    ['Streams', release.streams || 0],
    ['Revenue', `$${release.revenue || 0}`],
    ['Platforms', (release.platforms || []).join(', ') || 'N/A'],
    [''],
    ['=== TRACKS ===', ''],
    [''],
  ]

  // Add track information
  if (release.tracks && release.tracks.length > 0) {
    release.tracks.forEach((track: any, index: number) => {
      rows.push([`Track ${index + 1}`, ''])
      rows.push(['  Track ID', track.id])
      rows.push(['  Title', track.title])
      rows.push(['  Track Number', track.track_number || 'N/A'])
      rows.push(['  File URL', track.file_url || 'N/A'])
      rows.push(['  ISRC', track.isrc || 'N/A'])
      rows.push(['  Explicit', track.explicit ? 'Yes' : 'No'])
      rows.push([''])
    })
  }

  // Add metadata if exists
  if (release.metadata && Object.keys(release.metadata).length > 0) {
    rows.push(['=== METADATA ===', ''])
    rows.push([''])
    Object.entries(release.metadata).forEach(([key, value]) => {
      rows.push([key, String(value)])
    })
  }

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return csvContent
}

// Helper function to sanitize filenames
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 100)
}

// Helper function to get file extension from URL
function getFileExtension(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const match = pathname.match(/\.([a-z0-9]+)$/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}
