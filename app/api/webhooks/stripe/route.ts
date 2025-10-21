// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Webhook secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Stripe Webhook Handler
 * 
 * What it does:
 * - Receives and validates webhook events from Stripe
 * - Processes payment confirmations and subscription updates
 * - Updates database records based on payment status
 * 
 * Why it's needed:
 * - Stripe sends payment confirmations asynchronously
 * - Can't rely on redirect URLs (user might close browser)
 * - Provides reliable, server-side payment verification
 * 
 * How it affects the system:
 * - Updates campaign status from 'pending_payment' to 'active'
 * - Records subscription changes and renewals
 * - Tracks all payment events for audit purposes
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')
  const stripe = getStripe()

  console.log('🔔 Webhook received, signature:', sig ? '✅ Present' : '❌ Missing')

  let event: Stripe.Event

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing Stripe signature or webhook secret')
    }

    // Verify webhook signature to ensure it's from Stripe
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    console.log('✅ Webhook signature verified:', event.type)
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // Use service role key for admin operations (bypasses RLS policies)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Process the webhook event
    await processWebhookEvent(event, supabase)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error(`❌ Error processing webhook:`, error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function processWebhookEvent(event: Stripe.Event, supabase: any) {
  console.log(`🎯 Processing webhook event: ${event.type}`)

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase)
      break

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabase)
      break

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
      break

    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase)
      break

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase)
      break

    case 'transfer.created':
      await handleTransferCreated(event.data.object as Stripe.Transfer, supabase)
      break

    case 'account.updated':
      await handleAccountUpdated(event.data.object as Stripe.Account, supabase)
      break

    case 'payout.paid':
      await handlePayoutPaid(event.data.object as Stripe.Payout, supabase)
      break

    case 'payout.failed':
      await handlePayoutFailed(event.data.object as Stripe.Payout, supabase)
      break

    case 'capability.updated':
      await handleCapabilityUpdated(event, supabase)
      break

    case 'account.application.deauthorized':
      await handleAccountDeauthorized(event.data.object as any, supabase)
      break

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`)
  }

  // Store webhook event for audit purposes
  try {
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        account_id: getAccountIdFromEvent(event),
        processed_at: new Date().toISOString(),
        data: event.data.object
      })
  } catch (error) {
    console.error('Error storing webhook event:', error)
  }
}

/**
 * Handles successful checkout sessions
 * 
 * What it does:
 * - Processes completed Stripe checkout sessions
 * - Updates campaign status from 'pending_payment' to 'active'
 * - Stores payment intent ID
 * - Sends admin notifications
 * 
 * Why matching by stripe_session_id:
 * - Initial campaign record has stripe_session_id set
 * - payment_intent_id is null until webhook receives it
 * - stripe_session_id is the reliable identifier for matching
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any) {
  try {
    console.log('💳 Checkout completed - FULL DETAILS:', {
      sessionId: session.id,
      amount: session.amount_total,
      status: session.payment_status,
      metadata: session.metadata,
      mode: session.mode,
      paymentIntent: session.payment_intent
    })
    
    // Handle successful payment for track upload or distribution
    if (session.metadata?.type === 'track_upload') {
      const { error } = await supabase
        .from('tracks')
        .update({ 
          payment_status: 'paid',
          stripe_payment_id: session.payment_intent as string,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.metadata.track_id)
      
      if (error) {
        console.error('❌ Error updating track payment:', error)
      } else {
        console.log(`✅ Track ${session.metadata.track_id} payment confirmed`)
      }
    }
    
    // Handle playlist pitching campaign purchases - UPDATED
    if (session.metadata?.type === 'playlist_campaign') {
      console.log('🎵 Processing playlist campaign payment...')

      const { userId, planId } = session.metadata

      if (!userId || !planId) {
        console.error('❌ Missing required metadata:', session.metadata)
        return
      }

      // Define plan details
      const plans: Record<string, { name: string; price: number; description: string }> = {
        indie: { 
          name: 'Indie Promotion', 
          price: 99.99,
          description: 'Promote all releases to 50+ playlists'
        },
        pro: { 
          name: 'Pro Campaign', 
          price: 299.99,
          description: 'Promote all releases to 150+ premium playlists'
        },
        superstar: { 
          name: 'Superstar Package', 
          price: 499.99,
          description: 'Promote all releases to 300+ top-tier playlists'
        }
      }

      const selectedPlan = plans[planId]

      if (!selectedPlan) {
        console.error('❌ Invalid plan ID:', planId)
        return
      }

      // Check if payment was successful
      if (session.payment_status === 'paid') {
        console.log('✅ Payment confirmed, updating campaign status...')

        // CRITICAL: Match by stripe_session_id (not payment_intent_id)
        // because initial campaign record has stripe_session_id set
        const { data: existingCampaign, error: updateError } = await supabase
          .from('playlist_campaigns')
          .update({
            status: 'active', // Change from pending_payment to active
            payment_status: 'paid', // Change from pending to paid
            payment_intent_id: session.payment_intent as string, // Store actual payment intent
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_session_id', session.id) // ← Match by session ID, not payment_intent_id
          .eq('user_id', userId)
          .select()
          .single()

        if (updateError && updateError.code === 'PGRST116') {
          // Campaign doesn't exist, create it now
          console.log('⚠️ Campaign not found, creating new record...')

          const { data: newCampaign, error: insertError } = await supabase
            .from('playlist_campaigns')
            .insert({
              user_id: userId,
              release_id: null, // Promotes all releases
              plan_type: planId,
              plan_price: selectedPlan.price,
              status: 'active',
              payment_status: 'paid',
              payment_intent_id: session.payment_intent as string,
              stripe_session_id: session.id,
              campaign_data: {
                plan_name: selectedPlan.name,
                plan_description: selectedPlan.description,
                campaign_type: 'all_releases',
                checkout_session_id: session.id
              },
              paid_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (insertError) {
            console.error('❌ Failed to create campaign:', insertError)
            return
          }

          console.log('✅ Campaign created:', newCampaign.id)

          // Send admin notification
          await sendAdminNotification(supabase, {
            userId,
            planId,
            planName: selectedPlan.name,
            amount: selectedPlan.price,
            sessionId: session.id,
            campaignId: newCampaign.id
          })

        } else if (updateError) {
          console.error('❌ Failed to update campaign:', updateError)
          return
        } else {
          console.log('✅ Campaign updated to active:', existingCampaign.id)

          // Send admin notification
          await sendAdminNotification(supabase, {
            userId,
            planId,
            planName: selectedPlan.name,
            amount: selectedPlan.price,
            sessionId: session.id,
            campaignId: existingCampaign.id
          })
        }

      } else if (session.payment_status === 'unpaid') {
        console.log('⚠️ Payment failed or incomplete')

        // Update campaign to failed status
        await supabase
          .from('playlist_campaigns')
          .update({
            status: 'payment_failed',
            payment_status: 'unpaid',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_session_id', session.id) // Match by session ID
          .eq('user_id', userId)
      }
    }
    
    // Handle legacy playlist pitching format (with release_id)
    if (session.metadata?.type === 'playlist_pitching') {
      const { data: release } = await supabase
        .from('releases')
        .select('title, artist_name')
        .eq('id', session.metadata.release_id)
        .single()

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', session.metadata.user_id)
        .single()

      // Record the purchase
      const { error: purchaseError } = await supabase
        .from('playlist_campaigns')
        .insert({
          user_id: session.metadata.user_id,
          release_id: session.metadata.release_id,
          plan_type: session.metadata.plan_id,
          plan_price: session.amount_total ? session.amount_total / 100 : 0,
          stripe_session_id: session.id,
          payment_intent_id: session.payment_intent as string,
          status: 'active',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })

      if (purchaseError) {
        console.error('❌ Error recording playlist campaign:', purchaseError)
      } else {
        console.log(`✅ Playlist campaign purchase recorded: ${session.metadata.plan_id}`)

        // Send notification to admin
        const adminNotification = {
          type: 'playlist_campaign_purchase',
          title: '🎵 New Playlist Campaign Purchase!',
          message: `${profile?.full_name || profile?.email || 'User'} purchased ${session.metadata.plan_id} plan for "${release?.title}" by ${release?.artist_name}. Amount: $${session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00'}`,
          data: {
            user_id: session.metadata.user_id,
            release_id: session.metadata.release_id,
            plan_id: session.metadata.plan_id,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            stripe_session_id: session.id
          },
          created_at: new Date().toISOString()
        }

        await supabase
          .from('admin_notifications')
          .insert(adminNotification)
      }
    }

    // Handle subscription purchases
    if (session.mode === 'subscription') {
      const subscriptionData = {
        artist_id: session.metadata?.artist_id,
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        status: 'active',
        current_period_end: new Date(session.expires_at * 1000).toISOString(),
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('artist_subscriptions')
        .upsert(subscriptionData, { 
          onConflict: 'stripe_subscription_id' 
        })
      
      if (error) {
        console.error('❌ Error creating subscription:', error)
      } else {
        console.log(`✅ Subscription created for artist ${session.metadata?.artist_id}`)
      }
    }
  } catch (error) {
    console.error('❌ Error in handleCheckoutCompleted:', error)
  }
}

/**
 * Sends admin notification for new playlist campaign purchases
 */
async function sendAdminNotification(supabase: any, data: {
  userId: string
  planId: string
  planName: string
  amount: number
  sessionId: string
  campaignId: string
}) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', data.userId)
      .single()

    const notification = {
      type: 'playlist_campaign_purchase',
      title: '🎵 New Playlist Campaign Purchase!',
      message: `${profile?.full_name || profile?.email || 'User'} purchased ${data.planName} plan. Amount: $${data.amount.toFixed(2)}`,
      data: {
        user_id: data.userId,
        plan_id: data.planId,
        plan_name: data.planName,
        amount: data.amount,
        stripe_session_id: data.sessionId,
        campaign_id: data.campaignId
      },
      read: false,
      created_at: new Date().toISOString()
    }

    await supabase.from('admin_notifications').insert(notification)
    console.log('📧 Admin notification sent')
  } catch (error) {
    console.error('❌ Error sending admin notification:', error)
  }
}

/**
 * Handles failed payment intents
 * Updates campaign status to failed
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    console.log('❌ Payment intent failed:', paymentIntent.id)

    // Update any campaigns using this payment intent
    const { error } = await supabase
      .from('playlist_campaigns')
      .update({
        status: 'payment_failed',
        payment_status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('❌ Error updating failed payment:', error)
    } else {
      console.log('✅ Campaign marked as payment failed')
    }
  } catch (error) {
    console.error('❌ Error in handlePaymentIntentFailed:', error)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, supabase: any) {
  try {
    console.log(`📋 Subscription ${subscription.status}:`, subscription.id)
    
    const updateData: any = {
      status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }

    if ((subscription as any).canceled_at) {
      updateData.canceled_at = new Date((subscription as any).canceled_at * 1000).toISOString()
    }

    const { error } = await supabase
      .from('artist_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscription.id)
    
    if (error) {
      console.error('❌ Error updating subscription:', error)
    } else {
      console.log(`✅ Subscription ${subscription.id} updated to ${subscription.status}`)
    }
  } catch (error) {
    console.error('❌ Error in handleSubscriptionUpdate:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  try {
    console.log('💰 Invoice payment succeeded:', invoice.id)
    
    // Record successful subscription payment
    if ((invoice as any).subscription) {
      const paymentData = {
        artist_id: invoice.metadata?.artist_id,
        amount: invoice.amount_paid,
        currency: invoice.currency.toUpperCase(),
        type: 'subscription_renewal',
        stripe_invoice_id: invoice.id,
        description: invoice.description || 'Subscription payment',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('payment_history')
        .insert(paymentData)
      
      if (error) {
        console.error('❌ Error recording payment:', error)
      } else {
        console.log(`✅ Payment recorded for invoice ${invoice.id}`)
      }
    }
  } catch (error) {
    console.error('❌ Error in handleInvoicePaymentSucceeded:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    console.log('🎵 Payment intent succeeded:', paymentIntent.id)
    
    // Handle one-time payments (track purchases, etc.)
    if (paymentIntent.metadata?.type === 'track_purchase') {
      const purchaseData = {
        track_id: paymentIntent.metadata.track_id,
        buyer_id: paymentIntent.metadata.buyer_id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        stripe_payment_id: paymentIntent.id,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('track_purchases')
        .insert(purchaseData)
      
      if (error) {
        console.error('❌ Error recording track purchase:', error)
      } else {
        console.log(`✅ Track purchase recorded: ${paymentIntent.metadata.track_id}`)
      }
    }
  } catch (error) {
    console.error('❌ Error in handlePaymentIntentSucceeded:', error)
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer, supabase: any) {
  try {
    console.log('💸 Transfer created:', transfer.id)
    
    // Track artist payouts
    if (transfer.metadata?.type === 'royalty_payout') {
      const payoutData = {
        artist_id: transfer.metadata.artist_id,
        amount: transfer.amount,
        currency: transfer.currency.toUpperCase(),
        stripe_transfer_id: transfer.id,
        release_id: transfer.metadata.release_id,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('artist_payouts')
        .insert(payoutData)
      
      if (error) {
        console.error('❌ Error recording transfer:', error)
      } else {
        console.log(`✅ Payout recorded: ${transfer.id}`)
      }
    }
  } catch (error) {
    console.error('❌ Error in handleTransferCreated:', error)
  }
}

async function handleAccountDeauthorized(application: any, supabase: any) {
  try {
    console.log('🔒 Connect account deauthorized:', application.account)
    
    // Handle account disconnection
    const { error } = await supabase
      .from('artist_profiles')
      .update({
        stripe_account_id: null,
        stripe_onboarding_complete: false,
        payouts_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', application.account)
    
    if (error) {
      console.error('❌ Error deauthorizing account:', error)
    } else {
      console.log(`✅ Account ${application.account} deauthorized`)
    }
  } catch (error) {
    console.error('❌ Error in handleAccountDeauthorized:', error)
  }
}

async function handleAccountUpdated(account: Stripe.Account, supabase: any) {
  try {
    const accountData = {
      onboarding_completed: account.details_submitted || false,
      payouts_enabled: account.payouts_enabled || false,
      charges_enabled: account.charges_enabled || false,
      details_submitted: account.details_submitted || false,
      verification_status: getVerificationStatus(account),
      updated_at: new Date().toISOString()
    }

    // Update the Stripe account in our database
    const { error } = await supabase
      .from('stripe_accounts')
      .update(accountData)
      .eq('stripe_account_id', account.id)

    if (error) {
      console.error('❌ Error updating account:', error)
    } else {
      console.log(`✅ Updated account ${account.id}:`, accountData)
    }

    // If account is now enabled, notify user
    if (account.charges_enabled && account.payouts_enabled) {
      await createNotification(supabase, account.id, {
        title: 'Account Ready!',
        message: 'Your Stripe account is now ready to accept payments and receive payouts.',
        type: 'success'
      })
    }
  } catch (error) {
    console.error('❌ Error in handleAccountUpdated:', error)
  }
}

async function handlePayoutPaid(payout: Stripe.Payout, supabase: any) {
  try {
    // Update payout status in our database
    const { error } = await supabase
      .from('royalty_payouts')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payout_id', payout.id)

    if (error) {
      console.error('❌ Error updating payout:', error)
    } else {
      console.log(`✅ Payout ${payout.id} marked as completed`)
    }

    // Notify user of successful payout
    await createNotification(supabase, payout.destination as string, {
      title: 'Payout Completed',
      message: `Your payout of $${(payout.amount / 100).toFixed(2)} has been processed.`,
      type: 'success'
    })
  } catch (error) {
    console.error('❌ Error in handlePayoutPaid:', error)
  }
}

async function handlePayoutFailed(payout: Stripe.Payout, supabase: any) {
  try {
    // Update payout status in our database
    const { error } = await supabase
      .from('royalty_payouts')
      .update({ 
        status: 'failed',
        failure_reason: payout.failure_message || 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payout_id', payout.id)

    if (error) {
      console.error('❌ Error updating failed payout:', error)
    } else {
      console.log(`✅ Payout ${payout.id} marked as failed`)
    }

    // Notify user of failed payout
    await createNotification(supabase, payout.destination as string, {
      title: 'Payout Failed',
      message: `Your payout of $${(payout.amount / 100).toFixed(2)} failed: ${payout.failure_message}`,
      type: 'error'
    })
  } catch (error) {
    console.error('❌ Error in handlePayoutFailed:', error)
  }
}

async function handleCapabilityUpdated(event: Stripe.Event, supabase: any) {
  try {
    const capability = event.data.object as Stripe.Capability
    const accountId = event.account

    if (capability.status === 'active') {
      await createNotification(supabase, accountId!, {
        title: 'New Capability Enabled',
        message: `${capability.id} capability is now active on your account.`,
        type: 'success'
      })
    } else if (capability.status === 'inactive') {
      await createNotification(supabase, accountId!, {
        title: 'Capability Disabled',
        message: `${capability.id} capability has been disabled. Please check your account requirements.`,
        type: 'warning'
      })
    }
  } catch (error) {
    console.error('❌ Error in handleCapabilityUpdated:', error)
  }
}

function getAccountIdFromEvent(event: Stripe.Event): string | null {
  if (event.account) {
    return event.account
  }

  // Try to extract account ID from the object
  const obj = event.data.object as any
  if (obj.account) {
    return obj.account
  }

  return null
}

function getVerificationStatus(account: Stripe.Account): string {
  if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
    return 'verified'
  } else if (account.details_submitted) {
    return 'pending_review'
  } else {
    return 'pending_submission'
  }
}

async function createNotification(supabase: any, accountId: string, notification: {
  title: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
}) {
  try {
    // Get user ID from Stripe account
    const { data: stripeAccount } = await supabase
      .from('stripe_accounts')
      .select('user_id')
      .eq('stripe_account_id', accountId)
      .single()

    if (stripeAccount) {
      await supabase
        .from('notifications')
        .insert({
          user_id: stripeAccount.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: false
        })
    }
  } catch (error) {
    console.error('❌ Error creating notification:', error)
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
    supported_events: [
      'checkout.session.completed',
      'customer.subscription.updated', 
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'transfer.created',
      'account.updated',
      'payout.paid',
      'payout.failed',
      'capability.updated',
      'account.application.deauthorized'
    ]
  })
}