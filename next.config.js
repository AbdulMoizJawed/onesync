/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: 'is1-ssl.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'cdns-images.dzcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'genius.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    },
    optimizePackageImports: ['@mui/material', '@mui/icons-material', 'antd'],
  },
  // Temporarily ignore ESLint errors during production builds to avoid blocking
  // Builds while we align ESLint versions/plugins. This does NOT affect dev.
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Simplified webpack config - only essential fallbacks
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
