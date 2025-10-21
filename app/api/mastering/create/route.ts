import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiMasteringService } from '@/lib/ai-mastering'

const masteringRequestSchema = z.object({
  input_audio_id: z.number(),
  mode: z.enum(['default', 'custom']).optional(),
  preset: z.enum(['general', 'pop', 'jazz', 'classical']).optional(),
  target_loudness: z.number().min(-30).max(0).optional(),
  target_loudness_mode: z.enum(['loudness', 'rms', 'peak', 'youtube_loudness']).optional(),
  mastering: z.boolean().optional(),
  output_format: z.enum(['wav', 'mp3']).optional(),
  bit_depth: z.union([z.literal(16), z.literal(24), z.literal(32)]).optional(),
  sample_rate: z.literal(44100).optional(),
  bass_preservation: z.boolean().optional(),
  mastering_algorithm: z.enum(['v1', 'v2']).optional(),
  mastering_reverb: z.boolean().optional(),
  mastering_reverb_gain: z.number().min(-60).max(0).optional(),
  low_cut_freq: z.number().min(10).max(100).optional(),
  high_cut_freq: z.number().min(10000).max(22000).optional(),
  noise_reduction: z.boolean().optional(),
  ceiling: z.number().min(-3).max(0).optional(),
  ceiling_mode: z.enum(['lowpass_true_peak', 'hard_clip', 'analog_clip']).optional(),
  oversample: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(8)]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    console.log('[Mastering Create] Received create request')
    const body = await request.json()
    console.log('[Mastering Create] Request body:', body)
    
    // Validate request body
    const validatedData = masteringRequestSchema.parse(body)
    console.log('[Mastering Create] Validated data:', validatedData)

    // Create mastering job
    console.log('[Mastering Create] Creating mastering job...')
    const result = await aiMasteringService.createMastering(validatedData)
    console.log('[Mastering Create] Job created:', result.id, 'Status:', result.status)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Mastering Create] Creation error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('[Mastering Create] Validation error:', error.issues)
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues 
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create mastering job' },
      { status: 500 }
    )
  }
}
