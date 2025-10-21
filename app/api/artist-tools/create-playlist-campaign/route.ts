// app/api/artist-tools/create-playlist-campaign/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createStripeClient } from '@/lib/stripe-server'

/**
 * Creates a Stripe checkout session for playlist pitching campaigns
 * 
 * What it does:
 * - Authenticates the user via Supabase session
 * - Validates the selected plan
 * - Creates a Stripe checkout session
 * - Creates a campaign record in database with 'pending_payment' status
 * 
 * Why it's needed:
 * - Handles the payment flow for playlist campaigns
 * - Creates initial database record before payment
 * - Redirects user to Stripe for secure payment processing
 * 
 * How it affects the system:
 * - Creates campaign with pending status
 * - Webhook will update to active once payment completes
 * - User is redirected to Stripe checkout
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = createStripeClient()
    const cookieStore = await cookies()
    
    // Create Supabase client with proper cookie handling for SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )
    
    // Get user session - more reliable than getUser() in API routes
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('🔐 Session check:', { 
      hasSession: !!session, 
      sessionError,
      userId: session?.user?.id 
    })
    
    if (sessionError || !session?.user) {
      console.error('❌ Authentication failed:', sessionError)
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in again',
        details: sessionError?.message 
      }, { status: 401 })
    }

    const user = session.user

    // Parse request body
    const body = await req.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Define plan pricing (in cents for Stripe)
    const plans = {
      indie: { 
        name: 'Indie Promotion', 
        price: 9999, // $99.99
        description: 'Promote all your releases to 50+ playlists' 
      },
      pro: { 
        name: 'Pro Campaign', 
        price: 29999, // $299.99
        description: 'Promote all your releases to 150+ premium playlists' 
      },
      superstar: { 
        name: 'Superstar Package', 
        price: 49999, // $499.99
        description: 'Promote all your releases to 300+ top-tier playlists' 
      }
    }

    const selectedPlan = plans[planId as keyof typeof plans]
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    console.log('💳 Creating Stripe checkout for:', {
      userId: user.id,
      email: user.email,
      plan: selectedPlan.name
    })

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${selectedPlan.name} - Playlist Pitching`,
            description: selectedPlan.description,
          },
          unit_amount: selectedPlan.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/artist-tools?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/artist-tools?canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
        type: 'playlist_campaign', // Critical: webhook uses this to identify the payment type
        userEmail: user.email || ''
      },
      customer_email: user.email || undefined
    })

    console.log('✅ Stripe checkout created:', checkoutSession.id)

    // Create campaign record in database with pending status
    // Webhook will update this to 'active' once payment completes
    const { data: campaignData, error: insertError } = await supabase
      .from('playlist_campaigns')
      .insert({
        user_id: user.id,
        release_id: null, // Promotes all releases, not specific to one
        plan_type: planId,
        plan_price: selectedPlan.price / 100, // Convert cents to dollars
        status: 'pending_payment', // Will be updated to 'active' by webhook
        payment_status: 'pending', // Will be updated to 'paid' by webhook
        stripe_session_id: checkoutSession.id, // Store session ID for webhook matching
        payment_intent_id: null, // Will be populated by webhook with actual payment intent
        campaign_data: {
          plan_name: selectedPlan.name,
          plan_description: selectedPlan.description,
          campaign_type: 'all_releases',
          checkout_session_id: checkoutSession.id
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('⚠️ Error creating campaign record:', insertError)
      // Don't fail the request - webhook will create/update the record
      // The Stripe session is already created, so we continue
    } else {
      console.log('✅ Campaign record created:', campaignData?.id)
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    })

  } catch (error) {
    console.error('❌ Error in create-playlist-campaign API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}