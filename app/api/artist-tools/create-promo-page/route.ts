import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { linkly } from '@/lib/linkly'

export async function POST(req: NextRequest) {
  console.log('🎵 Create promo page API called')
  
  try {
    // Get auth token from headers
    const authorization = req.headers.get('Authorization')
    console.log('Authorization header present:', !!authorization)
    
    if (!authorization?.startsWith('Bearer ')) {
      console.log('❌ No valid authorization token')
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    console.log('Token extracted, length:', token.length)
    
    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    console.log('✅ User authenticated:', user.email)

    const body = await req.json()
    const { title, bio, social, imageUrl } = body
    
    console.log('📝 Request body received:')
    console.log('- Title:', title)
    console.log('- Bio length:', bio?.length || 0)
    console.log('- Social links:', Object.keys(social || {}))
    console.log('- Image URL:', !!imageUrl)

    if (!title || title.trim() === '') {
      console.log('❌ Title is required')
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate a unique slug for the promo page
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const timestamp = Date.now()
    const uniqueSlug = `${baseSlug}-${user.id.slice(-8)}-${timestamp.toString().slice(-6)}`
    
    console.log('Generated unique slug:', uniqueSlug)

    // Create promo page record in database
    const insertData = {
      user_id: user.id,
      title,
      bio,
      social_links: social,
      slug: uniqueSlug,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    
    // Try to add image_url if provided and column exists
    if (imageUrl) {
      console.log('Attempting to include image_url:', imageUrl);
    }

    const { data: promoPage, error: insertError } = await supabase
      .from('promo_pages')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating promo page:', insertError)
      console.error('Insert error details:', JSON.stringify(insertError, null, 2))
      return NextResponse.json({ 
        error: 'Failed to create promo page', 
        details: insertError.message || 'Unknown database error',
        code: insertError.code || 'UNKNOWN'
      }, { status: 500 })
    }

  // Generate the promo page URL (respect current host/port in dev)
  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
  const promoUrl = `${baseUrl}/promo/${uniqueSlug}`
    
    console.log('Generated promo URL:', promoUrl)

    // Create a shortened link using Linkly (fallback to full URL on failure)
    let shortUrl = promoUrl
    try {
      console.log('Creating Linkly short URL for:', promoUrl)
      const linkResponse = await linkly.createLink({
        url: promoUrl,
        name: `${title} - Promo Page`,
        note: `Promo page for ${title} by ${user.email}`,
      })

      shortUrl = linkResponse.full_url || linkResponse.url || promoUrl
      console.log('Linkly response - Short URL:', shortUrl)

      // Update the promo page record with the short URL if available
      if (shortUrl && shortUrl !== promoUrl) {
        await supabase
          .from('promo_pages')
          .update({ short_url: shortUrl })
          .eq('id', promoPage.id)
      }
    } catch (linkError) {
      console.error('Failed to create Linkly short URL:', linkError)
      console.error('Using full URL as fallback:', promoUrl)
      shortUrl = promoUrl
    }

    console.log('✅ Promo page created successfully!')
    console.log('🔗 Final URL:', shortUrl)

    return NextResponse.json({
      success: true,
      url: shortUrl,
      fullUrl: promoUrl,
      slug: uniqueSlug,
      id: promoPage.id
    })

  } catch (error) {
    console.error('Error in create-promo-page API:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
