import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ExternalLink, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SpotifyIcon, AppleMusicIcon, YouTubeIcon, InstagramIcon, TikTokIcon } from '@/components/ui/platform-icons'

interface PromoPageData {
  id: string
  title: string
  bio: string
  social_links: {
    spotify?: string
    apple?: string
    youtube?: string
    instagram?: string
    tiktok?: string
  }
  created_at: string
}

async function getPromoPage(slug: string): Promise<PromoPageData | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('promo_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.log('Promo page not found:', slug, error)
    return null
  }

  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  return {
    title: `Promo Page - ${resolvedParams.slug}`,
  }
}

interface PromoPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PromoPage(props: PromoPageProps) {
  // Await the params promise
  const params = await props.params
  const { slug } = params
  
  const promo = await getPromoPage(slug)

  if (!promo) {
    notFound()
  }

  const platformButtons = [
    { 
      name: 'Spotify', 
      url: promo.social_links.spotify, 
      color: 'bg-green-500 hover:bg-green-600 text-white',
      icon: SpotifyIcon
    },
    { 
      name: 'Apple Music', 
      url: promo.social_links.apple, 
      color: 'bg-black hover:bg-gray-900 text-white',
      icon: AppleMusicIcon
    },
    { 
      name: 'YouTube', 
      url: promo.social_links.youtube, 
      color: 'bg-red-600 hover:bg-red-700 text-white',
      icon: YouTubeIcon
    },
    { 
      name: 'Instagram', 
      url: promo.social_links.instagram, 
      color: 'bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white',
      icon: InstagramIcon
    },
    { 
      name: 'TikTok', 
      url: promo.social_links.tiktok, 
      color: 'bg-black hover:bg-gray-900 text-white',
      icon: TikTokIcon
    }
  ]

  const availableLinks = platformButtons.filter(platform => {
    const url = platform.url?.trim()
    return url && url !== '' && url !== 'undefined' && url !== 'null'
  }).map(platform => {
    let formattedUrl = platform.url?.trim() || ''
    
    // Ensure URL has proper protocol
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`
    }
    
    return {
      ...platform,
      url: formattedUrl
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                {promo.title}
              </h1>
              {promo.bio && (
                <p className="text-lg text-gray-200 leading-relaxed max-w-xl mx-auto">
                  {promo.bio}
                </p>
              )}
            </div>

            {/* Platform Links */}
            {availableLinks.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white text-center mb-6 flex items-center justify-center gap-2">
                  <Globe className="w-5 h-5" />
                  Listen & Follow
                </h2>
                <div className="grid gap-3">
                  {availableLinks.map((platform) => {
                    const IconComponent = platform.icon
                    return (
                      <a
                        key={platform.name}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-3 w-full h-14 text-lg font-medium ${platform.color} border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] rounded-lg no-underline`}
                      >
                        <IconComponent size={24} />
                        {platform.name}
                        <ExternalLink className="w-4 h-4 opacity-75" />
                      </a>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300 text-lg">
                  More links coming soon!
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-300">
                Created with OneSync Music Distribution
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}