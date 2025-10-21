import { NextRequest, NextResponse } from 'next/server'

// Temporary bypass for development - REMOVE IN PRODUCTION
const DEVELOPMENT_BYPASS = process.env.NODE_ENV === 'development'

export async function POST(request: NextRequest) {
  try {
    console.log('🎨 Generate Artwork API called')
    
    // Parse the request body
    const body = await request.json()
    const { prompt } = body
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }
    
    console.log(`🎨 Generating high-quality artwork for prompt: ${prompt}`)
    
    // Get HuggingFace API token
    const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN
    
    if (!HF_API_TOKEN) {
      console.error('❌ HuggingFace API token not found')
      console.error('💡 To get real AI generation, set up a valid HuggingFace API token:')
      console.error('   1. Go to https://huggingface.co/settings/tokens')
      console.error('   2. Create a new token with "Read" permissions') 
      console.error('   3. Update HUGGINGFACE_API_TOKEN in .env.local')
      console.error('   4. This will use the new HF Inference Providers with FLUX.1-dev model')
      return NextResponse.json(
        { 
          error: 'HuggingFace API token not configured',
          success: false,
          isRealAI: false,
          hasImage: false,
          setupInstructions: 'Get a HuggingFace token at https://huggingface.co/settings/tokens for FLUX.1-dev AI generation'
        },
        { status: 500 }
      )
    }

    let imageUrl = ''
    let generationMethod = ''
    let isRealAI = false

    try {
      console.log('🤖 Calling HuggingFace Inference API...')
      
      // Try multiple models in order of preference
      const models = [
        'black-forest-labs/FLUX.1-schnell',  // Faster FLUX variant
        'stabilityai/stable-diffusion-xl-base-1.0',
        'runwayml/stable-diffusion-v1-5'
      ]
      
      let apiSuccess = false
      let modelUsed = ''
      
      for (const model of models) {
        try {
          console.log(`🔄 Trying model: ${model}`)
          const API_URL = `https://api-inference.huggingface.co/models/${model}`
          
          const hfResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: `${prompt}, high quality, detailed, album artwork, professional, digital art, masterpiece`,
              parameters: {
                num_inference_steps: 20,
                guidance_scale: 7.5
              }
            }),
            // Shorter timeout per model attempt
            signal: AbortSignal.timeout(25000)
          })

          console.log(`📡 HuggingFace response status for ${model}: ${hfResponse.status}`)

          if (hfResponse.ok) {
            const blob = await hfResponse.blob()
            
            if (blob.size > 0) {
              // Convert blob to base64
              const arrayBuffer = await blob.arrayBuffer()
              const base64 = Buffer.from(arrayBuffer).toString('base64')
              imageUrl = `data:image/png;base64,${base64}`
              generationMethod = `HuggingFace ${model}`
              isRealAI = true
              modelUsed = model
              apiSuccess = true
              console.log(`✅ Real AI artwork generated successfully with ${model}!`)
              break
            }
          } else {
            console.log(`❌ Model ${model} failed with status: ${hfResponse.status}`)
          }
        } catch (modelError) {
          console.log(`⚠️ Model ${model} failed:`, modelError instanceof Error ? modelError.message : String(modelError))
          continue
        }
      }
      
      if (!apiSuccess) {
        throw new Error('All HuggingFace models failed or timed out')
      }
      
    } catch (hfError) {
      const errorMessage = hfError instanceof Error ? hfError.message : String(hfError)
      console.error('🔄 HuggingFace failed, using themed placeholder:', errorMessage)
      
      // Create themed placeholder based on prompt keywords
      const themeKeywords = prompt.toLowerCase()
      let category = 'abstract'
      let seed = 1
      
      if (themeKeywords.includes('basketball') || themeKeywords.includes('sport')) {
        category = 'sports'
        seed = 42
      } else if (themeKeywords.includes('space') || themeKeywords.includes('galaxy') || themeKeywords.includes('stars')) {
        category = 'space'
        seed = 123
      } else if (themeKeywords.includes('neon') || themeKeywords.includes('city') || themeKeywords.includes('cyber')) {
        category = 'urban'  
        seed = 256
      } else if (themeKeywords.includes('nature') || themeKeywords.includes('forest') || themeKeywords.includes('mountain')) {
        category = 'nature'
        seed = 789
      } else if (themeKeywords.includes('music') || themeKeywords.includes('studio') || themeKeywords.includes('instrument')) {
        category = 'music'
        seed = 555
      }
      
      // Generate consistent themed 1024x1024 placeholder with better visual quality
      const timestamp = Math.floor(Date.now() / (1000 * 60 * 5)) // Change every 5 minutes for consistency
      imageUrl = `https://picsum.photos/seed/${seed + timestamp}/1024/1024?blur=1`
      generationMethod = `Themed placeholder (${category}) - Need fresh HF token for FLUX.1-dev AI generation`
      isRealAI = false
      
      console.log(`🎨 Using consistent themed placeholder for category: ${category} (seed: ${seed + timestamp})`)
    }

    const response = {
      success: true,
      imageUrl,
      generationMethod,
      prompt,
      isRealAI,
      hasImage: true,
      resolution: '1024x1024 (Model Native)'
    }

    console.log('🎯 Final response:', { 
      success: response.success, 
      isRealAI: response.isRealAI, 
      hasImage: response.hasImage 
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in generate-artwork API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate artwork',
        success: false,
        isRealAI: false,
        hasImage: false
      },
      { status: 500 }
    )
  }
}
