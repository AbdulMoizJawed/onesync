/**
 * SEO and Meta Tag Utilities
 */

import { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'music.song' | 'music.album' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

const DEFAULT_SEO = {
  title: 'Music Distribution Platform - Upload, Distribute & Monetize Your Music',
  description: 'The complete music ecosystem for independent artists. Upload, distribute, collaborate, and monetize your music with AI-powered tools, fair payouts, and artist community.',
  keywords: [
    'music distribution',
    'independent artists',
    'music upload',
    'streaming platform',
    'artist collaboration',
    'music monetization',
    'AI mastering',
    'music community',
    'fair payouts',
    'music industry tools'
  ],
  image: '/og-image.jpg',
  url: 'https://your-domain.com',
  siteName: 'Music Distribution Platform',
  locale: 'en_US',
  twitterHandle: '@yourmusicapp'
}

export function generateSEO({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = []
}: SEOProps = {}): Metadata {
  const seoTitle = title 
    ? `${title} | ${DEFAULT_SEO.siteName}`
    : DEFAULT_SEO.title

  const seoDescription = description || DEFAULT_SEO.description
  const seoImage = image || DEFAULT_SEO.image
  const seoUrl = url || DEFAULT_SEO.url
  const allKeywords = [...DEFAULT_SEO.keywords, ...keywords, ...tags]

  const metadata: Metadata = {
    title: seoTitle,
    description: seoDescription,
    keywords: allKeywords.join(', '),
    
    // Open Graph
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: seoUrl,
      siteName: DEFAULT_SEO.siteName,
      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: seoTitle,
        }
      ],
      locale: DEFAULT_SEO.locale,
      type: type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags })
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      creator: DEFAULT_SEO.twitterHandle,
      images: [seoImage],
    },

    // Additional meta tags
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification tags (add your actual verification codes)
    verification: {
      google: 'your-google-verification-code',
    },

    // Canonical URL
    alternates: {
      canonical: seoUrl,
    }
  }

  return metadata
}

// Specific SEO generators for different page types
export const pageSEO = {
  home: (): Metadata => generateSEO({
    title: 'Home',
    description: 'Upload, distribute, and monetize your music with the complete platform for independent artists. Join our community of creators.',
    keywords: ['music platform', 'artist tools', 'music distribution'],
    type: 'website'
  }),

  upload: (): Metadata => generateSEO({
    title: 'Upload Your Music',
    description: 'Upload your music tracks and albums. Distribute to major streaming platforms and start earning from your creativity.',
    keywords: ['upload music', 'music distribution', 'streaming platforms'],
    type: 'website'
  }),

  releases: (): Metadata => generateSEO({
    title: 'Music Releases',
    description: 'Browse and manage your music releases. Track performance, edit metadata, and distribute to global audiences.',
    keywords: ['music releases', 'track performance', 'music management'],
    type: 'website'
  }),

  forum: (): Metadata => generateSEO({
    title: 'Music Community Forum',
    description: 'Connect with fellow musicians, share tips, collaborate on projects, and discuss the latest in music industry.',
    keywords: ['music community', 'musician forum', 'collaboration', 'music discussion'],
    type: 'website'
  }),

  artists: (): Metadata => generateSEO({
    title: 'Discover Artists',
    description: 'Discover talented independent artists, explore their music, and connect for potential collaborations.',
    keywords: ['independent artists', 'music discovery', 'artist collaboration'],
    type: 'website'
  }),

  payments: (): Metadata => generateSEO({
    title: 'Payments & Payouts',
    description: 'Manage your earnings, view payment history, and set up automatic payouts. Fair and transparent monetization.',
    keywords: ['music payments', 'artist payouts', 'music earnings'],
    type: 'website'
  }),

  analytics: (): Metadata => generateSEO({
    title: 'Music Analytics',
    description: 'Comprehensive analytics for your music. Track streams, revenue, audience demographics, and performance insights.',
    keywords: ['music analytics', 'streaming stats', 'audience insights'],
    type: 'website'
  }),

  mastering: (): Metadata => generateSEO({
    title: 'AI Music Mastering',
    description: 'Professional AI-powered mastering for your tracks. Enhance your music quality with advanced audio processing.',
    keywords: ['AI mastering', 'audio mastering', 'music production'],
    type: 'website'
  })
}

// Dynamic SEO for specific content
export const contentSEO = {
  artist: (artistName: string, bio?: string): Metadata => generateSEO({
    title: `${artistName} - Artist Profile`,
    description: bio ? bio.substring(0, 150) + '...' : `Discover music by ${artistName}. Listen to their latest releases and connect for collaborations.`,
    keywords: ['artist profile', artistName.toLowerCase(), 'independent music'],
    type: 'profile'
  }),

  release: (title: string, artistName: string, description?: string): Metadata => generateSEO({
    title: `${title} by ${artistName}`,
    description: description || `Listen to ${title} by ${artistName}. Stream now on the music distribution platform.`,
    keywords: ['music release', title.toLowerCase(), artistName.toLowerCase()],
    type: 'music.album'
  }),

  forumPost: (title: string, excerpt?: string, author?: string): Metadata => generateSEO({
    title: title,
    description: excerpt ? excerpt.substring(0, 150) + '...' : `Join the discussion about ${title} in our music community forum.`,
    keywords: ['music discussion', 'forum post', 'music community'],
    type: 'article',
    author,
    section: 'Forum'
  })
}

// Structured data generators
export const structuredData = {
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SEO.siteName,
    url: DEFAULT_SEO.url,
    logo: `${DEFAULT_SEO.url}/logo.png`,
    sameAs: [
      'https://twitter.com/yourmusicapp',
      'https://facebook.com/yourmusicapp',
      'https://instagram.com/yourmusicapp'
    ],
    description: DEFAULT_SEO.description
  }),

  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DEFAULT_SEO.siteName,
    url: DEFAULT_SEO.url,
    description: DEFAULT_SEO.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${DEFAULT_SEO.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }),

  musicGroup: (artistName: string, description?: string, image?: string) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artistName,
    description: description,
    image: image,
    url: `${DEFAULT_SEO.url}/artists/${artistName.toLowerCase().replace(/\s+/g, '-')}`
  }),

  musicAlbum: (albumTitle: string, artistName: string, tracks?: string[], image?: string) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: albumTitle,
    byArtist: {
      '@type': 'MusicGroup',
      name: artistName
    },
    image: image,
    ...(tracks && {
      track: tracks.map((track, index) => ({
        '@type': 'MusicRecording',
        name: track,
        position: index + 1,
        byArtist: {
          '@type': 'MusicGroup',
          name: artistName
        }
      }))
    })
  }),

  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  })
}

// Sitemap generator utility
export const generateSitemap = (routes: string[]): string => {
  const baseUrl = DEFAULT_SEO.url
  const currentDate = new Date().toISOString()

  const urls = routes.map(route => `
  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`
}

// Robots.txt generator
export const generateRobotsTxt = (): string => {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${DEFAULT_SEO.url}/sitemap.xml

# Disallow development/admin pages
Disallow: /dev/
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /auth/

# Allow important pages
Allow: /auth/login
Allow: /auth/signup`
}
