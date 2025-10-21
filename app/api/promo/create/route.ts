import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { linkly } from '@/lib/linkly'

export async function POST(req: NextRequest) {
  console.log('🎵 Creating promo page...')
  
  try {
    // Get authorization token
    const authorization = req.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('❌ Auth failed:', authError)
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 })
    }

    console.log('✅ User verified:', user.email)

    // Check if promo_pages table exists
    try {
      console.log('🔍 Checking if promo_pages table exists...')
      const { error: tableCheckError } = await supabase
        .from('promo_pages')
        .select('id')
        .limit(1)
      
      if (tableCheckError) {
        console.error('❌ promo_pages table check failed:', tableCheckError)
        // Create the table if it doesn't exist
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.promo_pages (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            bio TEXT,
            social_links JSONB DEFAULT '{}',
            slug TEXT NOT NULL UNIQUE,
            short_url TEXT,
            is_active BOOLEAN DEFAULT true,
            view_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_promo_pages_user_id ON public.promo_pages(user_id);
          CREATE INDEX IF NOT EXISTS idx_promo_pages_slug ON public.promo_pages(slug);
          CREATE INDEX IF NOT EXISTS idx_promo_pages_is_active ON public.promo_pages(is_active);
          
          -- Enable RLS
          ALTER TABLE public.promo_pages ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY IF NOT EXISTS "Users can view their own promo pages" ON public.promo_pages
            FOR SELECT USING (auth.uid() = user_id);
            
          CREATE POLICY IF NOT EXISTS "Users can insert their own promo pages" ON public.promo_pages
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
          CREATE POLICY IF NOT EXISTS "Users can update their own promo pages" ON public.promo_pages
            FOR UPDATE USING (auth.uid() = user_id);
            
          CREATE POLICY IF NOT EXISTS "Users can delete their own promo pages" ON public.promo_pages
            FOR DELETE USING (auth.uid() = user_id);
            
          -- Allow public access to promo pages by slug (for public viewing)
          CREATE POLICY IF NOT EXISTS "Public can view active promo pages by slug" ON public.promo_pages
            FOR SELECT USING (is_active = true);
        `
        
        const { error: createTableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
        if (createTableError) {
          console.error('❌ Failed to create promo_pages table:', createTableError)
          return NextResponse.json({ 
            error: 'Database setup error - promo_pages table not found',
            details: createTableError.message 
          }, { status: 500 })
        }
        console.log('✅ promo_pages table created successfully')
      } else {
        console.log('✅ promo_pages table exists')
      }
    } catch (tableCheckError) {
      console.error('❌ Error checking promo_pages table:', tableCheckError)
    }

    // Get request data
    const { title, bio, social, imageUrl } = await req.json()
    
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate unique slug
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const timestamp = Date.now()
    const uniqueSlug = `${baseSlug}-${timestamp}`

    console.log('📝 Creating promo page:', { title, slug: uniqueSlug })

    // Insert into database (without image_url for now)
    const { data: promoPage, error: insertError } = await supabase
      .from('promo_pages')
      .insert({
        user_id: user.id,
        title,
        bio: bio || '',
        social_links: social || {},
        slug: uniqueSlug,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Database error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create promo page',
        details: insertError.message 
      }, { status: 500 })
    }

    console.log('✅ Database record created:', promoPage.id)

    // Generate URLs
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    // Make sure we have a proper base URL (with protocol)
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
    
    // Ensure baseUrl has a protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `${protocol}://${baseUrl}`
    }
    
    // Ensure baseUrl doesn't end with a slash
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }
    
    const fullUrl = `${baseUrl}/promo/${uniqueSlug}`

    console.log('🔗 Full URL:', fullUrl)

    // Try to create Linkly short URL
    let shortUrl = fullUrl
    try {
      if (process.env.LINKLY_EMAIL) {
        console.log('📡 Creating Linkly short URL...')
        try {
          const linkResponse = await linkly.createLink({
            url: fullUrl,
            name: `${title} - Promo Page`,
            note: `Promo page for ${title} by ${user.email}`
          })
          
          shortUrl = linkResponse.full_url || fullUrl
          console.log('✅ Linkly URL created:', shortUrl)
  
          // Update database with short URL
          await supabase
            .from('promo_pages')
            .update({ short_url: shortUrl })
            .eq('id', promoPage.id)
        } catch (linkApiError) {
          console.warn('⚠️ Linkly API error, using full URL:', linkApiError)
          // Even if Linkly fails, continue with the full URL
          shortUrl = fullUrl
          
          // Update database with the full URL as a fallback
          await supabase
            .from('promo_pages')
            .update({ short_url: fullUrl })
            .eq('id', promoPage.id)
        }
      } else {
        console.log('ℹ️ LINKLY_EMAIL not configured, using full URL')
        // Update database with the full URL
        await supabase
          .from('promo_pages')
          .update({ short_url: fullUrl })
          .eq('id', promoPage.id)
      }
    } catch (linkError) {
      console.warn('⚠️ Linkly process failed, using full URL:', linkError)
      // Ensure we still update the database with the full URL
      try {
        await supabase
          .from('promo_pages')
          .update({ short_url: fullUrl })
          .eq('id', promoPage.id)
      } catch (dbError) {
        console.error('❌ Failed to update database with URL:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      url: shortUrl,
      fullUrl,
      slug: uniqueSlug,
      id: promoPage.id
    })

  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}