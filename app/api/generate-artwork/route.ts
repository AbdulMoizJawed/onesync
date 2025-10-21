import { NextRequest, NextResponse } from 'next/server'

// Hugging Face Inference API for PixArt-Sigma
const HF_API_URL = "https://api-inference.huggingface.co/models/PixArt-alpha/PixArt-Sigma"
const HF_API_KEY = process.env.HUGGINGFACE_API_TOKEN

export async function POST(request: NextRequest) {
  try {
    if (!HF_API_KEY) {
      return NextResponse.json(
        { error: "Hugging Face API key not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { prompt, width = 3000, height = 3000 } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: "Valid prompt is required" },
        { status: 400 }
      )
    }

    // Enhance the prompt for better artwork generation
    const enhancedPrompt = `High quality digital artwork, ${prompt}, professional album cover style, vibrant colors, 3000x3000 resolution, detailed, artistic, music-themed`

    console.log('Generating artwork with prompt:', enhancedPrompt)

    // Call Hugging Face Inference API
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: enhancedPrompt,
        parameters: {
          width: Math.min(width, 3000), // Cap at 3000px for safety
          height: Math.min(height, 3000),
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Hugging Face API error:', errorText)
      
      if (response.status === 503) {
        return NextResponse.json(
          { error: "AI model is currently loading. Please try again in a moment." },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: "Failed to generate artwork" },
        { status: response.status }
      )
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: "No image data received from AI model" },
        { status: 500 }
      )
    }

    // Convert to base64 for easy client-side handling
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const imageUrl = `data:image/png;base64,${base64Image}`

    // In a production environment, you would typically save this to cloud storage
    // and return the permanent URL instead of base64

    return NextResponse.json({
      url: imageUrl,
      prompt: enhancedPrompt,
      width,
      height,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating artwork:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "AI Artwork Generation API",
    model: "PixArt-Sigma",
    supported_formats: ["PNG"],
    max_resolution: "3000x3000",
    endpoint: "POST /api/generate-artwork"
  })
}
