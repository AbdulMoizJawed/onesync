// Remove Supabase fallback - using proper environment configuration instead

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly expose environment variables to browser
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },

  // Basic optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  },
  
  // Disable caching to prevent auth session loss
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // Fix rewrites for static assets
  async rewrites() {
    return [
      {
        source: '/_next/static/:path*',
        destination: '/_next/static/:path*',
      },
    ]
  },

  webpack: (config) => {
    // Suppress websocket warnings from Supabase realtime
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
    ]
    return config
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'image-cdn-ak.spotifycdn.com',
      },
      {
        protocol: 'https',
        hostname: 'image-cdn-fa.spotifycdn.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig
