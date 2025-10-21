import { NextRequest, NextResponse } from 'next/server'
import { aiMasteringService } from '@/lib/ai-mastering'

export async function GET(
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

    const mastering = await aiMasteringService.getMastering(id)
    
    return NextResponse.json(mastering)
  } catch (error) {
    console.error('Status check error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get mastering status' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const result = await aiMasteringService.deleteMastering(id)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Delete mastering error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete mastering' },
      { status: 500 }
    )
  }
}
