import { NextResponse } from 'next/server'
import { getApiStatus } from '@/lib/env-config'

interface DetailedStatus {
  status: ReturnType<typeof getApiStatus>
  healthScore: number
  setupGuide: string[]
  envTemplate: string
  lastChecked: string
}

export async function GET() {
  try {
    const status = getApiStatus()
    
    // Calculate health score
    const total = Object.keys(status).length
    const configured = Object.values(status).filter(Boolean).length
    const healthScore = Math.round((configured / total) * 100)
    
    // Setup guide steps
    const setupGuide = [
      'Copy .env.example to .env.local in your project root',
      'Add your Supabase URL and anon key (required)',
      'Add Stripe keys for payment processing (recommended)',
      'Add music API keys for enhanced functionality',
      'Restart your development server',
      'Refresh this page to see updated status'
    ]
    
    // Environment template
    const envTemplate = `# Music Distribution App - Environment Variables
# Copy to .env.local and fill in your values

# Required: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Recommended: Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key_here
STRIPE_SECRET_KEY=sk_live_or_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Optional: Music Industry APIs
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
ROEX_API_KEY=your_roex_mastering_key
SPOTONTRACK_API_KEY=your_spotontrack_key

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id`

    const response: DetailedStatus = {
      status,
      healthScore,
      setupGuide,
      envTemplate,
      lastChecked: new Date().toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('API status check failed:', error)
    return NextResponse.json(
      { error: 'Failed to check API status' },
      { status: 500 }
    )
  }
}

// Add health check endpoint
export async function POST() {
  try {
    const status = getApiStatus()
    
    // Test critical services
    const healthChecks = {
      supabase: status.supabase,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({
      healthy: status.supabase, // At minimum, Supabase must be configured
      checks: healthChecks
    })
  } catch (error) {
    return NextResponse.json(
      { healthy: false, error: 'Health check failed' },
      { status: 500 }
    )
  }
}
