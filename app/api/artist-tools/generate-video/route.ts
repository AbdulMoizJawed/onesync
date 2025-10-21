import { NextResponse } from 'next/server'
import Replicate from 'replicate'

export async function POST(request: Request) {
  try {
    console.log('🎬 Starting video generation with Replicate API...');
    
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🎬 Starting video generation for prompt:', prompt);

    // Check for Replicate API token
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ Replicate API token not found');
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });

    // Available text-to-video models on Replicate
    const models = [
      'minimax/video-01',
      'lightricks/ltx-video'
    ];
    
    console.log('🚀 Using Replicate API with models:', models);

    for (const modelName of models) {
      try {
        console.log(`🎯 Attempting video generation with model: ${modelName}`);
        
        let input: Record<string, any> = {};
        
        // Configure input based on model type
        if (modelName === 'minimax/video-01') {
          input = {
            prompt: prompt,
            num_inference_steps: 25,
            guidance_scale: 7.5,
            num_frames: 16,
            fps: 8
          };
        } else if (modelName === 'lightricks/ltx-video') {
          input = {
            prompt: prompt,
            width: 512,
            height: 512,
            num_frames: 16,
            fps: 8
          };
        } else {
          continue; // Skip unknown models
        }

        console.log(`📡 Making request to ${modelName}...`);
        
        // Run the model with timeout
        const output = await Promise.race([
          replicate.run(modelName as any, { input }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 60000)
          )
        ]);
        
        console.log(`📦 Replicate response received:`, typeof output);
        
        if (output) {
          let videoUrl;
          
          // Handle different response formats
          if (Array.isArray(output)) {
            videoUrl = output[0];
          } else if (typeof output === 'string') {
            videoUrl = output;
          } else if (output && typeof output === 'object' && 'video' in output) {
            videoUrl = (output as any).video;
          }
          
          if (videoUrl) {
            console.log(`✅ Video generated successfully with ${modelName}!`);
            return NextResponse.json({ 
              video: videoUrl,
              model: modelName,
              isRealAI: true
            });
          }
        }

      } catch (error) {
        console.log(`❌ Error with model ${modelName}:`, error);
        continue;
      }
    }

    // If all models fail, return a helpful message
    console.log('⚠️ All Replicate video models failed, creating prompt-based message');
    
    // Analyze prompt for category
    const promptLower = prompt.toLowerCase();
    let category = 'general';
    
    if (promptLower.includes('music') || promptLower.includes('beat') || promptLower.includes('song')) {
      category = 'music visualization';
    } else if (promptLower.includes('dance') || promptLower.includes('move')) {
      category = 'dance performance';
    } else if (promptLower.includes('nature') || promptLower.includes('landscape')) {
      category = 'nature scene';
    }
    
    console.log(`🎬 Created prompt analysis for category: ${category}`);
    
    return NextResponse.json({
      message: `Video generation temporarily unavailable. Your prompt "${prompt}" would create an amazing ${category} video. Please try again later or contact support.`,
      promptAnalysis: {
        category,
        suggestedElements: promptLower.includes('music') ? 
          ['Audio visualization', 'Beat synchronization', 'Color dynamics'] :
          ['Dynamic movement', 'Visual effects', 'Smooth transitions']
      },
      isRealAI: false
    });

  } catch (error) {
    console.error('❌ Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
