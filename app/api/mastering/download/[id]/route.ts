import { NextRequest, NextResponse } from 'next/server'
import { aiMasteringService } from '@/lib/ai-mastering'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const audioId = parseInt(params.id)
    
    if (isNaN(audioId)) {
      return NextResponse.json(
        { error: 'Invalid audio ID' },
        { status: 400 }
      )
    }

    // Get the audio info first
    const audioInfo = await aiMasteringService.getAudio(audioId)
    
    // Get the audio blob
    const audioBlob = await aiMasteringService.downloadAudio(audioId)
    
    // Determine file extension based on the original name or format
    const fileName = audioInfo.name || `mastered_audio_${audioId}.wav`
    
    // Return the file as a download
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': audioBlob.size.toString(),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to download audio file' },
      { status: 500 }
    )
  }
}
