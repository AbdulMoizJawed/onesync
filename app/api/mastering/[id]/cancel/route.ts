import { NextRequest, NextResponse } from 'next/server'
import { aiMasteringService } from '@/lib/ai-mastering'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid mastering ID' },
        { status: 400 }
      )
    }

    const result = await aiMasteringService.cancelMastering(id)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Cancel mastering error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to cancel mastering' },
      { status: 500 }
    )
  }
}
