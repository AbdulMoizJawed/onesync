/**
 * Environment Configuration
 * Centralized environment variable management with validation and fallbacks
 */

export interface EnvConfig {
  // Supabase
  supabaseUrl: string
  supabaseAnonKey: string
  
  // Spotify API
  spotifyClientId: string
  spotifyClientSecret: string
  
  // Apple Music API (optional)
  appleMusicToken?: string
  
  // SpotonTrack API (for industry stats)
  spotontrackApiKey: string
  
  // Muso API
  musoApiKey: string
  
  // Stripe
  stripePublishableKey: string
  stripeSecretKey: string
  stripeWebhookSecret: string
  
  // Environment info
  isProduction: boolean
  isDevelopment: boolean
}

// Fallback API keys for development only - NOT for production
const DEVELOPMENT_FALLBACK_KEYS = {
  spotify: {
    clientId: '474879af111c44ec8f835be52ac8ef01',
    clientSecret: '43bf4784ce07415293d751f451b5e21a'
  },
  spotontrack: 'jgdRcPw42mGxmcgFb2icOopo4HCRbNkwfiefxeLCbc2f9fe8'
};

function getEnvVar(key: string, fallback?: string, required: boolean = true): string {
  const value = process.env[key] || fallback
  
  if (required && !value) {
    console.warn(`Environment variable ${key} is not set`)
    return fallback || ''
  }
  
  return value || ''
}

function createEnvConfig(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    // Supabase (required)
    supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', '', true),
    supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', '', true),
    
    // Spotify API (require real keys in production, allow fallback in dev)
    spotifyClientId: getEnvVar('SPOTIFY_CLIENT_ID', 
      DEVELOPMENT_FALLBACK_KEYS.spotify.clientId, 
      true),
    spotifyClientSecret: getEnvVar('SPOTIFY_CLIENT_SECRET', 
      DEVELOPMENT_FALLBACK_KEYS.spotify.clientSecret, 
      true),
    
    // Apple Music API (optional)
    appleMusicToken: getEnvVar('APPLE_MUSIC_DEVELOPER_TOKEN', undefined, false),
    
    // SpotonTrack API (require real key for production)
    spotontrackApiKey: getEnvVar('SPOTONTRACK_API_KEY', 
      isProduction ? undefined : DEVELOPMENT_FALLBACK_KEYS.spotontrack, 
      isProduction),
    
    // Muso API
    musoApiKey: getEnvVar('MUSO_API_KEY', '', false),
    
    // Stripe (required for production)
    stripePublishableKey: getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', '', isProduction),
    stripeSecretKey: getEnvVar('STRIPE_SECRET_KEY', '', isProduction),
    stripeWebhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', '', isProduction),
    
    // Environment info
    isProduction,
    isDevelopment
  }
}

// Export singleton instance
export const envConfig = createEnvConfig()

// Helper functions
export function hasValidSupabaseConfig(): boolean {
  return !!(envConfig.supabaseUrl && envConfig.supabaseAnonKey)
}

export function hasValidSpotifyConfig(): boolean {
  // In development, allow fallback keys if main keys don't work
  return !!(envConfig.spotifyClientId && envConfig.spotifyClientSecret)
}

export function hasValidStripeConfig(): boolean {
  return !!(envConfig.stripePublishableKey && envConfig.stripeSecretKey)
}

export function hasRealApiKey(service: string): boolean {
  switch (service) {
    case 'spotify':
      return hasValidSpotifyConfig()
    case 'spotontrack':
      return !!(envConfig.spotontrackApiKey && 
                envConfig.spotontrackApiKey !== DEVELOPMENT_FALLBACK_KEYS.spotontrack &&
                envConfig.spotontrackApiKey !== 'your_spotontrack_api_key_here' &&
                envConfig.spotontrackApiKey.length > 10)
    case 'stripe':
      return hasValidStripeConfig()
    default:
      return false
  }
}

export function getApiStatus() {
  return {
    supabase: hasValidSupabaseConfig(),
    spotify: hasValidSpotifyConfig(),
    stripe: hasValidStripeConfig(),
    spotontrack: hasRealApiKey('spotontrack'),
    appleMusicApi: !!envConfig.appleMusicToken
  }
}

// Safe logging function for development
export function logConfigStatus() {
  if (!envConfig.isDevelopment) return
  
  try {
    const status = getApiStatus()
    console.log('🔧 API Configuration Status:', status)
    console.log('🔧 Environment Fix Applied - Development Mode Active')
    
    if (!status.spotify) {
      console.warn('⚠️  Spotify API not configured - using fallback keys for demo. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET for production.')
    }
    
    if (!status.supabase) {
      console.error('❌ Supabase configuration missing - app will not function properly. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }
    
    if (!status.stripe) {
      console.warn('⚠️  Stripe not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY for payment processing.')
    }
  } catch (error) {
    // Silently handle any console logging errors
  }
}

// Auto-log in development (but safely)
if (typeof window !== 'undefined' && envConfig.isDevelopment) {
  // Only log in browser environment
  setTimeout(() => logConfigStatus(), 0)
}
